use actix::Handler;
use diesel::QueryResult;
use diesel::prelude::*;
use diesel::update;
// use uuid::Uuid;

use crate::market::util::now;
use crate::db_util::DBActor;
use crate::schema::user_groups::dsl::*;
use crate::schema::user_group_memberships::dsl as user_group_memberships;

use super::messages::OrgGroupGet;
use super::messages::OrgUserGroupMembershipsList;
use super::messages::{OrgGroupList, OrgGroupUpdate, OrgGroupMemberUpdate};
use super::model::DBGroup;
use super::model::DBGroupInsertable;
use super::model::DBGroupMembership;
use super::model::DBGroupMembershipInsertable;


impl Handler<OrgGroupList> for DBActor {
    type Result = QueryResult<Vec<DBGroup>>;
    
    fn handle(&mut self, msg: OrgGroupList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        user_groups
            .filter(removed_at.is_null())
            .filter(id_org.eq(msg.id_org))
            .get_results::<DBGroup>(&mut conn)
    }
}

impl Handler<OrgGroupGet> for DBActor {
    type Result = QueryResult<DBGroup>;
    
    fn handle(&mut self, msg: OrgGroupGet, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        user_groups
            .filter(id.eq(msg.id))
            .get_result::<DBGroup>(&mut conn)
    }
}


impl Handler<OrgGroupUpdate> for DBActor {
    type Result = QueryResult<DBGroupInsertable>;
    
    fn handle(&mut self, msg: OrgGroupUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        diesel::insert_into(user_groups)
            .values(&msg.group.clone())
            .on_conflict(id)
            .do_update()
            .set((
                label.eq(&msg.group.label),
                color.eq(&msg.group.color),
                updated_by.eq(&msg.group.updated_by),
                updated_at.eq(&msg.group.updated_at),
            ))
            .execute(&mut conn)?;
        Ok(msg.group)
    }
}

impl Handler<OrgGroupMemberUpdate> for DBActor {
    type Result = QueryResult<DBGroupMembershipInsertable>;
    
    fn handle(&mut self, msg: OrgGroupMemberUpdate, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");

        let stmt = diesel::insert_into(user_group_memberships::user_group_memberships)
            .values((
                user_group_memberships::id_group.eq(&msg.membership.id_group),
                user_group_memberships::id_org.eq(&msg.membership.id_org),
                user_group_memberships::phone.eq(&msg.membership.phone),
                user_group_memberships::created_by.eq(&msg.membership.created_by),
                user_group_memberships::created_at.eq(&msg.membership.created_at),
                user_group_memberships::removed_at.eq(&msg.membership.removed_at),
                user_group_memberships::removed_by.eq(&msg.membership.removed_by),
            ))
            .on_conflict((user_group_memberships::id_group, user_group_memberships::phone))
            .do_update()
            // Specify the fields to update manually
            .set((
                user_group_memberships::id_org.eq(&msg.membership.id_org),
                user_group_memberships::phone.eq(&msg.membership.phone),
                user_group_memberships::created_by.eq(&msg.membership.created_by),
                user_group_memberships::created_at.eq(&msg.membership.created_at),
                user_group_memberships::removed_at.eq(&msg.membership.removed_at),
                user_group_memberships::removed_by.eq(&msg.membership.removed_by),
            ));

        // Execute the statement
        stmt.execute(&mut conn)?;
        Ok(msg.membership)
    }
}

impl Handler<OrgUserGroupMembershipsList> for DBActor {
    type Result = QueryResult<Vec<DBGroupMembership>>;
    
    fn handle(&mut self, msg: OrgUserGroupMembershipsList, _ctx: &mut Self::Context) -> Self::Result {
        let mut conn = self.0.get().expect("Could not get DB connection from pool");
        user_group_memberships::user_group_memberships
            .filter(user_group_memberships::removed_at.is_null())
            .filter(user_group_memberships::id_org.eq(msg.id_org))
            .filter(user_group_memberships::phone.eq(msg.phone))
            .get_results::<DBGroupMembership>(&mut conn)
    }
}


