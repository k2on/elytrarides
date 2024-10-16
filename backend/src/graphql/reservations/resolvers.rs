use juniper::{FieldResult, FieldError, graphql_value};
use uuid::Uuid;

use crate::{graphql::{context::Context, users::User, events::{Event, messages::EventGet}, drivers::{Driver, DriverWithVehicle}}, market::types::ReservationEstimate, types::phone::Phone};

use super::{Reservation, messages::{ReservationGetByReserver, ReservationGet, ReservationRate, ReservationGiveCancelReason}, FormReservation, stops::model::ReservationStop, feedback::model::Feedback, ReservationStatus, DBReservation, ReservationWithoutStops};

pub struct ReservationQuery;

#[juniper::graphql_object(Context = Context)]
impl Reservation {
    fn id(&self) -> &Uuid {
        &self.id
    }

    fn status(&self) -> i32 {
        self.status.int()
    }

    fn driver_assigned_at(&self) -> Option<i32> {
        self.driver_assigned_at
    }

    fn id_event(&self) -> &Uuid {
        &self.id_event
    }

    async fn event(&self, ctx: &Context) -> FieldResult<Event> {
        let db = ctx.db.clone();
        let result = db.send(EventGet { id: self.id_event }).await
            .map_err(|_| FieldError::new("Error getting event", graphql_value!({ "internal_error": "Err getting event" })))??;
        let event: Event = result.into();
        Ok(event)
    }

    fn made_at(&self) -> &i32 {
        &self.made_at
    }

    fn reserver_phone(&self) -> &Phone {
        &self.reserver
    }

    async fn reserver(&self, ctx: &Context) -> FieldResult<User> {
        Ok(ctx.user_get(&self.reserver).await)
    }

    fn passenger_count(&self) -> &i32 {
        &self.passenger_count
    }

    fn is_cancelled(&self) -> bool {
        matches!(self.status, ReservationStatus::CANCELLED)
    }

    fn cancelled_at(&self) -> &Option<i32> {
        &self.cancelled_at
    }

    fn id_driver(&self) -> &Option<i32> {
        &self.id_driver
    }

    async fn driver(&self, ctx: &Context) -> FieldResult<Option<DriverWithVehicle>> {
        let driver = if let Some(id_driver) = self.id_driver {
            let driver = ctx.market.driver.get_with_vehicle(&id_driver).await?;
            Some(driver)
        } else {
            None
        };
        Ok(driver)
    }

    fn is_complete(&self) -> bool {
        matches!(self.status, ReservationStatus::COMPLETE)
    }

    fn stops(&self) -> &Vec<ReservationStop> {
        &self.stops
    }

    async fn estimate(&self, ctx: &Context) -> FieldResult<ReservationEstimate> {
        let estimate = ctx.market.reservation
            .estimate(&self).await?;

        Ok(estimate)
    }

    async fn is_picked_up(&self, ctx: &Context) -> FieldResult<bool> {
        match self.id_driver {
            Some(_) => {
                let is_picked_up = ctx.market.reservation
                    .is_picked_up(&self).await?;

                Ok(is_picked_up)
            }
            None => Ok(false)
        }
    }

    fn rating(&self) -> &Option<i32> {
        &self.rating
    }

    fn feedback(&self) -> &Option<Feedback> {
        &self.feedback
    }

    fn rated_at(&self) -> &Option<i32> {
        &self.rated_at
    }

    fn cancel_reason(&self) -> &Option<i32> {
        &self.cancel_reason
    }

    fn cancel_reason_at(&self) -> &Option<i32> {
        &self.cancel_reason_at
    }
}

#[juniper::graphql_object(Context = Context)]
impl ReservationWithoutStops {
    fn id(&self) -> &Uuid {
        &self.id
    }

    fn id_event(&self) -> &Uuid {
        &self.id_event
    }

    async fn event(&self, ctx: &Context) -> FieldResult<Event> {
        let db = ctx.db.clone();
        let result = db.send(EventGet { id: self.id_event }).await
            .map_err(|_| FieldError::new("Error getting event", graphql_value!({ "internal_error": "Err getting event" })))??;
        let event: Event = result.into();
        Ok(event)
    }

    fn made_at(&self) -> &i32 {
        &self.made_at
    }

    fn reserver_phone(&self) -> &Phone {
        &self.reserver
    }

    async fn reserver(&self, ctx: &Context) -> FieldResult<User> {
        Ok(ctx.user_get(&self.reserver).await)
    }

