use std::collections::HashMap;

use actix::{Actor, Addr, SyncContext};
use diesel::{
    r2d2::{ConnectionManager, Pool},
    PgConnection,
};

use google_maps::prelude::GoogleMapsClient;

use crate::sms::ClientTwilio;
use crate::graphql::Schema;

pub struct AppState {
    pub schema: Schema,
    pub db: Addr<DBActor>,
    pub twilio: ClientTwilio,
    pub jwt_secret: String,
    pub google_maps_client: GoogleMapsClient,
    pub kv: kv::Store,
    pub is_mock: bool,
}

type DBManager = ConnectionManager<PgConnection>;
type DBPool = Pool<DBManager>;
pub struct DBActor(pub DBPool);

impl Actor for DBActor {
    type Context = SyncContext<Self>;
}

pub fn get_pool(db_url: &str) -> DBPool {
    let manager: DBManager = ConnectionManager::<PgConnection>::new(db_url);
    Pool::builder()
        .build(manager)
        .expect("error building conn pool")
}


type IdEventDriver = i32;
pub type DriverTimes = HashMap<IdEventDriver, i32>;

