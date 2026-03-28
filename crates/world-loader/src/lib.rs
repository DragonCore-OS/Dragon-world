use std::collections::{HashMap, HashSet};
use std::fmt::{Display, Formatter};
use std::fs;
use std::path::Path;
use world_core::{Agent, Object, Room, WorldState};

#[derive(Debug)]
pub enum LoadError {
    Io { path: String, source: std::io::Error },
    InvalidFormat { path: String, message: String },
    DuplicateId { kind: &'static str, id: String },
    InvalidExit { from: String, direction: String, to: String },
    AgentRoomMissing { agent: String, room: String },
    ObjectRoomMissing { object: String, room: String },
    MissingSeedField(&'static str),
}

impl Display for LoadError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            LoadError::Io { path, source } => write!(f, "io error at {path}: {source}"),
            LoadError::InvalidFormat { path, message } => write!(f, "invalid format at {path}: {message}"),
            LoadError::DuplicateId { kind, id } => write!(f, "duplicate {kind} id: {id}"),
            LoadError::InvalidExit { from, direction, to } => {
                write!(f, "room exit points to unknown room: from={from}, direction={direction}, to={to}")
            }
            LoadError::AgentRoomMissing { agent, room } => write!(f, "agent '{agent}' references missing room '{room}'"),
            LoadError::ObjectRoomMissing { object, room } => write!(f, "object '{object}' references missing room '{room}'"),
            LoadError::MissingSeedField(field) => write!(f, "missing seed declaration: {field}"),
        }
    }
}

impl std::error::Error for LoadError {}

#[derive(Debug)]
struct SeedManifest {
    version: String,
    initial_room: String,
    rooms: Vec<String>,
    agents: Vec<String>,
    objects: Vec<String>,
}

fn read_text(path: &Path) -> Result<String, LoadError> {
    fs::read_to_string(path).map_err(|source| LoadError::Io { path: path.display().to_string(), source })
}

fn parse_list_value(v: &str) -> Vec<String> {
    let t = v.trim();
    if t.starts_with('[') && t.ends_with(']') {
        t[1..t.len() - 1]
            .split(',')
            .map(|s| s.trim().trim_matches('"').to_string())
            .filter(|s| !s.is_empty())
            .collect()
    } else {
        Vec::new()
    }
}

fn parse_seed_manifest(path: &Path) -> Result<SeedManifest, LoadError> {
    let raw = read_text(path)?;
    let mut version = String::new();
    let mut initial_room = String::new();
    let mut rooms = Vec::new();
    let mut agents = Vec::new();
    let mut objects = Vec::new();
    let lines: Vec<&str> = raw.lines().collect();
    let mut i = 0;
    while i < lines.len() {
        let line = lines[i].trim_end();
        if line.trim().is_empty() || line.trim().starts_with('#') {
            i += 1;
            continue;
        }
        if let Some((k, v)) = line.split_once(':') {
            let key = k.trim();
            let value = v.trim();
            match key {
                "version" => version = value.trim_matches('"').to_string(),
                "initial_room" => initial_room = value.trim_matches('"').to_string(),
                "rooms" | "agents" | "objects" => {
                    let mut list = if !value.is_empty() { parse_list_value(value) } else { Vec::new() };
                    if value.is_empty() {
                        i += 1;
                        while i < lines.len() && lines[i].starts_with("  -") {
                            list.push(lines[i].trim().trim_start_matches('-').trim().to_string());
                            i += 1;
                        }
                        i -= 1;
                    }
                    match key {
                        "rooms" => rooms = list,
                        "agents" => agents = list,
                        _ => objects = list,
                    }
                }
                _ => {}
            }
        }
        i += 1;
    }
    if version.is_empty() {
        return Err(LoadError::MissingSeedField("version"));
    }
    if initial_room.is_empty() {
        return Err(LoadError::MissingSeedField("initial_room"));
    }
    if rooms.is_empty() {
        return Err(LoadError::MissingSeedField("rooms"));
    }
    Ok(SeedManifest { version, initial_room, rooms, agents, objects })
}

fn parse_map_block(lines: &[&str], start: usize) -> (HashMap<String, String>, usize) {
    let mut map = HashMap::new();
    let mut i = start;
    while i < lines.len() {
        let l = lines[i];
        if !l.starts_with("  ") || l.trim().is_empty() {
            break;
        }
        if let Some((k, v)) = l.trim().split_once(':') {
            map.insert(k.trim().to_string(), v.trim().trim_matches('"').to_string());
        }
        i += 1;
    }
    (map, i)
}

fn parse_list_block(lines: &[&str], start: usize) -> (Vec<String>, usize) {
    let mut items = Vec::new();
    let mut i = start;
    while i < lines.len() {
        let l = lines[i];
        if !l.starts_with("  -") {
            break;
        }
        items.push(l.trim().trim_start_matches('-').trim().trim_matches('"').to_string());
        i += 1;
    }
    (items, i)
}

