use juniper::{FieldResult, FieldError, graphql_value};
use uuid::Uuid;

use crate::{graphql::{context::Context, orgs::{model::Organization, messages::OrganizationGet}}};

use super::OrgLocation;

#[juniper::graphql_object(Context = Context)]
impl OrgLocation {
    fn id(&self) -> Uuid {
        self.id
    }

    fn label(&self) -> &str {
        &self.label
    }

    fn location_lat(&self) -> f64 {
        self.location_lat
    }

    fn location_lng(&self) -> f64 {
        self.location_lng
    }

    fn image_url(&self) -> &str {
        &self.image_url
    }

    async fn org(&self, ctx: &Context) -> FieldResult<Organization> {
        let db = ctx.db.clone();
        let result = db.send(OrganizationGet { id: self.id_org }).await
            .map_err(|_| FieldError::new("Error getting org", graphql_value!({ "internal_error": "Err getting org" })))??;
        let org: Organization = result.into();
        Ok(org)
    }
}

