use juniper::GraphQLUnion;
use serde::{Serialize, Deserialize};

use crate::graphql::context::Context;

use super::event::model::DriverStopEvent;
use super::reservation::model::DriverStopReservation;

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLUnion)]
#[graphql(Context = Context)]
pub enum DriverStop {
    Event(DriverStopEvent),
    Reservation(DriverStopReservation),
}
