use std::collections::{HashMap, HashSet};

use crate::{graphql::{
    context::Context,
    memberships::{messages::UserMemberships, model::Membership}, geo::model::SearchResult, reservations::{messages::ReservationsListByReserver, stops::model::ReservationStop, Reservation}, media::messages::MediaGet,
}, types::phone::Phone};

use super::{
    messages::{UserGet, UserList, UserUpdate, UserDelete, UserSMSOpt},
    model::User,
    FormUser, FormUserInsert,
};
use juniper::{graphql_value, FieldError, FieldResult};

pub struct UserQuery;

impl UserQuery {
    pub fn new() -> Self {
        Self
    }
}

#[juniper::graphql_object(Context = Context)]
impl User {
    fn phone(&self) -> &Phone {
        &self.phone
    }

    fn name(&self) -> &str {
        &self.name
    }

    fn image_url(&self) -> &Option<String> {
        &self.image_url
    }

    fn is_opted_in_sms(&self) -> &Option<bool> {
        &self.is_opted_in_sms
    }

    async fn memberships(&self, ctx: &Context) -> FieldResult<Vec<Membership>> {
        let is_authed = ctx.validate_is_authed().await;
        if !is_authed {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        if ctx.phone().ne(&self.phone) {
            let ok = ctx.validate_is_superuser().await;
            if !ok {
                return Err(FieldError::new(
                    "Unauthorized",
                    graphql_value!({ "internal_error": "Not authorized" }),
                ));
            }
        }

        let db = ctx.db.clone();
        let result = db
            .send(UserMemberships {
                phone: self.phone.clone(),
            })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error getting memberships",
                    graphql_value!({ "internal_error": "Error getting memberships" }),
                )
            })??;
        let memberships = result.into_iter().map(Membership::from).collect();
        Ok(memberships)
    }

    async fn common_stops(&self, ctx: &Context) -> FieldResult<Vec<SearchResult>> {
        let is_authed = ctx.validate_is_authed().await;
        if !is_authed {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }
        if ctx.phone().ne(&self.phone) {
            let ok = ctx.validate_is_superuser().await;
            if !ok {
                return Err(FieldError::new(
                    "Unauthorized",
                    graphql_value!({ "internal_error": "Not authorized" }),
                ));
            }
        }

        let db = ctx.db.clone();
        let reservations: Vec<Reservation> = db.send(ReservationsListByReserver { phone: self.phone.clone() }).await??.into_iter().map(Reservation::from).collect();

        let mut stops: Vec<ReservationStop> = reservations.iter()
            .flat_map(|res| res.stops.get_stops()
                      .iter()
                      .filter(|stop| !stop.place_id.is_empty()).cloned())
            .collect();
        let common = stops.iter()
            .fold(HashMap::new(), |mut acc, stop| {
                *acc.entry(stop.place_id.clone()).or_insert(0) += 1;
                acc
            });
        let mut seen = HashSet::new();
        stops = stops.into_iter()
            .filter(|stop| seen.insert(stop.place_id.clone()))
            .collect();

        stops.sort_unstable_by(|a, b| {
            let freq_a = common.get(&a.place_id).unwrap_or(&0);
            let freq_b = common.get(&b.place_id).unwrap_or(&0);
            freq_b.cmp(freq_a).then_with(|| a.place_id.cmp(&b.place_id))
        });

        stops.truncate(5);

        let locations = stops.iter().map(|stop| SearchResult {
            main: stop.address.main.clone(),
            sub: stop.address.sub.clone(),
            place_id: stop.place_id.clone(),
        }).collect();

        Ok(locations)
    }
}

#[juniper::graphql_object(Context = Context)]
impl UserQuery {
    #[graphql(description = "List of all users")]
    async fn all(ctx: &Context) -> FieldResult<Vec<User>> {
        let ok = ctx.validate_is_superuser().await;
        if !ok {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        let db = ctx.db.clone();
        let result = db.send(UserList).await.map_err(|_| {
            FieldError::new(
                "Error getting users",
                graphql_value!({ "internal_error": "Error getting users" }),
            )
        })??;
        let users = result.into_iter().map(User::from).collect();
        Ok(users)
    }

    #[graphql(description = "Get the logged in user")]
    async fn me(ctx: &Context) -> FieldResult<User> {
        let ok = ctx.validate_is_authed().await;
        if !ok {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        let db = ctx.db.clone();
        let phone = ctx.phone();
        match db
            .send(UserGet {
                phone: phone.clone(),
            })
            .await
        {
            Ok(Ok(result)) => Ok(result.into()),
            _ => Ok(User::anonymous(&phone)),
        }
    }
}

pub struct UserMutation;

impl UserMutation {
    pub fn new() -> Self {
        Self
    }
}

#[juniper::graphql_object(Context = Context)]
impl UserMutation {
    #[graphql(description = "Update the logged in user data")]
    async fn me_update(ctx: &Context, form: FormUser) -> FieldResult<User> {
        let ok = ctx.validate_is_authed().await;
        if !ok {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        let db = ctx.db.clone();

        let image_url = if let Some(id) = form.profile_image {
            let result = db.send(MediaGet { id }).await.map_err(|_| {
                FieldError::new(
                    "Error updating user",
                    graphql_value!({ "internal_error": "Error updating user" }),
                )
            })??;
            Some(result.url)
        } else { None };

        let result = db
            .send(UserUpdate {
                phone: ctx.phone(),
                form: FormUserInsert {
                    name: form.name,
                    profile_image: image_url,
                },
            })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error updating user",
                    graphql_value!({ "internal_error": "Error updating user" }),
                )
            })??;
        let user = result.into();
        Ok(user)
    }


    #[graphql(description = "Update the logged in user data")]
    async fn delete_account(ctx: &Context) -> FieldResult<bool> {
        let ok = ctx.validate_is_authed().await;
        if !ok {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        let db = ctx.db.clone();
        db
            .send(UserDelete {
                phone: ctx.phone(),
            })
            .await
            .map_err(|_| {
                FieldError::new(
                    "Error updating user",
                    graphql_value!({ "internal_error": "Error updating user" }),
                )
            })??;

        Ok(true)
    }

    #[graphql(description = "Opt in or out of SMS notifications")]
    async fn me_sms_opt(ctx: &Context, opt_in: bool) -> FieldResult<User> {
        let ok = ctx.validate_is_authed().await;
        if !ok {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        let db = ctx.db.clone();
        let result: User = db.send(UserSMSOpt { phone: ctx.phone(), opt_in }).await??.into();
        Ok(result)
    }

}
