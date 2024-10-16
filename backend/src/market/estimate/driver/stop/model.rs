use chrono::Duration;
use juniper::GraphQLObject;
use serde::{Serialize, Deserialize};
use uuid::Uuid;

use crate::{market::strategy::driver::stop::model::DriverStop, graphql::context::Context};


#[serde_with::serde_as]
#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
#[graphql(Context = Context)]
pub struct DriverStopEstimation {
    pub stop: DriverStop,
    #[doc = "Estimated time of arival in seconds"]
    pub eta: i32
}

