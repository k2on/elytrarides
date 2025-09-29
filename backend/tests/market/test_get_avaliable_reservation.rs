use std::str::FromStr;

use nujade_backend::{graphql::reservations::FormReservation, types::phone::Phone, market::geocoder::mock_location};
use uuid::Uuid;

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_get_avaliable_reservation() {
    let market = common::setup();
    common::init(&market).await;

    let id_event = common::get_id_event();
    let driver_phone = common::get_driver_phone();

    let driver_res = market.driver.find(&id_event, &driver_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver. Got error: `{:?}`", driver_res);

    let driver = driver_res.unwrap();

    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok());

    let rider_phone = Phone::new("+18002000002").expect("Invalid phone number");


    let avaliable_res = market.event.get_avaliable_reservation(&id_event, &driver.id).await;
    assert!(avaliable_res.is_ok());
    let avaliable = avaliable_res.unwrap();

    assert!(avaliable.is_none());

    let id_reservation = Uuid::from_str("15b78e38-3f11-4d47-b9f6-8109faa5ed16").expect("Invalid uuid");

    let form = FormReservation {
        passenger_count: 2,
        is_dropoff: false,
        stops: vec![
            mock_location::BENET_HALL.stop()
        ]
    };

    let res_reservation = market.reservation.create(&rider_phone, &id_reservation, &id_event, form).await;
    assert!(res_reservation.is_ok(), "Could not reserve, got error: {:?}", res_reservation);

    let strat_new_res = market.event.get_estimates(&id_event).await;
    assert!(strat_new_res.is_ok(), "Stratgy is not ok, Get error: `{:?}`", strat_new_res);

    let strat_new = strat_new_res.unwrap();

    let driver_strat = strat_new.drivers.get(&driver.id).unwrap();
    assert!(driver_strat.dest.is_none());
    assert!(driver_strat.queue.is_empty());
    assert!(driver_strat.picked_up.is_empty());

    let avaliable_res = market.event.get_avaliable_reservation(&id_event, &driver.id).await;
    assert!(avaliable_res.is_ok());
    let avaliable = avaliable_res.unwrap();

    assert!(avaliable.is_some());
    let res = avaliable.unwrap();

    assert_eq!(res.id, id_reservation);
}
