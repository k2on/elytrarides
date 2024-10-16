use backend::{graphql::reservations::{FormReservation, stops::model::FormReservationStop}, market::geocoder::mock_location};
use uuid::Uuid;
use std::str::FromStr;

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_estimation_of_new_res_empty_strat() {
    let market = common::setup();
    common::init(&market).await;

    let id_event = common::get_id_event();
    let driver_phone = common::get_driver_phone();

    let driver_res = market.driver.find(&id_event, &driver_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver. Got error: `{:?}`", driver_res);

    let driver = driver_res.unwrap();
    
    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping failed, got {:?}", ping_res);

    let id_stop_from = Uuid::from_str("1bc17aa8-e99f-4d01-b640-4e90f9f37982").expect("Invalid uuid");
    let id_stop_to = Uuid::from_str("663e8c39-15b0-4f14-abe8-6986460ffecf").expect("Invalid uuid");

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

    let est_res = market.event.get_estimate_reservation_new(&id_event, &form).await;
    assert!(est_res.is_ok(), "Estimation of new event failed: {est_res:?}");
    let est = est_res.unwrap();

    assert_eq!(est.stop_etas.get(0).unwrap().eta, 10 * 60);
    assert_eq!(est.stop_etas.get(1).unwrap().eta, 15 * 60);
    assert_eq!(est.queue_position, 0);
}
