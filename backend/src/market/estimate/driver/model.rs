use std::collections::HashMap;

use serde::{Serialize, Deserialize};
use uuid::Uuid;

use crate::market::strategy::model::IdEventDriver;

use super::{stop::model::DriverStopEstimation, queue::model::Queue};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DriverStrategyEstimations {
    pub id: IdEventDriver,
    pub dest: Option<DriverStopEstimation>,
    pub queue: Queue,
    pub picked_up: HashMap<Uuid, i32>,
    pub id_event: Uuid,
    pub max_capacity: i32,
}


