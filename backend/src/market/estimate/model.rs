use std::collections::HashMap;

use serde::{Serialize, Deserialize};
use crate::market::strategy::model::IdEventDriver;
use super::driver::model::DriverStrategyEstimations;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StrategyEstimations {
    pub drivers: HashMap<IdEventDriver, DriverStrategyEstimations>,
}


