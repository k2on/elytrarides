use juniper::GraphQLObject;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
pub struct Feedback {
    pub is_long_wait: bool,
    pub is_eta_accuracy: bool,
    pub is_pickup_spot: bool,
    pub is_driver_never_arrived: bool,
}
