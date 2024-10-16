use std::error::Error;
use diesel::{Queryable, Insertable, pg::Pg, AsChangeset, AsExpression, FromSqlRow};
use juniper::{GraphQLInputObject, GraphQLObject};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use super::{stops::model::{FormReservationStop, ReservationInputStop, ReservationStop, DBReservationStop}, feedback::model::Feedback};

use crate::{schema::reservations, types::phone::Phone, graphql::{geo::model::LatLng, context::Context}, market::{strategy::driver::stop::{reservation::location::model::Address, model::DriverStop}, util::now, estimate::driver::stop::model::DriverStopEstimation}};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ReservationStatus {
    WAITING,
    ACTIVE,
    COMPLETE,
    CANCELLED,
    INCOMPLETE,
}

impl ReservationStatus {
    pub fn new(status: i32) -> Self {
        match status {
            0 => ReservationStatus::WAITING,
            1 => ReservationStatus::ACTIVE,
            2 => ReservationStatus::COMPLETE,
            3 => ReservationStatus::CANCELLED,
            4 => ReservationStatus::INCOMPLETE,
            i => panic!("Invalid reservation status: {}", i)
        }
    }

    pub fn int(&self) -> i32 {
        match self {
            ReservationStatus::WAITING => 0,
            ReservationStatus::ACTIVE => 1,
            ReservationStatus::COMPLETE => 2,
            ReservationStatus::CANCELLED => 3,
            ReservationStatus::INCOMPLETE => 4
        }
    }

}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReservationWithStops {
    pub reservation: Reservation,
    pub stops: Vec<ReservationStop>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Reservation {
    pub id: Uuid,
    pub id_event: Uuid,
    pub made_at: i32,
    pub reserver: Phone,
    pub passenger_count: i32,
    pub cancelled_at: Option<i32>,
    pub id_driver: Option<i32>,
    pub rating: Option<i32>,
    pub feedback: Option<Feedback>,
    pub rated_at: Option<i32>,
    pub cancel_reason: Option<i32>,
    pub cancel_reason_at: Option<i32>,
    pub status: ReservationStatus,
    pub driver_assigned_at: Option<i32>,
    pub initial_passenger_count: i32,
    pub actual_passenger_count_given_at: Option<i32>,
    pub stops: Vec<ReservationStop>,
}

impl Reservation {
    pub fn new(db_res: DBReservation, stops: Vec<ReservationStop>) -> Self {
        Self {
            id: db_res.id,
            id_event: db_res.id_event,
            made_at: db_res.made_at,
            reserver: Phone::new(&db_res.reserver).expect("Invalid phone number format"),
            passenger_count: db_res.passenger_count,
            cancelled_at: db_res.cancelled_at,
            id_driver: db_res.id_driver,
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
            status: ReservationStatus::new(db_res.status),
            driver_assigned_at: db_res.driver_assigned_at,
            initial_passenger_count: db_res.initial_passenger_count,
            actual_passenger_count_given_at: db_res.actual_passenger_count_given_at,
            stops,
        }
    }

    pub fn get_driver_stop(&self, idx: usize) -> DriverStop {
        self.stops.get(0).unwrap().to_driver_stop(self.passenger_count)
    } 
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReservationWithoutStops {
    pub id: Uuid,
    pub id_event: Uuid,
    pub made_at: i32,
    pub reserver: Phone,
    pub passenger_count: i32,
    pub cancelled_at: Option<i32>,
    pub id_driver: Option<i32>,
    pub rating: Option<i32>,
    pub feedback: Option<Feedback>,
    pub rated_at: Option<i32>,
    pub cancel_reason: Option<i32>,
    pub cancel_reason_at: Option<i32>,
    pub status: ReservationStatus,
    pub driver_assigned_at: Option<i32>,
    pub initial_passenger_count: i32,
    pub actual_passenger_count_given_at: Option<i32>,
}


#[derive(Debug, Serialize, Insertable, AsChangeset, Queryable, GraphQLObject)]
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
    pub status: i32,
    pub driver_assigned_at: Option<i32>,
    pub initial_passenger_count: i32,
    pub actual_passenger_count_given_at: Option<i32>,
}

#[derive(Queryable, Debug, Serialize, Clone)]
pub struct DBReservationJoinable {
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
    pub status: i32,
    pub driver_assigned_at: Option<i32>,
    pub initial_passenger_count: i32,
    pub actual_passenger_count_given_at: Option<i32>,
    pub id_stop: Uuid,
    pub id_reservation: Uuid,
    pub stop_order: i32,
    pub eta: i32,
    pub created_at: i32,
    pub updated_at: Option<i32>,
    pub complete_at: Option<i32>,
    pub driver_arrived_at: Option<i32>,
    pub is_event_location: bool,
    pub lat: f64,
    pub lng: f64,
    pub lat_address: f64,
    pub lng_address: f64,
    pub address_main: String,
    pub address_sub: String,
    pub place_id: Option<String>,
}

#[derive(Debug, GraphQLInputObject)]
pub struct FormReservation {
    pub passenger_count: i32,
    pub stops: Vec<FormReservationStop>,
}

#[derive(Debug)]
pub struct ReservationInput {
    pub passenger_count: i32,
    pub stops: Vec<ReservationInputStop>,
}

impl ReservationInput {
    pub fn to_reservation(&self, id_event: &Uuid, id_reservation: &Uuid, reserver: Phone) -> Reservation {
        Reservation {
            id: *id_reservation,
            id_event: *id_event,
            made_at: now(),
            reserver,
            passenger_count: self.passenger_count,
            cancelled_at: None,
            id_driver: None,
            rating: None,
            feedback: None,
            rated_at: None,
            cancel_reason: None,
            cancel_reason_at: None,
            status: ReservationStatus::WAITING,
            driver_assigned_at: None,
            initial_passenger_count: self.passenger_count,
            actual_passenger_count_given_at: None,
            stops: self.stops
                .iter()
                .map(|stop| ReservationStop {
                    id: stop.id,
                    id_reservation: *id_reservation,
                    stop_order: stop.stop_order,
                    eta: 0,
                    created_at: now(),
                    updated_at: None,
                    complete_at: None,
                    driver_arrived_at: None,
                    is_event_location: stop.is_event_location,
                    lat: stop.lat,
                    lng: stop.lng,
                    lat_address: stop.lat_address,
                    lng_address: stop.lng_address,
                    address_main: stop.address_main.clone(),
                    address_sub: stop.address_sub.clone(),
                    place_id: stop.place_id.clone(),
                })
                .collect(),
        }
    }
}


impl From<DBReservation> for ReservationWithoutStops {
    fn from(db_res: DBReservation) -> Self {
        Self {
            id: db_res.id,
            id_event: db_res.id_event,
            made_at: db_res.made_at,
            reserver: Phone::new(&db_res.reserver).expect("Invalid phone number format"),
            passenger_count: db_res.passenger_count,
            cancelled_at: db_res.cancelled_at,
            id_driver: db_res.id_driver,
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
            status: ReservationStatus::new(db_res.status),
            driver_assigned_at: db_res.driver_assigned_at,
            initial_passenger_count: db_res.initial_passenger_count,
            actual_passenger_count_given_at: db_res.actual_passenger_count_given_at,
        }
    }
}


#[derive(Debug, Serialize, Deserialize, Clone, GraphQLObject)]
#[graphql(Context = Context)]
pub struct AvaliableReservation {
    pub reservation: ReservationWithoutStops,
    pub stops: Vec<DriverStopEstimation>,
}
