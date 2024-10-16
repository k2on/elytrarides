use actix::Message;
use uuid::Uuid;
use crate::graphql::colleges::model::DBCollege;

use super::model::{DBOrganization, FormOrganization};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBOrganization>>")]
pub struct OrganizationList;


#[derive(Message)]
#[rtype(result = "QueryResult<DBOrganization>")]
pub struct OrganizationGet {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBOrganization>")]
pub struct OrganizationUpdate {
    pub id: Uuid,
    pub form: FormOrganization,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Option<DBCollege>>")]
pub struct OrganizationCollegeGet {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBOrganization>>")]
pub struct OrganizationListAtCollege {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBOrganization>>")]
pub struct OrganizationSearch {
    pub input: String,
}
