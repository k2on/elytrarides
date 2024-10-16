use juniper::{FieldResult, FieldError, graphql_value};
use uuid::Uuid;

use crate::{graphql::{context::Context, users::User, vehicles::{Vehicle, messages::VehicleGet}, reservations::stops::model::FormLatLng, events::{Event, messages::EventGet}}, types::phone::Phone, market::{estimate::driver::model::DriverStrategyEstimations, strategy::model::IdEventDriver}};

use super::{model::Driver, DriverWithVehicle};

#[juniper::graphql_object(Context = Context)]
impl Driver {
    fn id(&self) -> i32 {
        self.id
    }

    fn phone(&self) -> &Phone {
        &self.phone
    }

    fn id_event(&self) -> Uuid {
        self.id_event
    }

    fn id_vehicle(&self) -> Option<Uuid> {
        self.id_vehicle
    }

    fn obsolete_at(&self) -> Option<i32> {
        self.obsolete_at
    }

    async fn user(&self, ctx: &Context) -> FieldResult<User> {
        Ok(ctx.user_get(&self.phone).await)
    }

    async fn vehicle(&self, ctx: &Context) -> FieldResult<Option<Vehicle>> {
        if let Some(id) = self.id_vehicle {
            let db = ctx.db.clone();
            let result = db.send(VehicleGet { id }).await
                .map_err(|_| FieldError::new("Error getting vehicle", graphql_value!({ "internal_error": "Err getting vehicle" })))??;
            let vehicle: Vehicle = result.into();
            Ok(Some(vehicle))
        } else {
            Ok(None)
        }
    }

    async fn event(&self, ctx: &Context) -> FieldResult<Event> {
        let db = ctx.db.clone();
        let event = db.send(EventGet { id: self.id_event }).await??;
        Ok(event.into())
    }
}


#[juniper::graphql_object(Context = Context)]
impl DriverWithVehicle {
    fn id(&self) -> i32 {
        self.id
    }

    fn phone(&self) -> &Phone {
        &self.phone
    }

    fn id_event(&self) -> Uuid {
        self.id_event
    }

    fn id_vehicle(&self) -> Uuid {
        self.id_vehicle
    }

    fn obsolete_at(&self) -> Option<i32> {
        self.obsolete_at
    }

    async fn user(&self, ctx: &Context) -> FieldResult<User> {
        Ok(ctx.user_get(&self.phone).await)
    }

    async fn vehicle(&self, ctx: &Context) -> FieldResult<Vehicle> {
        let db = ctx.db.clone();
        let result = db.send(VehicleGet { id: self.id_vehicle }).await
            .map_err(|_| FieldError::new("Error getting vehicle", graphql_value!({ "internal_error": "Err getting vehicle" })))??;
        let vehicle: Vehicle = result.into();
        Ok(vehicle)
    }
}



pub struct DriverMutation;

impl DriverMutation {
    pub fn new() -> Self {
        Self
    }
}

// #[juniper::graphql_object(Context = Context)]
// impl DriverStrategy {
//     async fn driver(&self, ctx: &Context) -> FieldResult<Driver> {
//         let driver = ctx.db.send(EventDriverGet { id: self.id }).await??;
//         Ok(driver.into())
//     }

//     fn picked_up(&self) -> Vec<Uuid> {
//         self.picked_up.clone().keys().cloned().collect()
//     }

//     fn dest(&self) -> Option<DriverStop> {
//         self.dest.clone()
//     }

//     fn queue(&self) -> Vec<DriverStop> {
//         self.queue.clone()
//     }

//     async fn time_till_free(&self, ctx: &Context) -> FieldResult<i32> {
//         Ok(ctx.market.estimate_driver_till_free(&self.id_event, &self.id).await?)
//     }
// }

#[juniper::graphql_object(Context = Context)]
impl DriverMutation {
    #[graphql(description = "Sync driver location and queue with server")]
    async fn ping(ctx: &Context, id_event: Uuid, id_driver: i32, location: FormLatLng) -> FieldResult<DriverStrategyEstimations> {
        if !ctx.validate_is_driver_for_event(&id_event, &id_driver).await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }
        let driver_strat = ctx.market.driver.ping(&id_event, &id_driver, &location.latlng()).await?;
        Ok(driver_strat)
    }

    #[graphql(description = "Accept a reservation")]
    async fn accept_reservation(ctx: &Context, id_driver: i32, id_reservation: Uuid) -> FieldResult<DriverStrategyEstimations> {
        if !ctx.validate_is_driver_able_to_accept_reservation(&id_driver, &id_reservation).await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }
        let driver_strat = ctx.market.driver.accept(&id_driver, &id_reservation).await?;
        Ok(driver_strat)
    }
    

    #[graphql(description = "Confirm driver arrival")]
    async fn confirm_arrival(ctx: &Context, id_event: Uuid, id_driver: i32) -> FieldResult<DriverStrategyEstimations> {
        if !ctx.validate_is_driver_for_event(&id_event, &id_driver).await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }
        let driver_strat = ctx.market.driver.arrive(&id_event, &id_driver).await?;
        Ok(driver_strat)
    }

    #[graphql(description = "Complete the current stop")]
    async fn next(ctx: &Context, id_event: Uuid, id_driver: IdEventDriver) -> FieldResult<DriverStrategyEstimations> {
        if !ctx.validate_is_driver_for_event(&id_event, &id_driver).await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }
        let driver_strat = ctx.market.driver.next(&id_event, &id_driver).await?;
        Ok(driver_strat)
    }
}
