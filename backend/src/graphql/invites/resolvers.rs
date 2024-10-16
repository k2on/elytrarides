use juniper::{FieldResult, FieldError, graphql_value};
use uuid::Uuid;

use crate::graphql::{context::Context, invites::model::Invite, orgs::{model::Organization, messages::OrganizationGet}, users::User, memberships::messages::OrgMembershipUpdate};

use super::messages::GetInvite;

pub struct InviteQuery;

impl InviteQuery {
    pub fn new() -> Self {
        Self
    }
}

#[juniper::graphql_object(Context = Context)]
impl InviteQuery {
    #[graphql(description = "Get an invite")]
    async fn get(ctx: &Context, id: Uuid) -> FieldResult<Invite> {
        let db = ctx.db.clone();
        let result = db.send(GetInvite { id }).await.map_err(|_| {
            FieldError::new(
                "Error getting invite",
                graphql_value!({ "internal_error": "Error getting invite" }),
            )
        })??;
        let org = result.into();
        Ok(org)
    }
}

pub struct InviteMutation;

impl InviteMutation {
    pub fn new() -> Self {
        Self
    }
}

#[juniper::graphql_object(Context = Context)]
impl InviteMutation {
    #[graphql(description = "Update a users membership")]
    async fn accept(
        ctx: &Context,
        id: Uuid
    ) -> FieldResult<Invite> {
        let ok = ctx.validate_is_authed().await;
        if !ok {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }
        let db = ctx.db.clone();

        let invite: Invite = db.send(GetInvite { id }).await??.into();
        if invite.revoked_at.is_some() {
            return Err(FieldError::new(
                "The invite is no longer valid",
                graphql_value!({ "internal_error": "Invite revoked" }),
            ));
        }

        db.send(OrgMembershipUpdate {
            id_org: invite.id_org,
            phone: ctx.phone(),
            flags: 1,
        }).await.map_err(|_| {
            FieldError::new(
                "Error getting invite",
                graphql_value!({ "internal_error": "Error getting invite" }),
            )
        })??;

        Ok(invite)
    }
}

#[juniper::graphql_object(Context = Context)]
impl Invite {
    fn id(&self) -> Uuid {
        self.id
    }

    fn created_at(&self) -> i32 {
        self.created_at
    }

    fn is_valid(&self) -> bool {
        self.revoked_at.is_none()
    }

    async fn org(&self, ctx: &Context) -> FieldResult<Option<Organization>> {
        if self.revoked_at.is_some() { return Ok(None) }
        let db = ctx.db.clone();
        let result = db.send(OrganizationGet { id: self.id_org }).await
            .map_err(|_| FieldError::new("Error getting org", graphql_value!({ "internal_error": "Err getting org" })))??;
        let org: Organization = result.into();
        Ok(Some(org))
    }

    async fn user(&self, _ctx: &Context) -> FieldResult<Option<User>> {
        Ok(None)
    }
}

