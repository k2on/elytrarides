use actix::Handler;
use diesel::QueryResult;

use crate::{db_util::DBActor, market::util::now};
use crate::schema::media::dsl::*;
use diesel::prelude::*;

use super::messages::MediaGet;
use super::{messages::MediaUpdate, model::DBMedia};

impl Handler<MediaUpdate> for DBActor {
    type Result = QueryResult<DBMedia>;

    fn handle(&mut self, msg: MediaUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        let item = DBMedia {
            id: msg.id,
            uploader: msg.uploader.to_string(),
            id_org: msg.id_org,
            media_type: msg.media_type,
            url: msg.url,
            created_at: now(),
            removed_at: None,
        };

        diesel::insert_into(media)
            .values(&item)
            .on_conflict(id)
            .do_update()
            .set(&item)
            .returning((id, uploader, id_org, media_type, url, created_at, removed_at))
            .get_result::<DBMedia>(&mut conn)
    }
}


impl Handler<MediaGet> for DBActor {
    type Result = QueryResult<DBMedia>;

    fn handle(&mut self, msg: MediaGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        media
            .find(msg.id)
            .get_result::<DBMedia>(&mut conn)
    }
}


