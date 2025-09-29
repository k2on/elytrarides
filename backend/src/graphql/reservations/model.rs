use std::error::Error;
use diesel::{Queryable, Insertable, pg::Pg, AsChangeset};
use juniper::GraphQLInputObject;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use super::{stops::model::{ReservationStops, FormReservationStop}, feedback::model::Feedback};

use crate::{schema::reservations, types::phone::Phone, graphql::geo::model::LatLng, market::strategy::driver::stop::reservation::location::model::Address};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Reservation {
    pub id: Uuid,
    pub id_event: Uuid,
    pub made_at: i32,
    pub reserver: Phone,
    pub passenger_count: i32,
    pub is_cancelled: bool,
    pub cancelled_at: Option<i32>,
    pub id_driver: Option<i32>,
    pub is_complete: bool,
    pub complete_at: Option<i32>,
    pub stops: ReservationStops,
    pub is_dropoff: bool,
    pub is_driver_arrived: bool,
    pub driver_arrived_at: Option<i32>,
    pub est_pickup: i32,
    pub est_dropoff: i32,
    pub rating: Option<i32>,
    pub feedback: Option<Feedback>,
    pub rated_at: Option<i32>,
    pub cancel_reason: Option<i32>,
    pub cancel_reason_at: Option<i32>,
}

#[derive(Debug, Serialize, Insertable, AsChangeset)]
#[diesel(table_name=reservations)]
pub struct DBReservation {
    pub made_at: i32,
    pub reserver: String,
    pub passenger_count: i32,
    pub cancelled_at: Option<i32>,
    pub id_driver: Option<i32>,
    pub id: Uuid,
    pub id_event: Uuid,
    pub rating: Option<i32>,
    pub feedback: Option<i32>,
    pub rated_at: Option<i32>,
    pub cancel_reason: Option<i32>,
    pub cancel_reason_at: Option<i32>,
    pub is_cancelled: bool,
    pub is_complete: bool,
    pub complete_at: Option<i32>,
    pub stops: ReservationStops,
    pub is_dropoff: bool,
    pub is_driver_arrived: bool,
    pub driver_arrived_at: Option<i32>,
    pub est_pickup: i32,
    pub est_dropoff: i32,
}

impl
    Queryable<
        (
        diesel::sql_types::Integer,           // made_at
        diesel::sql_types::Text,              // reserver
        diesel::sql_types::Integer,           // passenger_count
        diesel::sql_types::Nullable<diesel::sql_types::Integer>,  // cancelled_at
        diesel::sql_types::Nullable<diesel::sql_types::Integer>,  // id_driver
        diesel::sql_types::Uuid,              // id
        diesel::sql_types::Uuid,              // id_event
        diesel::sql_types::Nullable<diesel::sql_types::Integer>,  // rating
        diesel::sql_types::Nullable<diesel::sql_types::Integer>,  // feedback
        diesel::sql_types::Nullable<diesel::sql_types::Integer>,  // rated_at
        diesel::sql_types::Nullable<diesel::sql_types::Integer>,  // cancel_reason
        diesel::sql_types::Nullable<diesel::sql_types::Integer>,  // cancel_reason_at
        diesel::sql_types::Bool,              // is_cancelled
        diesel::sql_types::Bool,              // is_complete
        diesel::sql_types::Nullable<diesel::sql_types::Integer>,  // complete_at
        diesel::sql_types::Text,              // stops
        diesel::sql_types::Bool,              // is_dropoff
        diesel::sql_types::Bool,              // is_driver_arrived
        diesel::sql_types::Nullable<diesel::sql_types::Integer>,  // driver_arrived_at
        diesel::sql_types::Integer,  // est_pickup
        diesel::sql_types::Integer,  // est_dropoff
        ),
        Pg,
    > for DBReservation
{
    type Row = (
        i32, String, i32, Option<i32>, Option<i32>, Uuid, Uuid,
        Option<i32>, Option<i32>, Option<i32>, Option<i32>, Option<i32>,
        bool, bool, Option<i32>, ReservationStops, bool, bool,
        Option<i32>, i32, i32,
    );

    fn build(row: Self::Row) -> Result<Self, Box<dyn Error + Send + Sync>> {
        Ok(DBReservation {
            made_at: row.0,
            reserver: row.1,
            passenger_count: row.2,
            cancelled_at: row.3,
            id_driver: row.4,
            id: row.5,
            id_event: row.6,
            rating: row.7,
            feedback: row.8,
            rated_at: row.9,
            cancel_reason: row.10,
            cancel_reason_at: row.11,
            is_cancelled: row.12,
            is_complete: row.13,
            complete_at: row.14,
            stops: row.15,
            is_dropoff: row.16,
            is_driver_arrived: row.17,
            driver_arrived_at: row.18,
            est_pickup: row.19,
            est_dropoff: row.20,
        })
    }
}


#[derive(Debug, GraphQLInputObject)]
pub struct FormReservation {
    pub passenger_count: i32,
    pub stops: Vec<FormReservationStop>,
    pub is_dropoff: bool,
}

impl From<DBReservation> for Reservation {
    fn from(db_res: DBReservation) -> Self {
        Self {
            id: db_res.id,
            id_event: db_res.id_event,
            made_at: db_res.made_at,
            reserver: Phone::new(&db_res.reserver).expect("Invalid phone number format"),
            passenger_count: db_res.passenger_count,
            is_cancelled: db_res.is_cancelled,
            cancelled_at: db_res.cancelled_at,
            id_driver: db_res.id_driver,
            is_complete: db_res.is_complete,
            complete_at: db_res.complete_at,
            stops: db_res.stops,
            is_dropoff: db_res.is_dropoff,
            is_driver_arrived: db_res.is_driver_arrived,
            driver_arrived_at: db_res.driver_arrived_at,
            est_pickup: db_res.est_pickup,
            est_dropoff: db_res.est_dropoff,
            rating: db_res.rating,
            feedback: db_res.feedback.map(|flags| Feedback {
                is_long_wait: flags & 1 != 0,
                is_eta_accuracy: flags & 2 != 0,
                is_pickup_spot: flags & 4 != 0,
                is_driver_never_arrived: flags & 8 != 0,

            }),
            rated_at: db_res.rated_at,
            cancel_reason: db_res.cancel_reason,
            cancel_reason_at: db_res.cancel_reason_at,
        }
    }
}

#[derive(Debug)]
pub struct FormReservationGeocoded {
    pub passenger_count: i32,
    pub stops: Vec<FormReservationStopGeocoded>,
    pub is_dropoff: bool,
}

#[derive(Debug, Clone)]
pub struct FormReservationStopGeocoded {
    pub location: LatLng,
    pub address: Address,
    pub place_id: String,
}


