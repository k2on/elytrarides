use juniper::{graphql_value, FieldError, FieldResult};
use log::{warn, error};
use serde_json::json;
use uuid::Uuid;

use crate::{
    graphql::{
        context::Context,
        drivers::{
            messages::{EventDriverFind, EventDriverUpdate, EventDriversList},
            model::{Driver, FormEventDriver}, DBDriverInsertable,
        },
        events::{
            messages::{EventGet, EventUpdate, EventsList},
            Event, FormEvent, DBEventInsertable,
        },
        locations::{
            messages::{OrgLocationGet, OrgLocationUpdate, OrgLocations},
            FormLocation, OrgLocation,
        },
        memberships::{
            messages::{OrgMembershipUpdate, OrgMemberships},
            model::Membership,
        },
        vehicles::{
            messages::{VehicleGet, VehicleUpdate, VehiclesList},
            FormVehicle, Vehicle,
        }, invites::{messages::{OrgInviteCreate, GetInvite, OrgInviteRevoke, OrgInvites}, model::Invite}, colleges::{model::College, messages::CollegeGet}, groups::{model::{Group, DBGroupInsertable, FormGroup, GroupMembership, DBGroupMembershipInsertable}, messages::{OrgGroupList, OrgGroupUpdate, OrgGroupGet, OrgGroupMemberUpdate}},
    },
    types::phone::Phone, market::{error::ErrorMarket, util::now, event},
};

use super::{
    messages::{OrganizationGet, OrganizationList, OrganizationUpdate, OrganizationSearch},
    model::{FormOrganization, Organization},
};

pub struct OrgQuery;

impl OrgQuery {
    pub fn new() -> Self {
        Self
    }
}

#[juniper::graphql_object(Context = Context)]
impl Organization {
    fn id(&self) -> &Uuid {
        &self.id
    }

    fn label(&self) -> &str {
        &self.label
    }

    fn bio(&self) -> &Option<String> {
        &self.bio
    }

    fn logo_url(&self) -> &Option<String> {
        &self.logo_url
    }

    fn banner_url(&self) -> &Option<String> {
        &self.banner_url
    }

    async fn college(&self, ctx: &Context) -> FieldResult<Option<College>> {
        if !ctx.validate_is_member(self.id).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a member" }),
            ));
        }

        if let Some(id) = self.id_college {
            let db = ctx.db.clone();
            let college: College = db.send(CollegeGet { id }).await??.into();
            Ok(Some(college))
        } else {
            Ok(None)
        }
    }

    async fn memberships(&self, ctx: &Context) -> FieldResult<Vec<Membership>> {
        if !ctx.validate_is_member(self.id).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a member" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db
            .send(OrgMemberships { id_org: self.id })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting members",
                    graphql_value!({ "internal_error": "Error getting members" }),
                )
            })??;
        let memberships = result.into_iter().map(Membership::from).collect();
        Ok(memberships)
    }

    async fn locations(&self, ctx: &Context) -> FieldResult<Vec<OrgLocation>> {
        if !ctx.validate_is_member(self.id).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a member" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db
            .send(OrgLocations { id_org: self.id })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting locations",
                    graphql_value!({ "internal_error": "Error getting locations" }),
                )
            })??;
        let locations = result.into_iter().map(OrgLocation::from).collect();
        Ok(locations)
    }

    async fn vehicles(&self, ctx: &Context) -> FieldResult<Vec<Vehicle>> {
        if !ctx.validate_is_member(self.id).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a member" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db
            .send(VehiclesList { id_org: self.id })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting vehicles",
                    graphql_value!({ "internal_error": "Error getting vehicles" }),
                )
            })??;
        let vehicles = result.into_iter().map(Vehicle::from).collect();
        Ok(vehicles)
    }

    async fn events(&self, ctx: &Context) -> FieldResult<Vec<Event>> {
        if !ctx.validate_is_member(self.id).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a member" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db
            .send(EventsList { id_org: self.id })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting events",
                    graphql_value!({ "internal_error": "Error getting events" }),
                )
            })??;
        let events = result.into_iter().map(Event::from).collect();
        Ok(events)
    }

    async fn invites(&self, ctx: &Context) -> FieldResult<Vec<Invite>> {
        if !ctx.validate_is_admin(self.id).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a member" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db
            .send(OrgInvites { id_org: self.id })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting events",
                    graphql_value!({ "internal_error": "Error getting events" }),
                )
            })??;
        let invites = result.into_iter().map(Invite::from).collect();
        Ok(invites)
    }

    async fn groups(&self, ctx: &Context) -> FieldResult<Vec<Group>> {
        if !ctx.validate_is_admin(self.id).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a member" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db.send(OrgGroupList { id_org: self.id }).await??;
        let groups = result.into_iter().map(Group::from).collect();
        Ok(groups)
    }
}

