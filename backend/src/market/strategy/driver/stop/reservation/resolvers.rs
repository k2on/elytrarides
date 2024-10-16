use juniper::FieldResult;
use uuid::Uuid;

use crate::graphql::{context::Context, reservations::{Reservation, messages::ReservationGet}};

use super::{model::DriverStopReservation, location::model::DriverStopLocation};

#[juniper::graphql_object(Context = Context)]
impl DriverStopReservation {
    fn location(&self) -> &DriverStopLocation {
        &self.location
    }

    fn id_reservation(&self) -> &Uuid {
        &self.id_reservation
    }

    fn passengers(&self) -> i32 {
        self.passengers
    }

    async fn reservation(&self, ctx: &Context) -> FieldResult<Reservation> {
        let reservation = ctx.db.send(ReservationGet { id: self.id_reservation }).await??;
        Ok(reservation.into())
    }

    fn is_dropoff(&self) -> bool {
        self.is_dropoff
    }

    fn order(&self) -> i32 {
        self.order
    }
}

