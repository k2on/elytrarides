use std::str::FromStr;

use nujade_backend::{graphql::reservations::FormReservation, types::phone::Phone, market::geocoder::mock_location};
use uuid::Uuid;

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_estimation_of_res_in_pool() {
    let market = common::setup();
    common::init(&market).await;

    let id_event = common::get_id_event();
    let driver_phone = common::get_driver_phone();

    let driver_res = market.driver.find(&id_event, &driver_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver. Got error: `{:?}`", driver_res);

    let driver = driver_res.unwrap();
    
    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping failed, got {:?}", ping_res);

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
    assert!(res_reservation.is_ok(), "Could not reserve, got error: {:?}", res_reservation);
    let reservation = res_reservation.unwrap();


    let estimation_res = market.reservation.estimate(&reservation).await;
    assert!(estimation_res.is_ok(), "Reservation.estimation got an error: {estimation_res:?}");
    let estimation = estimation_res.unwrap();

    assert_eq!(estimation.time_estimate.pickup.num_minutes(), 10);
    assert_eq!(estimation.time_estimate.arrival.num_minutes(), 15);
    assert_eq!(estimation.queue_position, 0);
}
