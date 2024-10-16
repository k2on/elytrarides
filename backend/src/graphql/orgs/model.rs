use diesel::{Queryable, Insertable, AsChangeset};
use juniper::GraphQLInputObject;
use serde::Serialize;
use uuid::Uuid;
use crate::schema::orgs;

use crate::graphql::memberships::model::Membership;

#[derive(Debug, Serialize, Queryable, AsChangeset, Insertable)]
#[diesel(table_name=orgs)]
pub struct DBOrganization {
    pub label: String,
    pub bio: Option<String>,
    pub logo_url: Option<String>,
    pub banner_url: Option<String>,
    pub id: Uuid,
    pub college: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct Organization {
    pub label: String,
    pub bio: Option<String>,
    pub logo_url: Option<String>,
    pub banner_url: Option<String>,
    pub memberships: Vec<Membership>,
    pub id: Uuid,
    pub id_college: Option<Uuid>,
}

impl From<DBOrganization> for Organization {
    fn from(db_org: DBOrganization) -> Self {
        Self {
            id: db_org.id,
            label: db_org.label,
            bio: db_org.bio,
            logo_url: db_org.logo_url,
            banner_url: db_org.banner_url,
            memberships: vec![],
            id_college: db_org.college,
        }
    }
}

#[derive(Serialize, Insertable, GraphQLInputObject, AsChangeset)]
#[diesel(table_name=orgs)]
pub struct FormOrganization {
    pub label: String,
    pub bio: Option<String>,
    pub logo_url: Option<String>,
    pub banner_url: Option<String>,
    pub college: Option<Uuid>,
}