#[juniper::graphql_object(Context = Context)]
impl OrgQuery {
    #[graphql(description = "List all organizations")]
    async fn all(ctx: &Context) -> FieldResult<Vec<Organization>> {
        let ok = ctx.validate_is_superuser().await;
        if !ok {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db.send(OrganizationList).await.map_err(|_| {
            FieldError::new(
                "Error getting orgs",
                graphql_value!({ "internal_error": "Error getting orgs" }),
            )
        })??;
        let orgs = result.into_iter().map(Organization::from).collect();
        Ok(orgs)
    }

    #[graphql(description = "Get an organization")]
    async fn get(ctx: &Context, id: Uuid) -> FieldResult<Organization> {
        let ok = ctx.validate_is_member(id).await;
        if !ok {
            return Err(FieldError::new(
                "Organization not found",
                graphql_value!({ "internal_error": "Not a member" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db.send(OrganizationGet { id }).await.map_err(|_| {
            FieldError::new(
                "Error getting orgs",
                graphql_value!({ "internal_error": "Error getting org" }),
            )
        })??;
        let org = result.into();
        Ok(org)
    }

    #[graphql(description = "Search for an organization")]
    async fn search(ctx: &Context, input: String) -> FieldResult<Vec<Organization>> {
        if !ctx.validate_is_superuser().await { return Err(FieldError::new( "Unauthorized", graphql_value!({ "internal_error": "Not an admin" }))); }
        let db = ctx.db.clone();
        let result = db.send(OrganizationSearch { input }).await??;
        let orgs = result.into_iter().map(Organization::from).collect();
        return Ok(orgs);
    }
}

pub struct OrgMutation;

impl OrgMutation {
    pub fn new() -> Self {
        Self
    }
}

#[juniper::graphql_object(Context = Context)]
impl OrgMutation {
    #[graphql(description = "Update a users membership")]
    async fn update_membership(
        ctx: &Context,
        id_org: Uuid,
        phone: Phone,
        flags: i32,
    ) -> FieldResult<Membership> {
        if !ctx.validate_is_admin(id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db
            .send(OrgMembershipUpdate {
                id_org,
                phone: phone.to_owned(),
                flags,
            })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error updating membership",
                    graphql_value!({ "internal_error": "Err updating membership" }),
                )
            })??;
        let membership: Membership = result.into();
        Ok(membership)
    }

    #[graphql(description = "Create an invitation to the organization")]
    async fn invite_create(ctx: &Context, id: Uuid, id_org: Uuid) -> FieldResult<Invite> {
        if !ctx.validate_is_admin(id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }

        let db = ctx.db.clone();
        let _result = db
            .send(OrgInviteCreate {
                id,
                id_org,
                phone: None,
                actor: ctx.phone(),
            })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error creating invite",
                    graphql_value!({ "internal_error": "Err creating invite" }),
                )
            })??;
        let invite: Invite = db.send(GetInvite { id }).await??.into();
        Ok(invite)
    }

    #[graphql(description = "Create an invitation to the organization")]
    async fn invite_revoke(ctx: &Context, id: Uuid) -> FieldResult<Invite> {
        let db = ctx.db.clone();

        let invite = db.send(GetInvite { id }).await??;

        if !ctx.validate_is_admin(invite.id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }
        
        let res = db.send(OrgInviteRevoke { id, actor: ctx.phone() }).await??.into();
        Ok(res)
    }


    #[graphql(description = "Update an organization")]
    async fn update(
        ctx: &Context,
        id_org: Uuid,
        form: FormOrganization,
    ) -> FieldResult<Organization> {
        if !ctx.validate_is_admin(id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }

        let db = ctx.db.clone();
        let _result_upsert = db
            .send(OrganizationUpdate { id: id_org, form })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error updating org",
                    graphql_value!({ "internal_error": "Error updating org" }),
                )
            })??;

        let result = db
            .send(OrganizationGet { id: id_org })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting org",
                    graphql_value!({ "internal_error": "Error getting org" }),
                )
            })??;
        let org = result.into();
        Ok(org)
    }

    #[graphql(description = "Update a location")]
    async fn update_location(
        ctx: &Context,
        id_org: Uuid,
        id_location: Uuid,
        form: FormLocation,
    ) -> FieldResult<OrgLocation> {
        if !ctx.validate_is_admin(id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }

        let db = ctx.db.clone();
        let _result_upsert = db
            .send(OrgLocationUpdate {
                id_org,
                id_location,
                form,
            })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error updating location",
                    graphql_value!({ "internal_error": "Error updating location" }),
                )
            })??;
        let result = db
            .send(OrgLocationGet { id: id_location })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting location",
                    graphql_value!({ "internal_error": "Error getting location" }),
                )
            })??;
        let location = result.into();
        Ok(location)
    }

    #[graphql(description = "Update a vehicle")]
    async fn update_vehicle(
        ctx: &Context,
        id_org: Uuid,
        id_vehicle: Uuid,
        form: FormVehicle,
    ) -> FieldResult<Vehicle> {
        if !ctx.validate_is_member(id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }

        let db = ctx.db.clone();
        let _result_upsert = db
            .send(VehicleUpdate {
                id_org,
                id_vehicle,
                form,
            })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error updating vehicle",
                    graphql_value!({ "internal_error": "Error updating vehicle" }),
                )
            })??;
        let result = db.send(VehicleGet { id: id_vehicle }).await.map_err(|_| {
            FieldError::new(
                "Error getting vehicle",
                graphql_value!({ "internal_error": "Error getting vehicle" }),
            )
        })??;
        let vehicle = result.into();
        Ok(vehicle)
    }

    #[graphql(description = "Update an event")]
    async fn update_event(
        ctx: &Context,
        id_org: Uuid,
        id_event: Uuid,
        form: FormEvent,
    ) -> FieldResult<Event> {
        if !ctx.validate_is_admin(id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }

        let db = ctx.db.clone();
        let event = DBEventInsertable {
            name: form.name.ok_or_else(|| ErrorMarket::BadValue(String::from("Please give the event a name")))?,
            bio: form.bio,
            image_url: form.image_url,
            time_start: form.time_start.expect("time_start is required"),
            time_end: form.time_end.expect("time_end is required"),
            reservations_start: form.reservations_start.expect("reservations_start is required"),
            reservations_end: form.reservations_end.expect("reservations_end is required"),
            id_location: form.id_location.expect("id_location is required"),
            id_org,
            obsolete_at: form.obsolete_at,
            published_at: form.published_at,
            id: id_event,
        };

        let _result_upsert = db.send(EventUpdate { event }).await??;
        let result = db.send(EventGet { id: id_event }).await.map_err(|_| {
            FieldError::new(
                "Error getting event",
                graphql_value!({ "internal_error": "Error getting event" }),
            )
        })??;
        let event = result.into();

        invalidate_frontend_cache(id_event).await;
        
        Ok(event)
    }

    #[graphql(description = "Update a event drivers from a list of phone numbers")]
    async fn update_event_drivers(ctx: &Context, id_event: Uuid, phones: Vec<Phone>) -> FieldResult<Vec<DBDriverInsertable>> {
        let db = ctx.db.clone();
        let event = db.send(EventGet { id: id_event }).await.map_err(|_| {
            FieldError::new(
                "Error updating event driver",
                graphql_value!({ "internal_error": "Event not found" }),
            )
        })??;
        if !ctx.validate_is_admin(event.id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }
        let drivers_res = db.send(EventDriversList { id_event }).await??;
        let drivers: Vec<Driver> = drivers_res.into_iter().map(Driver::from).collect();
        for event_driver in &drivers {
            if phones.contains(&event_driver.phone) { continue }
            let driver = ctx.market.driver.find(&id_event, &event_driver.phone).await;
            if let Ok(driver) = driver {
                if let Ok(is_empty) =  ctx.market.event.is_driver_empty(&id_event, &driver.id).await {
                    if !is_empty {
                        return Err(FieldError::new(
                            "Driver has reservations",
                            graphql_value!({ "internal_error": "The driver can not be removed because the have reservations in their queue." }),
                        ));
                    }
                }

                let _result = db
                    .send(EventDriverUpdate {
                        id_event,
                        phone: event_driver.phone.clone(),
                        form: FormEventDriver {
                            id_vehicle: driver.id_vehicle,
                            obsolete_at: Some(now()),
                        }
                    })
                    .await
                    .map_err(|_| {
                        FieldError::new(
                            "Error updating event driver",
                            graphql_value!({ "internal_error": "Error updating event driver" }),
                        )
                    })??;

                ctx.market.event.remove_driver(&id_event, &driver).await?;
            }
        }
        let mut results = Vec::new();
        for phone in phones {
            let result = db
                .send(EventDriverUpdate {
                    id_event,
                    phone: phone.clone(),
                    form: FormEventDriver {
                        id_vehicle: drivers.iter().find_map(|d| if d.phone.eq(&phone) { d.id_vehicle } else { None }),
                        obsolete_at: None,
                    }
                })
                .await
                .map_err(|_| {
                    FieldError::new(
                        "Error updating event driver",
                        graphql_value!({ "internal_error": "Error updating event driver" }),
                    )
                })??;
            results.push(result);
        }

        Ok(results)
    }

    #[graphql(description = "Update an event driver")]
    async fn update_event_driver(
        ctx: &Context,
        id_event: Uuid,
        phone: Phone,
        form: FormEventDriver,
    ) -> FieldResult<Driver> {
        let db = ctx.db.clone();
        let event = db.send(EventGet { id: id_event }).await.map_err(|_| {
            FieldError::new(
                "Error updating event driver",
                graphql_value!({ "internal_error": "Event not found" }),
            )
        })??;
        if !ctx.validate_is_member(event.id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an member" }),
            ));
        }

        if form.obsolete_at.is_some() {
            let driver = ctx.market.driver.find(&id_event, &phone).await;
            if let Ok(driver) = driver {
                if driver.obsolete_at.is_none() {
                    if let Ok(is_empty) =  ctx.market.event.is_driver_empty(&id_event, &driver.id).await {
                        if !is_empty {
                            return Err(FieldError::new(
                                "Driver has reservations",
                                graphql_value!({ "internal_error": "The driver can not be removed because the have reservations in their queue." }),
                            ));
                        }
                    }
                }
            }
        }

        let _result = db
            .send(EventDriverUpdate {
                id_event,
                phone: phone.clone(),
                form: form.clone(),
            })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error updating event driver",
                    graphql_value!({ "internal_error": "Error updating event driver" }),
                )
            })??;

        // ctx.market.kv_db_sync(&id_event).await?; // TODO: FIX ME

        let result = db
            .send(EventDriverFind { id_event, phone })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting event driver",
                    graphql_value!({ "internal_error": "Error getting event driver" }),
                )
            })??;

        let driver: Driver = result.into();

        if form.obsolete_at.is_some() {
            ctx.market.event.remove_driver(&id_event, &driver).await?;
        }

        Ok(driver)
    }

    #[graphql(description = "Update a user group")]
    async fn update_group(ctx: &Context, id_org: Uuid, id_group: Uuid, form: FormGroup) -> FieldResult<Group> {
        if !ctx.validate_is_admin(id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }
        let db = ctx.db.clone();
        let _result_upsert = db
            .send(OrgGroupUpdate {
                group: DBGroupInsertable {
                    id: id_group,
                    id_org,
                    label: form.label,
                    color: form.color,
                    created_by: ctx.phone().to_string(),
                    updated_by: Some(ctx.phone().to_string()),
                    created_at: now(),
                    updated_at: Some(now()),
                    removed_at: None,
                }
            }).await??;
        let result = db.send(OrgGroupGet { id: id_group }).await??;
        let group = result.into();
        Ok(group)
    }

    #[graphql(description = "Adds or removes a user from a group")]
    async fn update_group_member(ctx: &Context, id_group: Uuid, id_org: Uuid, phone: String, is_removed: bool) -> FieldResult<DBGroupMembershipInsertable> {
        if !ctx.validate_is_admin(id_org).await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not an admin" }),
            ));
        }
        let db = ctx.db.clone();
        let result = db.send(OrgGroupGet { id: id_group }).await??;
        if result.id_org.ne(&id_org) {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Group is not owned by this org" }),
            ));
        } 
        let result = db.send(OrgGroupMemberUpdate { membership: DBGroupMembershipInsertable {
            id_group,
            id_org,
            phone,
            created_by: ctx.phone().to_string(),
            created_at: now(),
            removed_at: if is_removed { Some(now()) } else { None },
            removed_by: if is_removed { Some(ctx.phone().to_string()) } else { None },
        }}).await??;
        Ok(result)
    }
 }

#[doc = "Tells the nextjs server to invalidate the cache for an event."]
async fn invalidate_frontend_cache(id: Uuid) {
    let client = reqwest::Client::new();
    let url = format!("http://localhost:3007/api/refresh_event"); // TODO: FIX ME

    match client
        .post(url)
        .json(&json!({ "id_event": id.to_string() }))
        .send()
        .await
    {
        Ok(_) => (),
        Err(err) => error!("Could not refresh event {}, got error: {}", id, err)
    };
}
