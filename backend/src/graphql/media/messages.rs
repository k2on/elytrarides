use actix::Message;
use uuid::Uuid;
use diesel::QueryResult;
use crate::types::phone::Phone;

use super::model::DBMedia;

#[derive(Message)]
#[rtype(result = "QueryResult<DBMedia>")]
pub struct MediaUpdate {
    pub id: Uuid,
    pub uploader: Phone,
    pub id_org: Option<Uuid>,
    pub media_type: String,
    pub url: String,
}

#[derive(Message)]
#[rtype(result = "QueryResult<DBMedia>")]
pub struct MediaGet {
    pub id: Uuid,
}


