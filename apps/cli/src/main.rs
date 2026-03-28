use command_parser::{parse_command, Command};
use std::io::{self, Write};
use std::path::Path;
use world_core::{ActionCommand, ActionExecutor};
use world_loader::load_world_from_dir;

fn main() {
    let world_root = Path::new("world");
    let state = match load_world_from_dir(world_root) {
        Ok(s) => s,
        Err(err) => {
            eprintln!("failed to load world: {err}");
            return;
        }
    };

    let mut executor = ActionExecutor::new(state);
    executor.initialize();

    println!("DragonWorld Phase 1 CLI");
    println!("Type /help for commands. Type exit or quit to leave.\n");
    match executor.execute(ActionCommand::Look) {
        Ok(desc) => println!("{desc}"),
        Err(err) => println!("error: {err}"),
    }

    let stdin = io::stdin();
    loop {
        print!("\n> ");
        if io::stdout().flush().is_err() {
            eprintln!("failed to flush stdout");
            return;
        }

        let mut line = String::new();
        if stdin.read_line(&mut line).is_err() {
            eprintln!("failed to read input");
            return;
        }
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        let parsed = match parse_command(line) {
            Ok(c) => c,
            Err(err) => {
                println!("parse error: {err}");
                continue;
            }
        };

        match parsed {
            Command::Exit => {
                println!("bye.");
                break;
            }
            Command::Look => print_result(executor.execute(ActionCommand::Look)),
            Command::Go(d) => print_result(executor.execute(ActionCommand::Go(d))),
            Command::Talk(a) => print_result(executor.execute(ActionCommand::Talk(a))),
            Command::Inspect(o) => print_result(executor.execute(ActionCommand::Inspect(o))),
            Command::Status => print_result(executor.execute(ActionCommand::Status)),
            Command::Help => print_result(executor.execute(ActionCommand::Help)),
        }
    }

    let snapshot_path = Path::new("world/.last_snapshot.json");
    if let Err(err) = snapshot::save_snapshot(snapshot_path, &executor.state) {
        eprintln!("warning: failed to save snapshot: {err}");
    }
}

fn print_result(result: Result<String, world_core::ActionError>) {
    match result {
        Ok(message) => println!("{message}"),
        Err(err) => println!("error: {err}"),
    }
}
