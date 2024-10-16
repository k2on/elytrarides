use juniper::{FieldResult, FieldError, graphql_value};
use uuid::Uuid;

use crate::graphql::{context::Context, orgs::{model::Organization, messages::OrganizationListAtCollege}};

use super::{model::{College, FormCollege}, messages::{CollegesList, CollegeUpdate}};


#[juniper::graphql_object(Context = Context)]
impl College {
    fn id(&self) -> &Uuid { &self.id }
    fn name(&self) -> &String { &self.name }
    fn logo_url(&self) -> &String { &self.logo_url }
    fn location_lat(&self) -> &f64 { &self.location_lat }
    fn location_lng(&self) -> &f64 { &self.location_lng }
    fn created_at(&self) -> &i32 { &self.created_at }
    fn removed_at(&self) -> &Option<i32> { &self.removed_at }

    async fn orgs(&self, ctx: &Context) -> FieldResult<Vec<Organization>> {
        if !ctx.validate_is_superuser().await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not a superuser" }),
            ));
        }
        let result = ctx.db.send(OrganizationListAtCollege { id: self.id }).await??;
        let orgs = result.into_iter().map(Organization::from).collect();
        Ok(orgs)
    }
}


pub struct CollegeQuery;

impl CollegeQuery {
    pub fn new() -> Self {
        Self
    }
}


#[juniper::graphql_object(Context = Context)]
impl CollegeQuery {
    #[graphql(description = "List all colleges")]
    async fn all(ctx: &Context) -> FieldResult<Vec<College>> {
        if !ctx.validate_is_superuser().await { return Err(FieldError::new( "Unauthorized", graphql_value!({ "internal_error": "Not authorized" }))); }
        let db = ctx.db.clone();
        let result = db.send(CollegesList).await??;
        let colleges = result.into_iter().map(College::from).collect();
        Ok(colleges)
    }
}

pub struct CollegeMutation;

impl CollegeMutation {
    pub fn new() -> Self {
        Self
    }
}

#[juniper::graphql_object(Context = Context)]
impl CollegeMutation {
    #[graphql(description = "Update a college")]
    async fn update(ctx: &Context, form: FormCollege) -> FieldResult<College> {
        if !ctx.validate_is_superuser().await { return Err(FieldError::new( "Unauthorized", graphql_value!({ "internal_error": "Not authorized" }))); }
        let db = ctx.db.clone();
        let college: College = db.send(CollegeUpdate { id: form.id, form }).await??.into();
        Ok(college)
    }
}
