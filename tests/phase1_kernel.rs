use command_parser::{parse_command, Command};
use std::path::Path;
use world_core::{ActionCommand, ActionExecutor, EventType};
use world_loader::load_world_from_dir;

fn load_state() -> world_core::WorldState {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("world");
    load_world_from_dir(root).expect("load world")
}

#[test]
fn move_from_core_to_nursery_success() {
    let mut exec = ActionExecutor::new(load_state());
    exec.initialize();

    let out = exec
        .execute(ActionCommand::Go("south".to_string()))
        .expect("move south");

    assert!(out.contains("Nursery Room"));
    assert_eq!(exec.state.current_room, "nursery_room");
    assert_eq!(exec.ledger.last().map(|e| &e.event_type), Some(&EventType::RoomEntered));
}

#[test]
fn invalid_direction_keeps_state_and_writes_rejected_event() {
    let mut exec = ActionExecutor::new(load_state());
    exec.initialize();

    let err = exec.execute(ActionCommand::Go("west".to_string())).expect_err("invalid");
    assert!(err.to_string().contains("no exit"));
    assert_eq!(exec.state.current_room, "core_room");
    assert_eq!(exec.ledger.last().map(|e| &e.event_type), Some(&EventType::CommandRejected));
}

#[test]
fn talk_finds_agent_in_current_room() {
    let mut exec = ActionExecutor::new(load_state());
    exec.initialize();

    let msg = exec
        .execute(ActionCommand::Talk("华夏真龙策".to_string()))
        .expect("talk found");
    assert!(msg.contains("欢迎"));
    assert_eq!(exec.ledger.last().map(|e| &e.event_type), Some(&EventType::TalkAttempted));
}

#[test]
fn inspect_finds_object_in_room() {
    let mut exec = ActionExecutor::new(load_state());
    exec.initialize();
    exec.execute(ActionCommand::Go("east".to_string())).expect("go east");

    let msg = exec
        .execute(ActionCommand::Inspect("matrix_brain".to_string()))
        .expect("inspect found");
    assert!(msg.contains("Matrix Brain"));
    assert_eq!(exec.ledger.last().map(|e| &e.event_type), Some(&EventType::InspectAttempted));
}

#[test]
fn parser_minimal_set() {
    assert_eq!(parse_command("/look"), Ok(Command::Look));
    assert_eq!(parse_command("/go south"), Ok(Command::Go("south".to_string())));
    assert_eq!(parse_command("/south"), Ok(Command::Go("south".to_string())));
    assert_eq!(
        parse_command("/talk 华夏真龙策"),
        Ok(Command::Talk("华夏真龙策".to_string()))
    );
    assert!(parse_command("/unknown").is_err());
}