fn parse_room(path: &Path) -> Result<Room, LoadError> {
    let raw = read_text(path)?;
    let lines: Vec<&str> = raw.lines().collect();
    let mut id = String::new();
    let mut name = String::new();
    let mut description = String::new();
    let mut exits = HashMap::new();
    let mut objects = Vec::new();
    let mut agents = Vec::new();
    let mut permissions = Vec::new();
    let mut i = 0;
    while i < lines.len() {
        let l = lines[i].trim_end();
        if let Some((k, v)) = l.split_once(':') {
            let key = k.trim();
            let value = v.trim();
            match key {
                "id" => id = value.to_string(),
                "name" => name = value.to_string(),
                "description" => description = value.to_string(),
                "exits" => {
                    if value == "{}" {
                        exits = HashMap::new();
                    } else {
                        let (m, ni) = parse_map_block(&lines, i + 1);
                        exits = m;
                        i = ni - 1;
                    }
                }
                "objects" => objects = parse_list_value(value),
                "agents" => agents = parse_list_value(value),
                "permissions" => {
                    if value.starts_with('[') {
                        permissions = parse_list_value(value);
                    } else {
                        let (lst, ni) = parse_list_block(&lines, i + 1);
                        permissions = lst;
                        i = ni - 1;
                    }
                }
                _ => {}
            }
        }
        i += 1;
    }
    if id.is_empty() {
        return Err(LoadError::InvalidFormat { path: path.display().to_string(), message: "missing room id".to_string() });
    }
    Ok(Room { id, name, description, exits, objects, agents, permissions })
}

fn parse_agent(path: &Path) -> Result<Agent, LoadError> {
    let raw = read_text(path)?;
    let lines: Vec<&str> = raw.lines().collect();
    let mut id = String::new();
    let mut name = String::new();
    let mut title = String::new();
    let mut role = String::new();
    let mut owner_room = String::new();
    let mut supervisor: Option<String> = None;
    let mut skills = Vec::new();
    let mut memory_namespace = String::new();
    let mut governance = HashMap::new();
    let mut i = 0;
    while i < lines.len() {
        let l = lines[i].trim_end();
        if let Some((k, v)) = l.split_once(':') {
            let key = k.trim();
            let value = v.trim();
            match key {
                "id" => id = value.to_string(),
                "name" => name = value.to_string(),
                "title" => title = value.to_string(),
                "role" => role = value.to_string(),
                "owner_room" => owner_room = value.to_string(),
                "supervisor" => {
                    if value == "null" { supervisor = None; } else { supervisor = Some(value.to_string()); }
                }
                "skills" => {
                    if value.starts_with('[') {
                        skills = parse_list_value(value);
                    } else {
                        let (lst, ni) = parse_list_block(&lines, i + 1);
                        skills = lst;
                        i = ni - 1;
                    }
                }
                "memory_namespace" => memory_namespace = value.to_string(),
                "governance" => {
                    let (m, ni) = parse_map_block(&lines, i + 1);
                    governance = m;
                    i = ni - 1;
                }
                _ => {}
            }
        }
        i += 1;
    }
    Ok(Agent { id, name, title, role, owner_room, supervisor, skills, memory_namespace, governance })
}

fn parse_object(path: &Path) -> Result<Object, LoadError> {
    let raw = read_text(path)?;
    let mut fields = HashMap::new();
    for line in raw.lines() {
        if let Some((k, v)) = line.split_once(':') {
            fields.insert(k.trim().to_string(), v.trim().to_string());
        }
    }
    Ok(Object {
        id: fields.get("id").cloned().unwrap_or_default(),
        name: fields.get("name").cloned().unwrap_or_default(),
        object_type: fields.get("type").cloned().unwrap_or_default(),
        room: fields.get("room").cloned().unwrap_or_default(),
        interactions: parse_list_value(fields.get("interactions").map(String::as_str).unwrap_or("[]")),
        status: fields.get("status").cloned().unwrap_or_default(),
    })
}

