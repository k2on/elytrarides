use actix::Handler;
use diesel::QueryResult;
use diesel::prelude::*;

use crate::db_util::DBActor;
use crate::graphql::locations::DBLocation;
use crate::market::util::now;
use crate::schema::events::dsl::*;
use crate::schema::locations::dsl as locations;

use super::DBEvent;
use super::DBEventInsertable;
use super::messages::EventLocationGet;
use super::messages::GetActiveEvents;
use super::messages::{EventsList, EventUpdate, EventGet};



impl Handler<EventsList> for DBActor {
    type Result = QueryResult<Vec<DBEvent>>;

    fn handle(&mut self, msg: EventsList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        events
            .filter(id_org.eq(msg.id_org))
            .filter(obsolete_at.is_null())
            .get_results::<DBEvent>(&mut conn)
    }
}

impl Handler<EventGet> for DBActor {
    type Result = QueryResult<DBEvent>;

    fn handle(&mut self, msg: EventGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        events.find(msg.id).first(&mut conn)
    }
}


impl Handler<EventLocationGet> for DBActor {
    type Result = QueryResult<Option<DBLocation>>;

    fn handle(&mut self, msg: EventLocationGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        let event: DBEvent = events.find(msg.id).first::<DBEvent>(&mut conn).unwrap();
        if let Some(location_id) = event.id_location {
            let location = locations::locations.find(location_id).first::<DBLocation>(&mut conn).unwrap();
            Ok(Some(location))
        } else {
            Ok(None)
        }
    }
}

impl Handler<EventUpdate> for DBActor {
    type Result = QueryResult<DBEventInsertable>;

    fn handle(&mut self, msg: EventUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        let event = msg.event;

        diesel::insert_into(events)
            .values(&event)
            .on_conflict(id)
            .do_update()
            .set(&event)
            .execute(&mut conn)?;
        Ok(event)
    }
}

impl Handler<GetActiveEvents> for DBActor {
    type Result = QueryResult<Vec<DBEvent>>;

    fn handle(&mut self, _msg: GetActiveEvents, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        let now = now();

        events
            .filter(time_start.le(now))
            .filter(time_end.gt(now))
            .filter(obsolete_at.is_null())
            .filter(published_at.is_not_null())
            .get_results::<DBEvent>(&mut conn)
    }
}


