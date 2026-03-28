use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use std::time::{SystemTime, UNIX_EPOCH};

/// A room in the deterministic world graph.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Room {
    pub id: String,
    pub name: String,
    pub description: String,
    pub exits: HashMap<String, String>,
    pub objects: Vec<String>,
    pub agents: Vec<String>,
    pub permissions: Vec<String>,
}

/// An agent that can appear in rooms.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub title: String,
    pub role: String,
    pub owner_room: String,
    pub supervisor: Option<String>,
    pub skills: Vec<String>,
    pub memory_namespace: String,
    pub governance: HashMap<String, String>,
}

/// An inspectable object in the world.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Object {
    pub id: String,
    pub name: String,
    pub object_type: String,
    pub room: String,
    pub interactions: Vec<String>,
    pub status: String,
}

/// Event type constants used by phase 1.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EventType {
    WorldInitialized,
    RoomEntered,
    TalkAttempted,
    InspectAttempted,
    CommandRejected,
}

impl Display for EventType {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            EventType::WorldInitialized => "world_initialized",
            EventType::RoomEntered => "room_entered",
            EventType::TalkAttempted => "talk_attempted",
            EventType::InspectAttempted => "inspect_attempted",
            EventType::CommandRejected => "command_rejected",
        };
        write!(f, "{s}")
    }
}

/// Immutable event record written to the event ledger.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorldEvent {
    pub id: String,
    pub event_type: EventType,
    pub actor: String,
    pub timestamp: u64,
    pub payload: HashMap<String, String>,
}

/// Full in-memory world state for deterministic execution.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorldState {
    pub current_room: String,
    pub rooms: HashMap<String, Room>,
    pub agents: HashMap<String, Agent>,
    pub objects: HashMap<String, Object>,
    pub ledger_offset: usize,
    pub version: String,
}

/// Result of action execution.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ActionOutcome {
    pub message: String,
}

/// Errors returned by world state action execution.
#[derive(Debug, PartialEq, Eq)]
pub enum ActionError {
    MissingCurrentRoom(String),
    InvalidDirection { direction: String, room_id: String },
    AgentNotFound(String),
    ObjectNotFound(String),
}

impl Display for ActionError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ActionError::MissingCurrentRoom(room) => write!(f, "current room does not exist: {room}"),
            ActionError::InvalidDirection { direction, room_id } => {
                write!(f, "no exit '{direction}' in room '{room_id}'")
            }
            ActionError::AgentNotFound(name) => write!(f, "agent not found in room: {name}"),
            ActionError::ObjectNotFound(name) => write!(f, "object not found in room: {name}"),
        }
    }
}

impl std::error::Error for ActionError {}

impl WorldState {
    /// Builds a room description used by `/look` and successful movement responses.
    pub fn describe_current_room(&self) -> Result<String, ActionError> {
        let room = self
            .rooms
            .get(&self.current_room)
            .ok_or_else(|| ActionError::MissingCurrentRoom(self.current_room.clone()))?;
        let exits = if room.exits.is_empty() {
            "none".to_string()
        } else {
            room.exits
                .iter()
                .map(|(d, to)| format!("{d}->{to}"))
                .collect::<Vec<_>>()
                .join(", ")
        };
        let agents = if room.agents.is_empty() { "none".to_string() } else { room.agents.join(", ") };
        let objects = if room.objects.is_empty() { "none".to_string() } else { room.objects.join(", ") };
        Ok(format!(
            "Room: {}\nDescription: {}\nExits: {}\nAgents: {}\nObjects: {}",
            room.name, room.description, exits, agents, objects
        ))
    }

    pub fn move_to(&mut self, direction: &str) -> Result<ActionOutcome, ActionError> {
        let room = self
            .rooms
            .get(&self.current_room)
            .ok_or_else(|| ActionError::MissingCurrentRoom(self.current_room.clone()))?;
        let target = room
            .exits
            .get(direction)
            .ok_or_else(|| ActionError::InvalidDirection {
                direction: direction.to_string(),
                room_id: room.id.clone(),
            })?
            .clone();
        self.current_room = target;
        Ok(ActionOutcome { message: self.describe_current_room()? })
    }

    pub fn talk(&self, agent_name_or_id: &str) -> Result<ActionOutcome, ActionError> {
        let room = self
            .rooms
            .get(&self.current_room)
            .ok_or_else(|| ActionError::MissingCurrentRoom(self.current_room.clone()))?;
        let found = room.agents.iter().find_map(|id| {
            self.agents.get(id).and_then(|a| {
                if a.id.eq_ignore_ascii_case(agent_name_or_id) || a.name.eq_ignore_ascii_case(agent_name_or_id) {
                    Some(a)
                } else {
                    None
                }
            })
        });
        match found {
            Some(agent) => Ok(ActionOutcome { message: format!("{} says: 欢迎来到{}，已记录在案。", agent.name, room.name) }),
            None => Err(ActionError::AgentNotFound(agent_name_or_id.to_string())),
        }
    }

