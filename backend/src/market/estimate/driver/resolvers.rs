use std::collections::HashSet;

use juniper::FieldResult;
use uuid::Uuid;

use crate::graphql::{context::Context, drivers::{Driver, messages::EventDriverGet}, reservations::{Reservation, DBReservation, messages::ReservationsListWithoutStops, ReservationWithoutStops}};

use super::{model::DriverStrategyEstimations, stop::model::DriverStopEstimation};

#[juniper::graphql_object(Context = Context)]
impl DriverStrategyEstimations {
    async fn driver(&self, ctx: &Context) -> FieldResult<Driver> {
        let driver = ctx.db.send(EventDriverGet { id: self.id }).await??;
        Ok(driver.into())
    }

    fn picked_up(&self) -> Vec<Uuid> {
        self.picked_up.keys().cloned().collect()
    }

    fn dest(&self) -> Option<DriverStopEstimation> {
        self.dest.clone()
    }

    fn queue(&self) -> Vec<DriverStopEstimation> {
        self.queue.iter().cloned().collect()
    }

    async fn reservations(&self, ctx: &Context) -> FieldResult<Vec<ReservationWithoutStops>> {
        let mut ids: HashSet<Uuid> = self.picked_up.clone().into_keys().collect();
        if let Some(dest) = &self.dest {
            ids.insert(dest.stop.id_reservation);
        }
        let queue_ids: Vec<Uuid> = self.queue.iter().map(|stop| stop.stop.id_reservation).collect();
        ids.extend(queue_ids);
        let reservations = ctx.db.send(ReservationsListWithoutStops { ids: ids.iter().cloned().collect() }).await??;
        Ok(reservations)
    }
}

