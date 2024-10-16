use juniper::{GraphQLUnion, GraphQLObject};
use serde::{Serialize, Deserialize};
use uuid::Uuid;

use crate::graphql::context::Context;

use super::event::model::DriverStopEvent;
use super::reservation::location::model::DriverStopLocation;
use super::reservation::model::DriverStopReservation;

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
#[graphql(Context = Context)]
pub struct DriverStop {
    pub id_stop: Uuid,
    pub id_reservation: Uuid,
    pub is_event_location: bool,
    pub lat: f64,
    pub lng: f64,
    pub address_main: String,
    pub address_sub: String,
    pub passengers: i32,
}
