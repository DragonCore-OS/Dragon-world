use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use command_parser::{parse_command, Command};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::CorsLayer;
use world_core::{ActionCommand, ActionExecutor, WorldState};
use world_loader::load_world_from_dir;

/// Application state shared across handlers
struct AppState {
    executor: Arc<Mutex<ActionExecutor>>,
}

/// Health check response
#[derive(Serialize)]
struct HealthResponse {
    status: String,
}

/// Command request body
#[derive(Deserialize)]
struct CommandRequest {
    command: String,
}

/// Command response
#[derive(Serialize)]
struct CommandResponse {
    success: bool,
    #[serde(rename = "type")]
    response_type: String,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    current_room: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    visible_agents: Option<Vec<VisibleAgent>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    visible_objects: Option<Vec<VisibleObject>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    visible_exits: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    status: Option<StatusInfo>,
}

/// Visible agent in response
#[derive(Serialize, Clone)]
struct VisibleAgent {
    id: String,
    name: String,
    title: String,
    role: String,
}

/// Visible object in response
#[derive(Serialize, Clone)]
struct VisibleObject {
    id: String,
    name: String,
    #[serde(rename = "objectType")]
    object_type: String,
    status: String,
}

/// Status info in response
#[derive(Serialize, Clone)]
struct StatusInfo {
    current_room: String,
    total_rooms: usize,
    total_agents: usize,
    total_objects: usize,
    exits: Vec<String>,
    version: String,
}

/// Kernel state response
#[derive(Serialize)]
struct KernelStateResponse {
    version: String,
    current_room: String,
    room: RoomInfo,
    visible_agents: Vec<VisibleAgent>,
    visible_objects: Vec<VisibleObject>,
    visible_exits: Vec<String>,
    total_rooms: usize,
    total_agents: usize,
    total_objects: usize,
}

/// Room info in kernel state
#[derive(Serialize)]
struct RoomInfo {
    id: String,
    name: String,
    description: String,
    exits: HashMap<String, String>,
    agents: Vec<String>,
    objects: Vec<String>,
}

/// Map response
#[derive(Serialize)]
struct MapResponse {
    nodes: HashMap<String, NodeCoord>,
    edges: Vec<Edge>,
}

/// Node coordinate
#[derive(Serialize)]
struct NodeCoord {
    x: i32,
    y: i32,
}

/// Edge in map
#[derive(Serialize)]
struct Edge {
    from: String,
    to: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    dashed: Option<bool>,
}

/// Status response
#[derive(Serialize)]
struct StatusResponse {
    current_room: String,
    total_rooms: usize,
    total_agents: usize,
    total_objects: usize,
    exits: Vec<String>,
    version: String,
}

/// Error response
#[derive(Serialize)]
struct ErrorResponse {
    success: bool,
    error: String,
}

/// Map command_parser::Command to world_core::ActionCommand
fn map_command(cmd: Command) -> Option<ActionCommand> {
    match cmd {
        Command::Look => Some(ActionCommand::Look),
        Command::Go(dir) => Some(ActionCommand::Go(dir)),
        Command::Talk(agent) => Some(ActionCommand::Talk(agent)),
        Command::Inspect(obj) => Some(ActionCommand::Inspect(obj)),
        Command::Status => Some(ActionCommand::Status),
        Command::Help => Some(ActionCommand::Help),
        Command::Exit => None, // Exit is handled separately
    }
}

/// Get status info from world state
fn get_status_info(state: &WorldState) -> StatusInfo {
    let current_room = state.rooms.get(&state.current_room);
    let exits: Vec<String> = current_room
        .map(|r| r.exits.keys().cloned().collect())
        .unwrap_or_default();

    StatusInfo {
        current_room: state.current_room.clone(),
        total_rooms: state.rooms.len(),
        total_agents: state.agents.len(),
        total_objects: state.objects.len(),
        exits,
        version: state.version.clone(),
    }
}

/// Get visible agents for current room
fn get_visible_agents(state: &WorldState) -> Vec<VisibleAgent> {
    let current_room = match state.rooms.get(&state.current_room) {
        Some(r) => r,
        None => return Vec::new(),
    };

    current_room
        .agents
        .iter()
        .filter_map(|agent_id| state.agents.get(agent_id))
        .map(|agent| VisibleAgent {
            id: agent.id.clone(),
            name: agent.name.clone(),
            title: agent.title.clone(),
            role: agent.role.clone(),
        })
        .collect()
}

/// Get visible objects for current room
fn get_visible_objects(state: &WorldState) -> Vec<VisibleObject> {
    let current_room = match state.rooms.get(&state.current_room) {
        Some(r) => r,
        None => return Vec::new(),
    };

    current_room
        .objects
        .iter()
        .filter_map(|obj_id| state.objects.get(obj_id))
        .map(|obj| VisibleObject {
            id: obj.id.clone(),
            name: obj.name.clone(),
            object_type: obj.object_type.clone(),
            status: obj.status.clone(),
        })
        .collect()
}

