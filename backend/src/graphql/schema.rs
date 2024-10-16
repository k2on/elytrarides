use crate::market::types::StreamMessageMarket;

use super::{
    auth::AuthMutation,
    events::{EventQuery, messages::EventGet},
    geo::resolvers::GeoQuery,
    vehicles::resolvers::VehicleQuery,
    orgs::resolvers::{OrgMutation, OrgQuery},
    reservations::{ReservationMutation, ReservationQuery},
    users::{UserMutation, UserQuery},
    drivers::DriverMutation,
    invites::resolvers::{InviteQuery, InviteMutation},
    colleges::resolvers::{CollegeMutation, CollegeQuery},
};
use juniper::{graphql_object, graphql_value, RootNode, FieldError, FieldResult};
use uuid::Uuid;
use std::sync::Arc;



use super::context::Context;

pub struct QueryRoot {
    user_query: UserQuery,
    org_query: OrgQuery,
    event_query: EventQuery,
    reservation_query: ReservationQuery,
    geo_query: GeoQuery,
    vehicle_query: VehicleQuery,
    invite_query: InviteQuery,
    college_query: CollegeQuery,
}

#[graphql_object(context = Context)]
impl QueryRoot {
    #[doc = "The minimum api version for the mobile client"]
    fn version(&self) -> i32 {
        1
    }

    fn users(&self) -> &UserQuery {
        &self.user_query
    }

    fn orgs(&self) -> &OrgQuery {
        &self.org_query
    }

    fn events(&self) -> &EventQuery {
        &self.event_query
    }

    fn reservations(&self) -> &ReservationQuery {
        &self.reservation_query
    }

    fn geo(&self) -> &GeoQuery {
        &self.geo_query
    }

    fn vehicles(&self) -> &VehicleQuery {
        &self.vehicle_query
    }

    fn invites(&self) -> &InviteQuery {
        &self.invite_query
    }

    fn colleges(&self) -> &CollegeQuery {
        &self.college_query
    }
}

pub struct MutationRoot {
    user_mutation: UserMutation,
    auth_mutation: AuthMutation,
    org_mutation: OrgMutation,
    reservation_mutation: ReservationMutation,
    driver_mutation: DriverMutation,
    invite_mutation: InviteMutation,
    college_mutation: CollegeMutation,
}

#[graphql_object(context = Context)]
impl MutationRoot {
    fn users(&self) -> &UserMutation {
        &self.user_mutation
    }

    fn auth(&self) -> &AuthMutation {
        &self.auth_mutation
    }

    fn orgs(&self) -> &OrgMutation {
        &self.org_mutation
    }

    fn reservations(&self) -> &ReservationMutation {
        &self.reservation_mutation
    }

    fn drivers(&self) -> &DriverMutation {
        &self.driver_mutation
    }

    fn invites(&self) -> &InviteMutation {
        &self.invite_mutation
    }

    fn colleges(&self) -> &CollegeMutation {
        &self.college_mutation
    }
}

pub struct Subscription;





#[juniper::graphql_subscription(context = Context)]
impl Subscription {
    #[graphql(description = "Subscribe to real time reservation data")]
    async fn reservation(ctx: &Context, token: String, id: Uuid) -> FieldResult<StreamMessageMarket> {
        let phone = ctx.jwt.decode(token)
            .map_err(|_| FieldError::new("Unauthorized", graphql_value!({ "internal_error": "Invalid token" })))?;

        let ctx_authed = ctx.as_user(phone);
        if !ctx_authed.validate_owns_reservation(id).await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }

        let stream = ctx.market.messanger.subscribe(format!("res:{id}")).await?;

        Ok(stream)
    }

    #[graphql(description = "Subscribe to real time event data")]
    async fn event(ctx: &Context, token: String, id_event: Uuid) -> FieldResult<StreamMessageMarket> {
        let phone = ctx.jwt.decode(token)
            .map_err(|_| FieldError::new("Unauthorized", graphql_value!({ "internal_error": "Invalid token" })))?;

        let event = ctx.db.send(EventGet { id: id_event }).await
            .map_err(|_| FieldError::new("Not Found", graphql_value!({ "internal_error": "Event not found" })))??;

        let ctx_authed = ctx.as_user(phone);
        if !ctx_authed.validate_is_admin(event.id_org).await { return Err(FieldError::new("Not authorized", graphql_value!({ "internal_error": "Not authorized" }))) }

        let stream = ctx.market.messanger.subscribe(format!("event:{id_event}")).await?;

        Ok(stream)
    }
}

pub type Schema = Arc<RootNode<'static, QueryRoot, MutationRoot, Subscription>>;

pub fn create_schema() -> Schema {
    let query = QueryRoot {
        user_query: UserQuery::new(),
        org_query: OrgQuery::new(),
        event_query: EventQuery::new(),
        reservation_query: ReservationQuery::new(),
        geo_query: GeoQuery::new(),
        vehicle_query: VehicleQuery::new(),
        invite_query: InviteQuery::new(),
        college_query: CollegeQuery::new(),
    };

    let mutation = MutationRoot {
        user_mutation: UserMutation::new(),
        auth_mutation: AuthMutation::new(),
        org_mutation: OrgMutation::new(),
        reservation_mutation: ReservationMutation::new(),
        driver_mutation: DriverMutation::new(),
        invite_mutation: InviteMutation::new(),
        college_mutation: CollegeMutation::new(),
    };

    Arc::new(RootNode::new(query, mutation, Subscription))
}
