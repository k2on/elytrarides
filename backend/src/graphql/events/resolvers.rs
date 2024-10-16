use juniper::{graphql_value, FieldError, FieldResult};
use uuid::Uuid;

use crate::{graphql::{
    context::Context,
    drivers::{messages::{EventDriversList, EventDriverFind}, model::Driver},
    locations::{messages::OrgLocationGet, OrgLocation},
    orgs::{messages::{OrganizationGet, OrganizationCollegeGet}, model::Organization},
    reservations::{messages::ReservationsList, Reservation, FormReservation, stops::model::{FormLatLng, FormReservationStop}, AvaliableReservation}, colleges::model::College, vehicles::{Vehicle, messages::VehiclesList}
}, market::{types::ReservationEstimate, estimate::{model::StrategyEstimations, driver::stop::model::DriverStopEstimation}, strategy::model::IdEventDriver}};

use super::{messages::EventGet, Event};

pub struct EventQuery;

impl EventQuery {
    pub fn new() -> Self {
        Self
    }
}

#[juniper::graphql_object(Context = Context)]
impl EventQuery {
    #[graphql(description = "Get an event by id")]
    async fn get(ctx: &Context, id: Uuid) -> FieldResult<Event> {
        let db = ctx.db.clone();
        let result = db.send(EventGet { id }).await.map_err(|_| {
            FieldError::new(
                "Error getting event",
                graphql_value!({ "internal_error": "Error getting event" }),
            )
        })??;
        let event = result.into();
        Ok(event)
    }
}

#[juniper::graphql_object(Context = Context)]
impl Event {
    fn id(&self) -> &Uuid {
        &self.id
    }

    fn id_org(&self) -> &Uuid {
        &self.id_org
    }

    async fn org(&self, ctx: &Context) -> FieldResult<Organization> {
        let db = ctx.db.clone();
        let result = db
            .send(OrganizationGet { id: self.id_org })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting org",
                    graphql_value!({ "internal_error": "Err getting org" }),
                )
            })??;
        let org: Organization = result.into();
        Ok(org)
    }

    fn id_location(&self) -> &Option<Uuid> {
        &self.id_location
    }

    async fn location(&self, ctx: &Context) -> FieldResult<Option<OrgLocation>> {
        match &self.id_location {
            Some(id_location) => {
                let db = ctx.db.clone();
                let result = db
                    .send(OrgLocationGet { id: *id_location })
                    .await
                    .map_err(|_| {
                        FieldError::new(
                            "Error getting location",
                            graphql_value!({ "internal_error": "Err getting location" }),
                        )
                    })??;
                let location = result.into();
                Ok(Some(location))
            }
            None => Ok(None),
        }
    }

    fn name(&self) -> &str {
        &self.name
    }

    fn bio(&self) -> &Option<String> {
        &self.bio
    }

    fn image_url(&self) -> &Option<String> {
        &self.image_url
    }

    fn time_start(&self) -> i32 {
        self.time_start
    }

    fn time_end(&self) -> i32 {
        self.time_end
    }

    fn reservations_start(&self) -> i32 {
        self.reservations_start
    }

    fn reservations_end(&self) -> i32 {
        self.reservations_end
    }

    fn obsolete_at(&self) -> &Option<i32> {
        &self.obsolete_at
    }

    fn published_at(&self) -> &Option<i32> {
        &self.published_at
    }

    async fn drivers(&self, ctx: &Context) -> FieldResult<Vec<Driver>> {
        if !ctx.validate_is_member(self.id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a member" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db
            .send(EventDriversList { id_event: self.id })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting drivers",
                    graphql_value!({ "internal_error": "Error getting drivers" }),
                )
            })??;
        let drivers = result.into_iter().map(Driver::from).collect();
        Ok(drivers)
    }

    async fn is_driver(&self, ctx: &Context) -> FieldResult<bool> {
        if !ctx.validate_is_member(self.id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a member" }),
            ));
        }
        let db = ctx.db.clone();
        let result = db.send(EventDriverFind { id_event: self.id, phone: ctx.phone() }).await;
        match result {
            Ok(Ok(_)) => Ok(true),
            _ => Ok(false),
        }
    }

    async fn reservations(&self, ctx: &Context) -> FieldResult<Vec<Reservation>> {
        if !ctx.validate_is_admin(self.id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db
            .send(ReservationsList { id_event: self.id })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting reservations",
                    graphql_value!({ "internal_error": "Error getting reservations" }),
                )
            })??;
        let res = result.into_iter().map(Reservation::from).collect();
        Ok(res)
    }

    async fn estimate(&self, ctx: &Context, form: FormReservation) -> FieldResult<ReservationEstimate> {
        if !ctx.validate_is_authed().await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not logged in" }),
            ));
        }
        let result = ctx.market.event
            .get_estimate_reservation_new(&self.id, &form).await?;
        Ok(result)
    }

    async fn estimate_without_location(&self, ctx: &Context) -> FieldResult<ReservationEstimate> {
        let college_opt: Option<College> = ctx.db.send(OrganizationCollegeGet { id: self.id_org }).await??.map(|college| college.into());
        if let Some(college) = college_opt {
            // let form = FormReservation {
            //     is_dropoff: false,
            //     passenger_count: 1,
            //     stops: vec![
            //         FormReservationStop {
            //             location: FormLatLng {
            //                 lat: college.location_lat,
            //                 lng: college.location_lng,
            //             },
            //             place_id: String::from(""),
            //             address: String::from("Campus")
            //         }
            //     ]
            // };
            let result = ctx.market.event
                .get_estimate_reservation_campus(&self.id, &college).await?;
            Ok(result)
        } else {
            Err(FieldError::new(
                "Bad request",
                graphql_value!({ "internal_error": "Can not make an estimate without a location on an org without a college" }),
            ))
        }
    }

    async fn strategy(&self, ctx: &Context) -> FieldResult<StrategyEstimations> {
        if !ctx.validate_is_admin(self.id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }
        let result = ctx.market.event
            .get_estimates(&self.id).await?;
        Ok(result)
    }

    async fn pool(&self, ctx: &Context) -> FieldResult<Vec<Reservation>> {
        if !ctx.validate_is_admin(self.id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }

        let pool = ctx.market.event.get_pool(&self.id).await?;
        Ok(pool)
    }

    async fn avaliable_reservation(&self, ctx: &Context, id_driver: IdEventDriver) -> FieldResult<Option<AvaliableReservation>> {
        if !ctx.validate_is_driver_for_event(&self.id, &id_driver).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a driver" }),
            ));
        }
        let res = ctx.market.event.get_avaliable_reservation(&self.id, &id_driver).await?;
        Ok(res)
    }

    async fn avaliable_vehicles(&self, ctx: &Context) -> FieldResult<Vec<Vehicle>> {
        if !ctx.validate_is_member(self.id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a member of the event's org" }),
            ));
        }
        let org_vehicles = ctx.db.send(VehiclesList { id_org: self.id_org }).await??;
        let drivers = ctx.db.send(EventDriversList { id_event: self.id }).await??;
        let vehicles = org_vehicles
            .iter()
            .filter(|v| !drivers.iter().any(|d| d.id_vehicle.eq(&Some(v.id)) && !d.phone.eq(&ctx.phone().to_string())))
            .cloned()
            .map(Vehicle::from)
            .collect::<Vec<Vehicle>>();
        Ok(vehicles)
    }
}
