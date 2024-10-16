use std::collections::HashMap;

use serde::{Serialize, Deserialize};
use uuid::Uuid;

use crate::market::strategy::model::IdEventDriver;

use super::stop::model::DriverStop;

pub type PassengerCount = i32;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriverStrategy {
    pub id: IdEventDriver,
    pub id_event: Uuid,
    pub dest: Option<DriverStop>,
    pub queue: Vec<DriverStop>,
    pub picked_up: HashMap<Uuid, PassengerCount>,
    pub max_capacity: i32,
}
