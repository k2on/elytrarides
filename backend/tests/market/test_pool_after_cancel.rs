use std::{str::FromStr, time::Duration, thread};

use nujade_backend::{graphql::reservations::FormReservation, types::phone::Phone, market::geocoder::mock_location};
use uuid::Uuid;

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_has_correct_pool_order_after_cancel() {
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

    let id_reservation = Uuid::from_str("15B78E38-3F11-4D47-B9F6-8109FAA5ED16").expect("Invalid uuid");

    let form = FormReservation {
        passenger_count: 2,
        is_dropoff: false,
        stops: vec![
            mock_location::BENET_HALL.stop()
        ]
    };

    let res_reservation = market.reservation.create(&rider_phone, &id_reservation, &id_event, form).await;
    assert!(res_reservation.is_ok(), "Colud not reserve, got error: {:?}", res_reservation);

    let strat_new_res = market.event.get_estimates(&id_event).await;
    assert!(strat_new_res.is_ok(), "Stratgy is not ok, Get error: `{:?}`", strat_new_res);

    let strat_new = strat_new_res.unwrap();

    let driver_strat = strat_new.drivers.get(&driver.id).unwrap();
    assert!(driver_strat.dest.is_none());
    assert!(driver_strat.queue.is_empty());
    assert!(driver_strat.picked_up.is_empty());

    let pool_res = market.event.get_pool(&id_event).await;
    assert!(pool_res.is_ok());

    let pool = pool_res.unwrap();

    assert_eq!(pool.len(), 1);

    let first_pool_item_res = pool.get(0);
    assert!(first_pool_item_res.is_some());

    let first_pool_item = first_pool_item_res.unwrap();
    assert_eq!(first_pool_item.id, id_reservation);

    thread::sleep(Duration::from_secs(1));

    let rider_phone_2 = Phone::new("+18002000003").expect("Invalid phone number");
    let id_reservation_2 = Uuid::from_str("d6d735e5-6d2d-4ca5-8cd3-08291491bdbe").expect("Invalid uuid");

    let form_2 = FormReservation {
        passenger_count: 1,
        is_dropoff: false,
        stops: vec![
            mock_location::BENET_HALL.stop()
        ]
    };

    let res_reservation_2 = market.reservation.create(&rider_phone_2, &id_reservation_2, &id_event, form_2).await;
    assert!(res_reservation_2.is_ok(), "Could not reserve, got error: {:?}", res_reservation_2);

    let pool_res = market.event.get_pool(&id_event).await;
    assert!(pool_res.is_ok());

    let pool = pool_res.unwrap();
    assert_eq!(pool.len(), 2);

    let first_pool_item_res = pool.get(0);
    assert!(first_pool_item_res.is_some());

    let first_pool_item = first_pool_item_res.unwrap();
    assert_eq!(first_pool_item.id, id_reservation);

    let second_pool_item_res = pool.get(1);
    assert!(second_pool_item_res.is_some());

    let second_pool_item = second_pool_item_res.unwrap();
    assert_eq!(second_pool_item.id, id_reservation_2);

    let cancel_res = market.reservation.cancel(&id_reservation).await;
    assert!(cancel_res.is_ok());

    let pool_res = market.event.get_pool(&id_event).await;
    assert!(pool_res.is_ok());

    let pool = pool_res.unwrap();

    assert_eq!(pool.len(), 1);
    
    let first_pool_item_res = pool.get(0);
    assert!(first_pool_item_res.is_some());

    let first_pool_item = first_pool_item_res.unwrap();
    assert_eq!(first_pool_item.id, id_reservation_2);
}
