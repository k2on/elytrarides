use std::collections::HashMap;

use serde::{Serialize, Deserialize};
use super::driver::model::DriverStrategy;

pub type IdEventDriver = i32;

#[doc = "The strategy is the internal representation of the event strategy."]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Strategy {
    pub drivers: HashMap<IdEventDriver, DriverStrategy>,
}

