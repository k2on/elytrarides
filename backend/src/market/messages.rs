use chrono::Duration;
use juniper::{GraphQLObject, GraphQLUnion};
use redis::{FromRedisValue, Value, RedisResult, RedisError, ErrorKind};
use serde::{Serialize, Deserialize};

use crate::graphql::{geo::model::LatLng, context::Context, reservations::Reservation};

use super::{types::ReservationEstimate, strategy::model::IdEventDriver, estimate::model::StrategyEstimations};

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLUnion)]
#[graphql(Context = Context)]
pub enum MessageMarket {
    DriverLocation(MessageDriverLocation),
    ReservationEstimation(MessageReservationEstimation),
    ReservationUpdate(MessageReservationUpdate),
    EventEstimations(MessageEventEstimations),
}

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
pub struct MessageDriverLocation {
    pub id: IdEventDriver,
    pub location: LatLng,
}

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
pub struct MessageReservationEstimation {
    pub estimate: ReservationEstimate,
}

impl MessageMarket {
    pub fn new_reservation_estimate(pickup: Duration, arrival: Duration, queue_position: i32) -> Self {
        Self::ReservationEstimation(MessageReservationEstimation {
            estimate: ReservationEstimate::new(pickup, arrival, queue_position)
        })
    }

    pub fn new_reservation_update(reservation: Reservation) -> Self {
        Self::ReservationUpdate(MessageReservationUpdate {
            reservation
        })
    }

    pub fn new_driver_location(id: IdEventDriver, location: LatLng) -> Self {
        Self::DriverLocation(MessageDriverLocation {
            id,
            location,
        })
    }

    pub fn serialize(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
#[graphql(Context = Context)]
pub struct MessageEventEstimations {
    pub strategy: StrategyEstimations
}


#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
#[graphql(Context = Context)]
pub struct MessageReservationUpdate {
    pub reservation: Reservation
}

impl FromRedisValue for MessageMarket {
    fn from_redis_value(v: &Value) -> RedisResult<Self> {
        match v {
            Value::Data(ref bytes) => {
                let s = String::from_utf8(bytes.clone()).map_err(|_| (RedisError::from((ErrorKind::TypeError, "Invalid UTF-8 sequence"))))?;
                let msg: MessageMarket = serde_json::from_str(&s).map_err(|_| (RedisError::from((ErrorKind::TypeError, "Invalid Msg format"))))?;
                Ok(msg)
            },
            _ => Err(RedisError::from((ErrorKind::TypeError, "Response type not compatible with Message"))),
        }
    }
}




