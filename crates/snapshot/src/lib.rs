use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::Path;
use world_core::{Agent, Object, Room, WorldState};

#[derive(Debug)]
pub enum SnapshotError {
    Write { path: String, source: std::io::Error },
    Read { path: String, source: std::io::Error },
    Parse { path: String, message: String },
}

impl Display for SnapshotError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            SnapshotError::Write { path, source } => write!(f, "snapshot write failed at {path}: {source}"),
            SnapshotError::Read { path, source } => write!(f, "snapshot read failed at {path}: {source}"),
            SnapshotError::Parse { path, message } => write!(f, "snapshot parse failed at {path}: {message}"),
        }
    }
}
impl std::error::Error for SnapshotError {}

pub fn save_snapshot(path: impl AsRef<Path>, state: &WorldState) -> Result<(), SnapshotError> {
    let path = path.as_ref();
    let mut out = String::new();
    out.push_str("format: dragonworld-snapshot-v1\n");
    out.push_str(&format!("version: {}\n", state.version));
    out.push_str(&format!("current_room: {}\n", state.current_room));
    out.push_str(&format!("ledger_offset: {}\n", state.ledger_offset));

    out.push_str("[rooms]\n");
    for room in state.rooms.values() {
        let exits = room.exits.iter().map(|(k, v)| format!("{k}>{v}")).collect::<Vec<_>>().join(",");
        out.push_str(&format!(
            "{}|{}|{}|{}|{}|{}|{}\n",
            room.id,
            room.name,
            room.description,
            exits,
            room.objects.join(","),
            room.agents.join(","),
            room.permissions.join(",")
        ));
    }

    out.push_str("[agents]\n");
    for agent in state.agents.values() {
        let gov = agent.governance.iter().map(|(k, v)| format!("{k}>{v}")).collect::<Vec<_>>().join(",");
        out.push_str(&format!(
            "{}|{}|{}|{}|{}|{}|{}|{}|{}\n",
            agent.id,
            agent.name,
            agent.title,
            agent.role,
            agent.owner_room,
            agent.supervisor.clone().unwrap_or_else(|| "null".to_string()),
            agent.skills.join(","),
            agent.memory_namespace,
            gov
        ));
    }

    out.push_str("[objects]\n");
    for object in state.objects.values() {
        out.push_str(&format!(
            "{}|{}|{}|{}|{}|{}\n",
            object.id,
            object.name,
            object.object_type,
            object.room,
            object.interactions.join(","),
            object.status
        ));
    }

    fs::write(path, out).map_err(|source| SnapshotError::Write { path: path.display().to_string(), source })
}

pub fn load_snapshot(path: impl AsRef<Path>) -> Result<WorldState, SnapshotError> {
    let path = path.as_ref();
    let raw = fs::read_to_string(path).map_err(|source| SnapshotError::Read { path: path.display().to_string(), source })?;

    let mut version = String::new();
    let mut current_room = String::new();
    let mut ledger_offset = 0usize;
    let mut rooms: HashMap<String, Room> = HashMap::new();
    let mut agents: HashMap<String, Agent> = HashMap::new();
    let mut objects: HashMap<String, Object> = HashMap::new();
    let mut section = "";

    for line in raw.lines() {
        if line.trim().is_empty() {
            continue;
        }
        match line {
            "[rooms]" | "[agents]" | "[objects]" => {
                section = line;
                continue;
            }
            _ => {}
        }

        if section.is_empty() {
            if let Some((k, v)) = line.split_once(':') {
                match k.trim() {
                    "version" => version = v.trim().to_string(),
                    "current_room" => current_room = v.trim().to_string(),
                    "ledger_offset" => ledger_offset = v.trim().parse().unwrap_or(0),
                    _ => {}
                }
            }
            continue;
        }

        let parts: Vec<&str> = line.split('|').collect();
        if section == "[rooms]" {
            if parts.len() != 7 {
                return Err(SnapshotError::Parse { path: path.display().to_string(), message: "invalid room row".to_string() });
            }
            let exits = parse_pairs(parts[3]);
            rooms.insert(
                parts[0].to_string(),
                Room {
                    id: parts[0].to_string(),
                    name: parts[1].to_string(),
                    description: parts[2].to_string(),
                    exits,
                    objects: split_csv(parts[4]),
                    agents: split_csv(parts[5]),
                    permissions: split_csv(parts[6]),
                },
            );
        } else if section == "[agents]" {
            if parts.len() != 9 {
                return Err(SnapshotError::Parse { path: path.display().to_string(), message: "invalid agent row".to_string() });
            }
            agents.insert(
                parts[0].to_string(),
                Agent {
                    id: parts[0].to_string(),
                    name: parts[1].to_string(),
                    title: parts[2].to_string(),
                    role: parts[3].to_string(),
                    owner_room: parts[4].to_string(),
                    supervisor: if parts[5] == "null" { None } else { Some(parts[5].to_string()) },
                    skills: split_csv(parts[6]),
                    memory_namespace: parts[7].to_string(),
                    governance: parse_pairs(parts[8]),
                },
            );
        } else if section == "[objects]" {
            if parts.len() != 6 {
                return Err(SnapshotError::Parse { path: path.display().to_string(), message: "invalid object row".to_string() });
            }
            objects.insert(
                parts[0].to_string(),
                Object {
                    id: parts[0].to_string(),
                    name: parts[1].to_string(),
                    object_type: parts[2].to_string(),
                    room: parts[3].to_string(),
                    interactions: split_csv(parts[4]),
                    status: parts[5].to_string(),
                },
            );
        }
    }

    Ok(WorldState { current_room, rooms, agents, objects, ledger_offset, version })
}

fn split_csv(raw: &str) -> Vec<String> {
    if raw.trim().is_empty() {
        Vec::new()
    } else {
        raw.split(',').map(|s| s.to_string()).collect()
    }
}

fn parse_pairs(raw: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for pair in raw.split(',') {
        if let Some((k, v)) = pair.split_once('>') {
            map.insert(k.to_string(), v.to_string());
        }
    }
    map
}

#[cfg(test)]
mod tests {
    use super::{load_snapshot, save_snapshot};
    use std::path::Path;
    use world_loader::load_world_from_dir;

    #[test]
    fn save_then_load_keeps_current_room() {
        let world_root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../world").canonicalize().expect("world dir");
        let mut state = load_world_from_dir(world_root).expect("world load");
        state.current_room = "nursery_room".to_string();

        let snap = std::env::temp_dir().join("dragon_world_snapshot_test.txt");
        save_snapshot(&snap, &state).expect("save snapshot");
        let loaded = load_snapshot(&snap).expect("load snapshot");

        assert_eq!(loaded.current_room, "nursery_room");
    }
}
