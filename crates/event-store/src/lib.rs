use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use world_core::{build_event, EventType, WorldEvent};

/// Append-only in-memory ledger for world events.
#[derive(Debug, Default, Clone)]
pub struct EventStore {
    events: Vec<WorldEvent>,
}

/// Errors for event store operations.
#[derive(Debug)]
pub enum EventStoreError {
    InvalidActor,
}

impl Display for EventStoreError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            EventStoreError::InvalidActor => write!(f, "invalid actor for event"),
        }
    }
}
impl std::error::Error for EventStoreError {}

impl EventStore {
    pub fn new() -> Self {
        Self { events: Vec::new() }
    }

    pub fn len(&self) -> usize {
        self.events.len()
    }

    pub fn events(&self) -> &[WorldEvent] {
        &self.events
    }

    pub fn append(
        &mut self,
        event_type: EventType,
        actor: impl Into<String>,
        payload: HashMap<String, String>,
    ) -> Result<&WorldEvent, EventStoreError> {
        let actor = actor.into();
        if actor.trim().is_empty() {
            return Err(EventStoreError::InvalidActor);
        }
        let id = format!("evt-{}", self.events.len() + 1);
        let evt = build_event(id, event_type, actor, payload);
        self.events.push(evt);
        let idx = self.events.len().saturating_sub(1);
        Ok(&self.events[idx])
    }
}
