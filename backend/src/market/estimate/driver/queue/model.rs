use serde::{Serialize, Deserialize};

use super::super::stop::model::DriverStopEstimation;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Queue(pub Vec<DriverStopEstimation>);
