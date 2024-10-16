use actix::Handler;
use diesel::QueryResult;
use diesel::prelude::*;

use crate::db_util::DBActor;
use crate::schema::event_drivers::dsl::*;
use crate::schema::events::dsl as events;

use super::messages::EventDriverFind;
use super::messages::EventDriverGet;
use super::messages::EventDriverRecentForUser;
use super::messages::EventDriverTotalForUser;
use super::model::{DBDriver, DBDriverInsertable};
use super::messages::{EventDriversList, DriverEventsList, EventDriverUpdate};

impl Handler<EventDriversList> for DBActor {
    type Result = QueryResult<Vec<DBDriver>>;
    
    fn handle(&mut self, msg: EventDriversList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        event_drivers
            .filter(obsolete_at.is_null())
            .filter(id_event.eq(msg.id_event))
            .get_results::<DBDriver>(&mut conn)
    }
}

impl Handler<DriverEventsList> for DBActor {
    type Result = QueryResult<Vec<DBDriver>>;
    
    fn handle(&mut self, msg: DriverEventsList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        event_drivers
            .filter(obsolete_at.is_null())
            .filter(phone.eq(msg.phone))
            .get_results::<DBDriver>(&mut conn)
    }
}

impl Handler<EventDriverGet> for DBActor {
    type Result = QueryResult<DBDriver>;
    
    fn handle(&mut self, msg: EventDriverGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        event_drivers
            .filter(id.eq(msg.id))
            .first::<DBDriver>(&mut conn)
    }
}

impl Handler<EventDriverFind> for DBActor {
    type Result = QueryResult<DBDriver>;
    
    fn handle(&mut self, msg: EventDriverFind, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        event_drivers
            // .filter(obsolete_at.is_null())
            .filter(phone.eq(msg.phone))
            .filter(id_event.eq(msg.id_event))
            .first::<DBDriver>(&mut conn)
    }
}

impl Handler<EventDriverUpdate> for DBActor {
    type Result = QueryResult<DBDriverInsertable>;
    
    fn handle(&mut self, msg: EventDriverUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        let driver = DBDriverInsertable {
            phone: msg.phone.to_string(),
            id_event: msg.id_event,
            id_vehicle: msg.form.id_vehicle,
            obsolete_at: msg.form.obsolete_at,
        };

        diesel::insert_into(event_drivers)
            .values(&driver)
            .on_conflict((phone, id_event))
            .do_update()
            .set((id_vehicle.eq(msg.form.id_vehicle), obsolete_at.eq(msg.form.obsolete_at)))
            .execute(&mut conn)?;

        Ok(driver)
    }
}

impl Handler<EventDriverRecentForUser> for DBActor {
    type Result = QueryResult<DBDriver>;
    
    fn handle(&mut self, msg: EventDriverRecentForUser, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        event_drivers
            .filter(obsolete_at.is_null())
            .inner_join(events::events.on(id_event.eq(events::id)))
            .filter(events::id_org.eq(msg.id_org))
            .filter(phone.eq(msg.phone))
            .order(events::time_start.desc())
            .select(event_drivers::all_columns())
            .first::<DBDriver>(&mut conn)
    }
}

impl Handler<EventDriverTotalForUser> for DBActor {
    type Result = QueryResult<i64>;
    
    fn handle(&mut self, msg: EventDriverTotalForUser, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        event_drivers
            .filter(obsolete_at.is_null())
            .filter(phone.eq(msg.phone))
            .inner_join(events::events.on(id_event.eq(events::id)))
            .filter(events::id_org.eq(msg.id_org))
            .count()
            .get_result(&mut conn)
    }
}
