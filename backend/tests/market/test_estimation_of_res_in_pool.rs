use std::str::FromStr;

use backend::{graphql::reservations::{FormReservation, stops::model::FormReservationStop}, types::phone::Phone, market::geocoder::mock_location};
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

    let rider_phone = Phone::new("+10000000002").expect("Invalid phone number");

    let id_reservation = Uuid::from_str("15B78E38-3F11-4D47-B9F6-8109FAA5ED16").expect("Invalid uuid");
    let id_stop_from = Uuid::from_str("f07f8312-f02f-4880-bdb5-6384bf67cc2b").expect("Invalid uuid");
    let id_stop_to = Uuid::from_str("a5fa027d-2e99-4738-8b11-7860ccbc1d43").expect("Invalid uuid");

    let form = FormReservation {
        passenger_count: 2,
        stops: vec![
            FormReservationStop {
                id: id_stop_from,
                stop_order: 0,
                location: Some(mock_location::BENET_HALL.stop())
            },
            FormReservationStop {
                id: id_stop_to,
                stop_order: 1,
                location: None,
            },
        ]
    };

    let res_reservation = market.reservation.create(&rider_phone, &id_reservation, &id_event, form).await;
    assert!(res_reservation.is_ok(), "Could not reserve, got error: {:?}", res_reservation);
    let reservation = res_reservation.unwrap();


    let estimation_res = market.reservation.estimate(&reservation).await;
    assert!(estimation_res.is_ok(), "Reservation.estimation got an error: {estimation_res:?}");
    let estimation = estimation_res.unwrap();

    assert_eq!(estimation.stop_etas.get(0).unwrap().eta, 10 * 60);
    assert_eq!(estimation.stop_etas.get(1).unwrap().eta, 15 * 60);
    assert_eq!(estimation.queue_position, 0);
}
