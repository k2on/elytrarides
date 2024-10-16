use actix::Message;
use uuid::Uuid;
use super::model::{DBCollege, FormCollege};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBCollege>>")]
pub struct CollegesList;


#[derive(Message)]
#[rtype(result = "QueryResult<DBCollege>")]
pub struct CollegeGet {
    pub id: Uuid,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBCollege>")]
pub struct CollegeUpdate {
    pub id: Uuid,
    pub form: FormCollege,
}


