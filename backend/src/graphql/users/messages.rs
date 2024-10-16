use actix::Message;
use crate::types::phone::Phone;

use super::{model::DBUser, FormUserInsert};
use diesel::QueryResult;

#[derive(Message)]
#[rtype(result = "QueryResult<Vec<DBUser>>")]
pub struct UserList;

#[derive(Message)]
#[rtype(result = "QueryResult<DBUser>")]
pub struct UserGet {
    pub phone: Phone,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBUser>")]
pub struct UserUpdate {
    pub phone: Phone,
    pub form: FormUserInsert,
}

#[derive(Message)]
#[rtype(result = "QueryResult<usize>")]
pub struct UserDelete {
    pub phone: Phone,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBUser>")]
pub struct UserSMSOpt {
    pub phone: Phone,
    pub opt_in: bool
}
