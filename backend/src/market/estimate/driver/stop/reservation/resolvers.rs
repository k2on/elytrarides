use juniper::FieldResult;
use uuid::Uuid;

use crate::{market::strategy::driver::stop::reservation::location::model::DriverStopLocation, graphql::{context::Context, reservations::{messages::ReservationGet, Reservation}}};

use super::model::DriverStopEstimationReservation;

#[juniper::graphql_object(Context = Context)]
impl DriverStopEstimationReservation {
    fn location(&self) -> &DriverStopLocation {
        &self.location
    }

    fn id_reservation(&self) -> &Uuid {
        &self.id_reservation
    }

    async fn reservation(&self, ctx: &Context) -> FieldResult<Reservation> {
        let reservation = ctx.db.send(ReservationGet { id: self.id_reservation }).await??;
        Ok(reservation.into())
    }

    fn passengers(&self) -> i32 {
        self.passengers
    }

    fn is_dropoff(&self) -> bool {
        self.is_dropoff
    }

    fn order(&self) -> i32 {
        self.order
    }

    fn seconds_pickup(&self) -> i32 {
        self.pickup.num_seconds() as i32
    }

    fn seconds_arrival(&self) -> i32 {
        self.arrival.num_seconds() as i32
    }
}