/// Get visible exits for current room
fn get_visible_exits(state: &WorldState) -> Vec<String> {
    let current_room = match state.rooms.get(&state.current_room) {
        Some(r) => r,
        None => return Vec::new(),
    };

    current_room.exits.keys().cloned().collect()
}

/// Health check handler
async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
    })
}

/// Kernel state handler
async fn kernel_state(State(state): State<Arc<AppState>>) -> Result<Json<KernelStateResponse>, (StatusCode, Json<ErrorResponse>)> {
    let executor = state.executor.lock().await;
    let world_state = &executor.state;

    let current_room = match world_state.rooms.get(&world_state.current_room) {
        Some(r) => r,
        None => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    success: false,
                    error: format!("Current room '{}' not found", world_state.current_room),
                }),
            ));
        }
    };

    let room_info = RoomInfo {
        id: current_room.id.clone(),
        name: current_room.name.clone(),
        description: current_room.description.clone(),
        exits: current_room.exits.clone(),
        agents: current_room.agents.clone(),
        objects: current_room.objects.clone(),
    };

    let response = KernelStateResponse {
        version: world_state.version.clone(),
        current_room: world_state.current_room.clone(),
        room: room_info,
        visible_agents: get_visible_agents(world_state),
        visible_objects: get_visible_objects(world_state),
        visible_exits: get_visible_exits(world_state),
        total_rooms: world_state.rooms.len(),
        total_agents: world_state.agents.len(),
        total_objects: world_state.objects.len(),
    };

    Ok(Json(response))
}

/// Command handler
async fn execute_command(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CommandRequest>,
) -> Result<Json<CommandResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Parse the command
    let parsed = match parse_command(&req.command) {
        Ok(cmd) => cmd,
        Err(e) => {
            return Ok(Json(CommandResponse {
                success: false,
                response_type: "error".to_string(),
                message: e.to_string(),
                title: None,
                current_room: None,
                visible_agents: None,
                visible_objects: None,
                visible_exits: None,
                status: None,
            }));
        }
    };

    // Handle exit command
    if let Command::Exit = parsed {
        return Ok(Json(CommandResponse {
            success: true,
            response_type: "exit".to_string(),
            message: "Goodbye!".to_string(),
            title: None,
            current_room: None,
            visible_agents: None,
            visible_objects: None,
            visible_exits: None,
            status: None,
        }));
    }

    // Map to ActionCommand
    let action_cmd = match map_command(parsed) {
        Some(cmd) => cmd,
        None => {
            return Ok(Json(CommandResponse {
                success: false,
                response_type: "error".to_string(),
                message: "Unknown command".to_string(),
                title: None,
                current_room: None,
                visible_agents: None,
                visible_objects: None,
                visible_exits: None,
                status: None,
            }));
        }
    };

    // Execute the command
    let mut executor = state.executor.lock().await;
    let result = executor.execute(action_cmd);

    // Get current state for response
    let status_info = get_status_info(&executor.state);
    let visible_agents = get_visible_agents(&executor.state);
    let visible_objects = get_visible_objects(&executor.state);
    let visible_exits = get_visible_exits(&executor.state);
    let current_room = executor.state.current_room.clone();

    match result {
        Ok(message) => {
            let response_type = if req.command.starts_with("/look") || req.command == "/look" {
                "look"
            } else if req.command.starts_with("/go") || req.command.starts_with("/north") || req.command.starts_with("/south") || req.command.starts_with("/east") || req.command.starts_with("/west") {
                "go"
            } else if req.command.starts_with("/talk") {
                "talk"
            } else if req.command.starts_with("/inspect") {
                "inspect"
            } else if req.command.starts_with("/status") {
                "status"
            } else if req.command.starts_with("/help") {
                "help"
            } else {
                "unknown"
            };

            // Generate title based on command type
            let title = if response_type == "look" {
                let room_name = executor
                    .state
                    .rooms
                    .get(&current_room)
                    .map(|r| r.name.clone())
                    .unwrap_or_else(|| "Unknown".to_string());
                Some(format!("Observe [{}]", room_name))
            } else {
                None
            };

            Ok(Json(CommandResponse {
                success: true,
                response_type: response_type.to_string(),
                message,
                title,
                current_room: Some(current_room),
                visible_agents: Some(visible_agents),
                visible_objects: Some(visible_objects),
                visible_exits: Some(visible_exits),
                status: Some(status_info),
            }))
        }
        Err(e) => {
            Ok(Json(CommandResponse {
                success: false,
                response_type: "error".to_string(),
                message: e.to_string(),
                title: None,
                current_room: Some(current_room),
                visible_agents: Some(visible_agents),
                visible_objects: Some(visible_objects),
                visible_exits: Some(visible_exits),
                status: Some(status_info),
            }))
        }
    }
}

