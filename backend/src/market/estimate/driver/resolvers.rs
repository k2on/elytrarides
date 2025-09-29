use juniper::FieldResult;
use uuid::Uuid;

use crate::graphql::{context::Context, drivers::{Driver, messages::EventDriverGet}};

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
}

