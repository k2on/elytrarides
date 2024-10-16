use juniper::{FieldResult, FieldError, graphql_value};

use crate::graphql::{context::Context, memberships::model::Membership, orgs::{model::Organization, messages::OrganizationGet}, users::User, groups::{model::GroupMembership, messages::OrgUserGroupMembershipsList}, drivers::{Driver, messages::{EventDriverRecentForUser, EventDriverTotalForUser}}};

#[juniper::graphql_object(Context = Context)]
impl Membership {
    fn is_member(&self) -> bool {
        self.is_member
    }

    fn is_admin(&self) -> bool {
        self.is_admin
    }

    fn is_driver(&self) -> bool {
        self.is_driver
    }

    fn is_new_member(&self) -> bool {
        self.is_new_member
    }

    async fn org(&self, ctx: &Context) -> FieldResult<Organization> {
        let db = ctx.db.clone();
        let result = db.send(OrganizationGet { id: self.id_org }).await
            .map_err(|_| FieldError::new("Error getting org", graphql_value!({ "internal_error": "Err getting org" })))??;
        let org: Organization = result.into();
        Ok(org)
    }

    async fn user(&self, ctx: &Context) -> FieldResult<User> {
        Ok(ctx.user_get(&self.phone).await)
    }
    
    async fn groups(&self, ctx: &Context) -> FieldResult<Vec<GroupMembership>> {
        let db = ctx.db.clone();
        let result = db.send(OrgUserGroupMembershipsList { id_org: self.id_org, phone: self.phone.clone() }).await
            .map_err(|_| FieldError::new("Error getting org", graphql_value!({ "internal_error": "Err getting org" })))??;
        let memberships = result.into_iter().map(GroupMembership::from).collect();
        Ok(memberships)
    }

    async fn recent_drive(&self, ctx: &Context) -> FieldResult<Option<Driver>> {
        let db = ctx.db.clone();
        match db.send(EventDriverRecentForUser { phone: self.phone.clone(), id_org: self.id_org }).await {
            Ok(Ok(result)) => Ok(Some(result.into())),
            _ => Ok(None)
        }
    }

    async fn total_drives(&self, ctx: &Context) -> FieldResult<i32> {
        let db = ctx.db.clone();
        let total = db.send(EventDriverTotalForUser { phone: self.phone.clone(), id_org: self.id_org }).await?? as i32;
        Ok(total)
    }
}