    pub fn inspect(&self, object_name_or_id: &str) -> Result<ActionOutcome, ActionError> {
        let room = self
            .rooms
            .get(&self.current_room)
            .ok_or_else(|| ActionError::MissingCurrentRoom(self.current_room.clone()))?;
        let found = room.objects.iter().find_map(|id| {
            self.objects.get(id).and_then(|o| {
                if o.id.eq_ignore_ascii_case(object_name_or_id) || o.name.eq_ignore_ascii_case(object_name_or_id) {
                    Some(o)
                } else {
                    None
                }
            })
        });
        match found {
            Some(obj) => Ok(ActionOutcome {
                message: format!("{} [{}]: status={}, interactions={}", obj.name, obj.object_type, obj.status, obj.interactions.join("|")),
            }),
            None => Err(ActionError::ObjectNotFound(object_name_or_id.to_string())),
        }
    }

    pub fn status(&self, ledger_events: usize) -> String {
        format!(
            "current_room={}\nversion={}\nrooms={}\nledger_events={}",
            self.current_room,
            self.version,
            self.rooms.len(),
            ledger_events
        )
    }
}

pub fn build_event(id: String, event_type: EventType, actor: String, payload: HashMap<String, String>) -> WorldEvent {
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
    WorldEvent { id, event_type, actor, timestamp, payload }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ActionCommand {
    Look,
    Go(String),
    Talk(String),
    Inspect(String),
    Status,
    Help,
}

#[derive(Debug, Clone)]
pub struct ActionExecutor {
    pub state: WorldState,
    pub ledger: Vec<WorldEvent>,
}

impl ActionExecutor {
    pub fn new(state: WorldState) -> Self { Self { state, ledger: Vec::new() } }

    pub fn initialize(&mut self) {
        let mut payload = HashMap::new();
        payload.insert("current_room".to_string(), self.state.current_room.clone());
        self.push_event(EventType::WorldInitialized, "system", payload);
    }

    pub fn execute(&mut self, command: ActionCommand) -> Result<String, ActionError> {
        match command {
            ActionCommand::Look => self.state.describe_current_room(),
            ActionCommand::Go(direction) => match self.state.move_to(&direction) {
                Ok(outcome) => {
                    let mut p = HashMap::new();
                    p.insert("direction".to_string(), direction);
                    p.insert("room".to_string(), self.state.current_room.clone());
                    self.push_event(EventType::RoomEntered, "player", p);
                    Ok(outcome.message)
                }
                Err(err) => {
                    let mut p = HashMap::new();
                    p.insert("command".to_string(), "go".to_string());
                    p.insert("reason".to_string(), err.to_string());
                    self.push_event(EventType::CommandRejected, "player", p);
                    Err(err)
                }
            },
            ActionCommand::Talk(agent) => match self.state.talk(&agent) {
                Ok(outcome) => {
                    let mut p = HashMap::new();
                    p.insert("agent".to_string(), agent);
                    p.insert("result".to_string(), "found".to_string());
                    self.push_event(EventType::TalkAttempted, "player", p);
                    Ok(outcome.message)
                }
                Err(err) => {
                    let mut p = HashMap::new();
                    p.insert("command".to_string(), "talk".to_string());
                    p.insert("reason".to_string(), err.to_string());
                    self.push_event(EventType::CommandRejected, "player", p);
                    Err(err)
                }
            },
            ActionCommand::Inspect(object) => match self.state.inspect(&object) {
                Ok(outcome) => {
                    let mut p = HashMap::new();
                    p.insert("object".to_string(), object);
                    p.insert("result".to_string(), "found".to_string());
                    self.push_event(EventType::InspectAttempted, "player", p);
                    Ok(outcome.message)
                }
                Err(err) => {
                    let mut p = HashMap::new();
                    p.insert("command".to_string(), "inspect".to_string());
                    p.insert("reason".to_string(), err.to_string());
                    self.push_event(EventType::CommandRejected, "player", p);
                    Err(err)
                }
            },
            ActionCommand::Status => Ok(self.state.status(self.ledger.len())),
            ActionCommand::Help => Ok(help_text().to_string()),
        }
    }

    fn push_event(&mut self, event_type: EventType, actor: &str, payload: HashMap<String, String>) {
        let id = format!("evt-{}", self.ledger.len() + 1);
        self.ledger.push(build_event(id, event_type, actor.to_string(), payload));
        self.state.ledger_offset = self.ledger.len();
    }
}

pub fn help_text() -> &'static str {
    "Commands: /look, /go <direction>, /north, /south, /east, /west, /talk <agent>, /inspect <object>, /status, /help, exit"
}

