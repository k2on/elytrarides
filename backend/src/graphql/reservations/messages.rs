use actix::Message;
use uuid::Uuid;
use crate::{types::phone::Phone, market::estimate::driver::stop::model::DriverStopEstimation};

use super::{model::{DBReservation, Reservation, ReservationWithoutStops}, stops::model::DBReservationStop, FormReservation, ReservationInput};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Reservation>")]
pub struct ReservationGet {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<ReservationWithoutStops>")]
pub struct ReservationGetWithoutStops {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Reservation>")]
pub struct ReservationGetByReserver {
    pub phone: Phone,
    pub id_event: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<Reservation>>")]
pub struct ReservationsList {
    pub id_event: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<Reservation>>")]
pub struct ReservationsInPool {
    pub id_event: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Reservation>")]
pub struct ReservationReserve {
    pub id: Uuid,
    pub id_event: Uuid,
    pub phone: Phone,
    pub input: ReservationInput,
    pub stop_etas: Vec<DriverStopEstimation>,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationCancel {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationUpdate {
    pub id: Uuid,
    pub form: FormReservation,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationAssignDriver {
    pub id: Uuid,
    pub id_driver: i32,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationRemoveDriver {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationConfirmPickup {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationConfirmDropoff {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservationStop>")]
pub struct ReservationCompleteStop {
    pub id_stop: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationComplete {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<usize>")]
pub struct ReservationsClear {
    pub id_event: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationRate {
    pub id: Uuid,
    pub rating: i32,
    pub feedback: i32,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationGiveCancelReason {
    pub id: Uuid,
    pub reason: i32,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBReservationStop>>")]
pub struct ReservationGetStops {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBReservationStop>>")]
pub struct ReservationStopsListByReserver {
    pub phone: Phone,
    pub filter_no_place_id: bool,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<ReservationWithoutStops>>")]
pub struct ReservationsListWithoutStops {
    pub ids: Vec<Uuid>
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservationStop>")]
pub struct ReservationStopConfirmArrival {
    pub id_reservation: Uuid,
    pub id_stop: Uuid,
}

