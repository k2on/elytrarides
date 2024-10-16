use crate::market::util::now;
use crate::schema::users::dsl::*;
use actix::Handler;
use diesel;
use diesel::prelude::*;
use diesel::upsert::excluded;
use diesel::{QueryDsl, QueryResult};

use crate::db_util::DBActor;

use super::{DBUser, DBUserInsertable};
use super::messages::{UserUpdate, UserList, UserGet, UserDelete, UserSMSOpt};

impl Handler<UserList> for DBActor {
    type Result = QueryResult<Vec<DBUser>>;

    fn handle(&mut self, _msg: UserList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        users.load::<DBUser>(&mut conn)
    }
}

impl Handler<UserGet> for DBActor {
    type Result = QueryResult<DBUser>;

    fn handle(&mut self, msg: UserGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        users
            .find(msg.phone.to_string())
            .get_result::<DBUser>(&mut conn)
    }
}

impl Handler<UserUpdate> for DBActor {
    type Result = QueryResult<DBUser>;

    fn handle(&mut self, msg: UserUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        let user = DBUserInsertable {
            phone: msg.phone.to_string(),
            name: msg.form.name,
            image_url: msg.form.profile_image,
            created_at: now(),
            updated_at: now(),
        };

        diesel::insert_into(users)
            .values(&user.clone())
            .on_conflict(phone)
            .do_update()
            .set((
                name.eq(excluded(name)),
                image_url.eq(excluded(image_url)),
                updated_at.eq(now()),
            ))
            .returning((phone, name, image_url, created_at, updated_at, is_opted_in_sms))
            .get_result::<DBUser>(&mut conn)
    }
}

impl Handler<UserDelete> for DBActor {
    type Result = QueryResult<usize>;

    fn handle(&mut self, msg: UserDelete, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        diesel::delete(users)
            .filter(phone.eq(msg.phone))
            .execute(&mut conn)
    }
}

impl Handler<UserSMSOpt> for DBActor {
    type Result = QueryResult<DBUser>;

    fn handle(&mut self, msg: UserSMSOpt, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        diesel::update(users)
            .set((
                is_opted_in_sms.eq(msg.opt_in),
                updated_at.eq(now())
            ))
            .filter(phone.eq(msg.phone))
            .returning((phone, name, image_url, created_at, updated_at, is_opted_in_sms))
            .get_result::<DBUser>(&mut conn)
    }
}
