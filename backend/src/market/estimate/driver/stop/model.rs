use juniper::GraphQLUnion;
use serde::{Serialize, Deserialize};

use crate::graphql::context::Context;

use super::{reservation::model::DriverStopEstimationReservation, event::model::DriverStopEstimationEvent};

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLUnion)]
#[graphql(Context = Context)]
pub enum DriverStopEstimation {
    Reservation(DriverStopEstimationReservation),
    Event(DriverStopEstimationEvent),
}

