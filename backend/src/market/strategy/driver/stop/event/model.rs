use juniper::GraphQLObject;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
pub struct DriverStopEvent {
    a: bool, // GraphQL needs some field to be present
}

impl DriverStopEvent {
    pub fn new() -> Self {
        Self { a: true }
    }
}