    fn passenger_count(&self) -> &i32 {
        &self.passenger_count
    }

    fn is_cancelled(&self) -> bool {
        matches!(self.status, ReservationStatus::CANCELLED)
    }

    fn cancelled_at(&self) -> &Option<i32> {
        &self.cancelled_at
    }

    fn id_driver(&self) -> &Option<i32> {
        &self.id_driver
    }

    async fn driver(&self, ctx: &Context) -> FieldResult<Option<DriverWithVehicle>> {
        let driver = if let Some(id_driver) = self.id_driver {
            let driver = ctx.market.driver.get_with_vehicle(&id_driver).await?;
            Some(driver)
        } else {
            None
        };
        Ok(driver)
    }

    fn is_complete(&self) -> bool {
        matches!(self.status, ReservationStatus::COMPLETE)
    }

    // async fn is_picked_up(&self, ctx: &Context) -> FieldResult<bool> {
    //     match self.id_driver {
    //         Some(_) => {
    //             let is_picked_up = ctx.market.reservation
    //                 .is_picked_up(&self).await?;

    //             Ok(is_picked_up)
    //         }
    //         None => Ok(false)
    //     }
    // }

    fn rating(&self) -> &Option<i32> {
        &self.rating
    }

    fn feedback(&self) -> &Option<Feedback> {
        &self.feedback
    }

    fn rated_at(&self) -> &Option<i32> {
        &self.rated_at
    }

    fn cancel_reason(&self) -> &Option<i32> {
        &self.cancel_reason
    }

    fn cancel_reason_at(&self) -> &Option<i32> {
        &self.cancel_reason_at
    }
}


impl ReservationQuery{
    pub fn new() -> Self {
        Self
    }
}

#[juniper::graphql_object(Context = Context)]
impl ReservationQuery {
    #[graphql(description = "Get the current users reservation")]
    async fn current(ctx: &Context, id_event: Uuid) -> FieldResult<Option<Reservation>> {
        if !ctx.validate_is_authed().await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }

        let db = ctx.db.clone();
        match db.send(ReservationGetByReserver { phone: ctx.phone(), id_event }).await {
            Ok(Ok(reservation)) => {
                let reservation: Reservation = reservation.into();
                Ok(Some(reservation))
            },
            _ => Ok(None)
        }
    }

    #[graphql(description = "Get a reservation by id")]
    async fn get(ctx: &Context, id: Uuid) -> FieldResult<Reservation> {
        if !ctx.validate_owns_reservation(id).await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }

        let db = ctx.db.clone();
        match db.send(ReservationGet { id }).await {
            Ok(Ok(reservation)) => {
                let reservation: Reservation = reservation.into();
                Ok(reservation)
            },
            _ => Err(FieldError::new("Error getting reservation", graphql_value!({ "internal_error": "Err getting reservation" })))
        }
    }

}

pub struct ReservationMutation;

impl ReservationMutation {
    pub fn new() -> Self {
        Self
    }
}

 
#[juniper::graphql_object(Context = Context)]
impl ReservationMutation {
    #[graphql(description = "Update a reservation")]
    async fn reserve(ctx: &Context, id: Uuid, id_event: Uuid, form: FormReservation) -> FieldResult<Reservation> {
        if !ctx.validate_is_authed().await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }
        let reservation = ctx.market.reservation.create(&ctx.phone(), &id, &id_event, form).await?;
        Ok(reservation)
    }

    #[graphql(description = "Cancel a reservation")]
    async fn cancel(ctx: &Context, id: Uuid) -> FieldResult<Reservation> {
        if !ctx.validate_owns_reservation(id).await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }
        let reservation = ctx.market.reservation.cancel(&id).await?;
        Ok(reservation)
    }

    #[graphql(description = "Rate a reservation")]
    async fn rate(ctx: &Context, id: Uuid, rating: i32, feedback: i32) -> FieldResult<DBReservation> {
        if !ctx.validate_owns_reservation(id).await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }
        let reservation = ctx.db.send(ReservationRate { id, rating, feedback }).await??;
        Ok(reservation)
    }

    #[graphql(description = "Give a reason for the cancellation")]
    async fn give_cancel_reason(ctx: &Context, id: Uuid, reason: i32) -> FieldResult<DBReservation> {
        if !ctx.validate_owns_reservation(id).await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }
        let reservation = ctx.db.send(ReservationGiveCancelReason { id, reason }).await??;
        Ok(reservation)
    }
}
