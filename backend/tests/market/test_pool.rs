use std::{str::FromStr, time::Duration, thread};

use backend::{graphql::reservations::{FormReservation, stops::model::FormReservationStop, messages::{ReservationGetByReserver, ReservationGet}}, types::phone::Phone, market::geocoder::mock_location};
use uuid::Uuid;

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_works() {
    let id_event = common::get_id_event();

    let market = common::setup();
    let res = market.db.send(ReservationGet { id: Uuid::from_str("a893f842-535f-4c2e-9b73-964f4434263d").unwrap() }).await.unwrap().unwrap();
    // let pool = market.event.get_pool(&id_event).await.unwrap();
    println!("{:#?}", res);
    assert!(false);
}