#[cfg(test)]
mod tests {
    use super::{ActionCommand, ActionExecutor, Agent, EventType, Object, Room, WorldState};
    use std::collections::HashMap;

    fn load() -> WorldState {
        let mut rooms = HashMap::new();
        let mut core_exits = HashMap::new();
        core_exits.insert("south".to_string(), "nursery_room".to_string());
        core_exits.insert("east".to_string(), "archive_hall".to_string());
        rooms.insert(
            "core_room".to_string(),
            Room {
                id: "core_room".to_string(),
                name: "Core Room".to_string(),
                description: "core".to_string(),
                exits: core_exits,
                objects: vec![],
                agents: vec!["huaxia_zhenlongce".to_string()],
                permissions: vec![],
            },
        );
        let mut nursery_exits = HashMap::new();
        nursery_exits.insert("north".to_string(), "core_room".to_string());
        rooms.insert(
            "nursery_room".to_string(),
            Room {
                id: "nursery_room".to_string(),
                name: "Nursery Room".to_string(),
                description: "nursery".to_string(),
                exits: nursery_exits,
                objects: vec![],
                agents: vec![],
                permissions: vec![],
            },
        );
        let mut arch_exits = HashMap::new();
        arch_exits.insert("west".to_string(), "core_room".to_string());
        rooms.insert(
            "archive_hall".to_string(),
            Room {
                id: "archive_hall".to_string(),
                name: "Archive Hall".to_string(),
                description: "archive".to_string(),
                exits: arch_exits,
                objects: vec!["matrix_brain".to_string()],
                agents: vec![],
                permissions: vec![],
            },
        );

        let mut agents = HashMap::new();
        agents.insert(
            "huaxia_zhenlongce".to_string(),
            Agent {
                id: "huaxia_zhenlongce".to_string(),
                name: "华夏真龙策".to_string(),
                title: "世界书记".to_string(),
                role: "secretary".to_string(),
                owner_room: "core_room".to_string(),
                supervisor: None,
                skills: vec![],
                memory_namespace: "x".to_string(),
                governance: HashMap::new(),
            },
        );

        let mut objects = HashMap::new();
        objects.insert(
            "matrix_brain".to_string(),
            Object {
                id: "matrix_brain".to_string(),
                name: "Matrix Brain".to_string(),
                object_type: "artifact".to_string(),
                room: "archive_hall".to_string(),
                interactions: vec!["inspect".to_string()],
                status: "stable".to_string(),
            },
        );

        WorldState {
            current_room: "core_room".to_string(),
            rooms,
            agents,
            objects,
            ledger_offset: 0,
            version: "phase1".to_string(),
        }
    }

    #[test]
    fn move_core_to_nursery() {
        let mut exec = ActionExecutor::new(load());
        exec.initialize();
        let result = exec.execute(ActionCommand::Go("south".into())).expect("move south");
        assert!(result.contains("Nursery"));
        assert_eq!(exec.state.current_room, "nursery_room");
        assert_eq!(exec.ledger.last().map(|e| &e.event_type), Some(&EventType::RoomEntered));
    }

    #[test]
    fn invalid_direction_does_not_change_state() {
        let mut exec = ActionExecutor::new(load());
        exec.initialize();
        let _ = exec.execute(ActionCommand::Go("west".into())).expect_err("invalid direction");
        assert_eq!(exec.state.current_room, "core_room");
        assert_eq!(exec.ledger.last().map(|e| &e.event_type), Some(&EventType::CommandRejected));
    }

    #[test]
    fn talk_and_inspect_stubs() {
        let mut exec = ActionExecutor::new(load());
        exec.initialize();
        let talk = exec.execute(ActionCommand::Talk("华夏真龙策".into())).expect("talk found");
        assert!(talk.contains("欢迎"));
        assert_eq!(exec.ledger.last().map(|e| &e.event_type), Some(&EventType::TalkAttempted));

        exec.execute(ActionCommand::Go("east".into())).expect("go east");
        let inspect = exec.execute(ActionCommand::Inspect("matrix_brain".into())).expect("inspect found");
        assert!(inspect.contains("Matrix Brain"));
        assert_eq!(exec.ledger.last().map(|e| &e.event_type), Some(&EventType::InspectAttempted));
    }
}
