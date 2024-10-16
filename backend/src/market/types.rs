use std::pin::Pin;

use chrono::Duration;
use juniper::{GraphQLObject, FieldError, graphql_object};
use serde::{Serialize, Deserialize};

use crate::graphql::context::Context;

use super::{messages::MessageMarket, error::ErrorMarket, strategy::{model::IdEventDriver, driver::stop::reservation::model::DriverStopReservation}, estimate::driver::stop::model::DriverStopEstimation};


#[serde_with::serde_as]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TimeEstimate {
    #[serde_as(as = "serde_with::DurationSeconds<i64>")]
    pub pickup: Duration,
    #[serde_as(as = "serde_with::DurationSeconds<i64>")]
    pub arrival: Duration,
}



#[graphql_object()]
impl TimeEstimate {
    pub fn pickup(&self) -> i32 {
        self.pickup.num_seconds() as i32
    }

    pub fn arrival(&self) -> i32 {
        self.arrival.num_seconds() as i32
    }
}


#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
#[graphql(Context = Context)]
pub struct ReservationEstimate {
    pub stop_etas: Vec<DriverStopEstimation>,
    pub queue_position: i32,
}

impl ReservationEstimate {
    pub fn new(stop_etas: Vec<DriverStopEstimation>, queue_position: i32) -> Self {
        Self {
            stop_etas,
            queue_position
        }
    }
}




pub type Stream<T> = Pin<Box<dyn futures::Stream<Item = Result<T, FieldError>> + Send>>;
pub type StreamMessageMarket = Stream<MessageMarket>;

#[derive(Clone)]
pub struct ReservationOption {
    pub reservation: DriverStopReservation,
    pub id_driver: IdEventDriver,
    pub driver_queue_position: usize,
}

pub type MarketResult<T> = Result<T, ErrorMarket>;
