use juniper::{FieldResult, FieldError, graphql_value};

use crate::graphql::context::Context;

use super::{model::{GroupMembership, Group}, messages::OrgGroupGet};


#[juniper::graphql_object(Context = Context)]
impl GroupMembership {
    async fn group(&self, ctx: &Context) -> FieldResult<Group> {
        let db = ctx.db.clone();
        let result = db.send(OrgGroupGet { id: self.id_group }).await
            .map_err(|_| FieldError::new("Error getting org", graphql_value!({ "internal_error": "Err getting org" })))??;
        let group = result.into();
        Ok(group)
    }
}


pub struct GroupsQuery;

impl GroupsQuery {
    pub fn new() -> Self {
        Self
    }
}

pub struct GroupsMutation;

impl GroupsMutation {
    pub fn new() -> Self {
        Self
    }
}