/// Map handler
async fn kernel_map() -> Json<MapResponse> {
    let mut nodes = HashMap::new();
    nodes.insert(
        "core_room".to_string(),
        NodeCoord { x: 25, y: 40 },
    );
    nodes.insert(
        "archive_hall".to_string(),
        NodeCoord { x: 50, y: 40 },
    );
    nodes.insert(
        "council_hall".to_string(),
        NodeCoord { x: 75, y: 40 },
    );
    nodes.insert(
        "nursery_room".to_string(),
        NodeCoord { x: 25, y: 65 },
    );
    nodes.insert(
        "workshop".to_string(),
        NodeCoord { x: 25, y: 90 },
    );
    nodes.insert(
        "observatory".to_string(),
        NodeCoord { x: 75, y: 15 },
    );

    let edges = vec![
        Edge {
            from: "core_room".to_string(),
            to: "archive_hall".to_string(),
            dashed: None,
        },
        Edge {
            from: "archive_hall".to_string(),
            to: "council_hall".to_string(),
            dashed: None,
        },
        Edge {
            from: "core_room".to_string(),
            to: "nursery_room".to_string(),
            dashed: None,
        },
        Edge {
            from: "nursery_room".to_string(),
            to: "workshop".to_string(),
            dashed: None,
        },
        Edge {
            from: "council_hall".to_string(),
            to: "observatory".to_string(),
            dashed: None,
        },
        Edge {
            from: "workshop".to_string(),
            to: "observatory".to_string(),
            dashed: Some(true),
        },
    ];

    Json(MapResponse { nodes, edges })
}

/// Status handler
async fn kernel_status(State(state): State<Arc<AppState>>) -> Result<Json<StatusResponse>, (StatusCode, Json<ErrorResponse>)> {
    let executor = state.executor.lock().await;
    let status_info = get_status_info(&executor.state);

    Ok(Json(StatusResponse {
        current_room: status_info.current_room,
        total_rooms: status_info.total_rooms,
        total_agents: status_info.total_agents,
        total_objects: status_info.total_objects,
        exits: status_info.exits,
        version: status_info.version,
    }))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load world from ./world directory
    let world_state = match load_world_from_dir("./world") {
        Ok(state) => state,
        Err(e) => {
            eprintln!("Failed to load world: {}", e);
            std::process::exit(1);
        }
    };

    // Create and initialize action executor
    let mut executor = ActionExecutor::new(world_state);
    executor.initialize();

    // Create shared state
    let app_state = Arc::new(AppState {
        executor: Arc::new(Mutex::new(executor)),
    });

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/v1/kernel/state", get(kernel_state))
        .route("/v1/kernel/command", post(execute_command))
        .route("/v1/kernel/map", get(kernel_map))
        .route("/v1/kernel/status", get(kernel_status))
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    // Start server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:4001").await?;
    println!("Server listening on port 4001");
    axum::serve(listener, app).await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use world_core::Room;

    #[test]
    fn test_map_command() {
        assert!(matches!(map_command(Command::Look), Some(ActionCommand::Look)));
        assert!(
            matches!(map_command(Command::Go("south".to_string())), Some(ActionCommand::Go(dir)) if dir == "south")
        );
        assert!(
            matches!(map_command(Command::Talk("agent".to_string())), Some(ActionCommand::Talk(agent)) if agent == "agent")
        );
        assert!(
            matches!(map_command(Command::Inspect("obj".to_string())), Some(ActionCommand::Inspect(obj)) if obj == "obj")
        );
        assert!(matches!(map_command(Command::Status), Some(ActionCommand::Status)));
        assert!(matches!(map_command(Command::Help), Some(ActionCommand::Help)));
        assert!(map_command(Command::Exit).is_none());
    }

    #[test]
    fn test_get_status_info() {
        let mut rooms = HashMap::new();
        let mut exits = HashMap::new();
        exits.insert("south".to_string(), "nursery_room".to_string());
        rooms.insert(
            "core_room".to_string(),
            Room {
                id: "core_room".to_string(),
                name: "Core Room".to_string(),
                description: "Core".to_string(),
                exits,
                objects: vec![],
                agents: vec![],
                permissions: vec![],
            },
        );

        let state = WorldState {
            current_room: "core_room".to_string(),
            rooms,
            agents: HashMap::new(),
            objects: HashMap::new(),
            ledger_offset: 0,
            version: "0.1.0".to_string(),
        };

        let status = get_status_info(&state);
        assert_eq!(status.current_room, "core_room");
        assert_eq!(status.total_rooms, 1);
        assert!(status.exits.contains(&"south".to_string()));
    }
}
