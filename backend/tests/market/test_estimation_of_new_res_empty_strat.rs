use nujade_backend::{graphql::reservations::FormReservation, market::geocoder::mock_location};

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

    let form = FormReservation {
        passenger_count: 2,
        is_dropoff: false,
        stops: vec![
            mock_location::BENET_HALL.stop()
        ]
    };

    let est_res = market.event.get_estimate_reservation_new(&id_event, &form).await;
    assert!(est_res.is_ok(), "Estimation of new event failed: {est_res:?}");
    let est = est_res.unwrap();

    assert_eq!(est.time_estimate.pickup.num_minutes(), 10);
    assert_eq!(est.time_estimate.arrival.num_minutes(), 15);
    assert_eq!(est.queue_position, 0);
}
