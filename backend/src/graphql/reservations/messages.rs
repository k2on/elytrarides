use actix::Message;
use uuid::Uuid;
use crate::types::phone::Phone;

use super::{model::DBReservation, FormReservation, FormReservationGeocoded};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationGet {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationGetByReserver {
    pub phone: Phone,
    pub id_event: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBReservation>>")]
pub struct ReservationsListByReserver {
    pub phone: Phone,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBReservation>>")]
pub struct ReservationsList {
    pub id_event: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBReservation>>")]
pub struct ReservationsInPool {
    pub id_event: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationReserve {
    pub id: Uuid,
    pub id_event: Uuid,
    pub phone: Phone,
    pub form: FormReservationGeocoded,
    pub est_pickup: i32,
    pub est_dropoff: i32,
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
#[rtype(result = "QueryResult<DBReservation>")]
pub struct ReservationConfirmArrival {
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