pub fn load_world_from_dir(world_root: impl AsRef<Path>) -> Result<WorldState, LoadError> {
    let world_root = world_root.as_ref();
    let manifest = parse_seed_manifest(&world_root.join("seeds/world.yaml"))?;

    let mut rooms = HashMap::new();
    let mut room_ids = HashSet::new();
    for rel in &manifest.rooms {
        let room = parse_room(&world_root.join("rooms").join(rel))?;
        if !room_ids.insert(room.id.clone()) {
            return Err(LoadError::DuplicateId { kind: "room", id: room.id });
        }
        rooms.insert(room.id.clone(), room);
    }

    let mut agents = HashMap::new();
    let mut agent_ids = HashSet::new();
    for rel in &manifest.agents {
        let agent = parse_agent(&world_root.join("agents").join(rel))?;
        if !agent_ids.insert(agent.id.clone()) {
            return Err(LoadError::DuplicateId { kind: "agent", id: agent.id });
        }
        if !rooms.contains_key(&agent.owner_room) {
            return Err(LoadError::AgentRoomMissing { agent: agent.id, room: agent.owner_room });
        }
        agents.insert(agent.id.clone(), agent);
    }

    let mut objects = HashMap::new();
    let mut object_ids = HashSet::new();
    for rel in &manifest.objects {
        let object = parse_object(&world_root.join("objects").join(rel))?;
        if !object_ids.insert(object.id.clone()) {
            return Err(LoadError::DuplicateId { kind: "object", id: object.id });
        }
        if !rooms.contains_key(&object.room) {
            return Err(LoadError::ObjectRoomMissing { object: object.id, room: object.room });
        }
        objects.insert(object.id.clone(), object);
    }

    for room in rooms.values() {
        for (direction, target) in &room.exits {
            if !rooms.contains_key(target) {
                return Err(LoadError::InvalidExit { from: room.id.clone(), direction: direction.clone(), to: target.clone() });
            }
        }
    }

    for agent in agents.values() {
        if let Some(room) = rooms.get_mut(&agent.owner_room) {
            if !room.agents.iter().any(|id| id == &agent.id) {
                room.agents.push(agent.id.clone());
            }
        }
    }
    for object in objects.values() {
        if let Some(room) = rooms.get_mut(&object.room) {
            if !room.objects.iter().any(|id| id == &object.id) {
                room.objects.push(object.id.clone());
            }
        }
    }

    Ok(WorldState {
        current_room: manifest.initial_room,
        rooms,
        agents,
        objects,
        ledger_offset: 0,
        version: manifest.version,
    })
}

#[cfg(test)]
mod tests {
    use super::{load_world_from_dir, LoadError};
    use std::fs;
    use std::path::{Path, PathBuf};

    fn test_world_dir() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../world").canonicalize().expect("world dir should exist")
    }

    fn mk_temp_world() -> PathBuf {
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let root = std::env::temp_dir().join(format!("dragon_world_loader_test_{stamp}"));
        fs::create_dir_all(root.join("rooms")).expect("create rooms");
        fs::create_dir_all(root.join("agents")).expect("create agents");
        fs::create_dir_all(root.join("objects")).expect("create objects");
        fs::create_dir_all(root.join("seeds")).expect("create seeds");
        root
    }

    #[test]
    fn load_seed_world_success() {
        let world = load_world_from_dir(test_world_dir()).expect("load world success");
        assert_eq!(world.rooms.len(), 6);
        assert_eq!(world.agents.len(), 5);
        assert_eq!(world.objects.len(), 6);
    }

    #[test]
    fn duplicate_room_id_returns_error() {
        let root = mk_temp_world();
        fs::write(root.join("seeds/world.yaml"), "version: v1\ninitial_room: core_room\nrooms: [a.yaml, b.yaml]\nagents: []\nobjects: []\n").expect("write manifest");
        let dup_room = "id: core_room\nname: X\ndescription: X\nexits: {}\nobjects: []\nagents: []\npermissions: []\n";
        fs::write(root.join("rooms/a.yaml"), dup_room).expect("write a");
        fs::write(root.join("rooms/b.yaml"), dup_room).expect("write b");

        let err = load_world_from_dir(&root).expect_err("expected duplicate room error");
        assert!(matches!(err, LoadError::DuplicateId { kind: "room", .. }));
    }

    #[test]
    fn invalid_exit_returns_error() {
        let root = mk_temp_world();
        fs::write(root.join("seeds/world.yaml"), "version: v1\ninitial_room: core_room\nrooms: [a.yaml]\nagents: []\nobjects: []\n").expect("write manifest");
        fs::write(root.join("rooms/a.yaml"), "id: core_room\nname: Core\ndescription: Core\nexits:\n  south: missing\nobjects: []\nagents: []\npermissions: []\n").expect("write room");

        let err = load_world_from_dir(&root).expect_err("expected invalid exit");
        assert!(matches!(err, LoadError::InvalidExit { .. }));
    }

    #[test]
    fn agent_with_missing_room_returns_error() {
        let root = mk_temp_world();
        fs::write(root.join("seeds/world.yaml"), "version: v1\ninitial_room: core_room\nrooms: [a.yaml]\nagents: [agent.yaml]\nobjects: []\n").expect("write manifest");
        fs::write(root.join("rooms/a.yaml"), "id: core_room\nname: Core\ndescription: Core\nexits: {}\nobjects: []\nagents: []\npermissions: []\n").expect("write room");
        fs::write(root.join("agents/agent.yaml"), "id: a1\nname: A\ntitle: T\nrole: R\nowner_room: missing\nsupervisor: null\nskills: []\nmemory_namespace: m\ngovernance:\n  mode: x\n").expect("write agent");

        let err = load_world_from_dir(&root).expect_err("expected room missing");
        assert!(matches!(err, LoadError::AgentRoomMissing { .. }));
    }
}
