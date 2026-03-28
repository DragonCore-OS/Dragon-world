use std::fmt::{Display, Formatter};

/// Supported phase-1 command set.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Command {
    Look,
    Go(String),
    Talk(String),
    Inspect(String),
    Status,
    Help,
    Exit,
}

/// Parsing errors for user input.
#[derive(Debug, PartialEq, Eq)]
pub enum ParseError {
    Empty,
    Unknown(String),
    MissingArgument(String),
}

impl Display for ParseError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            ParseError::Empty => write!(f, "empty command"),
            ParseError::Unknown(c) => write!(f, "unknown command: {c}"),
            ParseError::MissingArgument(c) => write!(f, "missing argument for {c}"),
        }
    }
}
impl std::error::Error for ParseError {}

pub fn parse_command(input: &str) -> Result<Command, ParseError> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err(ParseError::Empty);
    }
    let mut parts = trimmed.split_whitespace();
    let head = parts.next().ok_or(ParseError::Empty)?;

    match head {
        "/look" => Ok(Command::Look),
        "/go" => parts.next().map(|d| Command::Go(d.to_lowercase())).ok_or_else(|| ParseError::MissingArgument("/go".to_string())),
        "/north" => Ok(Command::Go("north".to_string())),
        "/south" => Ok(Command::Go("south".to_string())),
        "/east" => Ok(Command::Go("east".to_string())),
        "/west" => Ok(Command::Go("west".to_string())),
        "/talk" => {
            let arg = trimmed.trim_start_matches("/talk").trim();
            if arg.is_empty() { Err(ParseError::MissingArgument("/talk".to_string())) } else { Ok(Command::Talk(arg.to_string())) }
        }
        "/inspect" => {
            let arg = trimmed.trim_start_matches("/inspect").trim();
            if arg.is_empty() { Err(ParseError::MissingArgument("/inspect".to_string())) } else { Ok(Command::Inspect(arg.to_string())) }
        }
        "/status" => Ok(Command::Status),
        "/help" => Ok(Command::Help),
        "exit" | "quit" => Ok(Command::Exit),
        other => Err(ParseError::Unknown(other.to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_command, Command, ParseError};

    #[test]
    fn parse_look() { assert_eq!(parse_command("/look"), Ok(Command::Look)); }
    #[test]
    fn parse_go_south() { assert_eq!(parse_command("/go south"), Ok(Command::Go("south".to_string()))); }
    #[test]
    fn parse_short_direction() { assert_eq!(parse_command("/south"), Ok(Command::Go("south".to_string()))); }
    #[test]
    fn parse_talk_chinese_name() { assert_eq!(parse_command("/talk 华夏真龙策"), Ok(Command::Talk("华夏真龙策".to_string()))); }
    #[test]
    fn parse_unknown() { assert_eq!(parse_command("/dance"), Err(ParseError::Unknown("/dance".to_string()))); }
}
