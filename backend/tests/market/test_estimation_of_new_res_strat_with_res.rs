use backend::{graphql::reservations::{FormReservation, stops::model::FormReservationStop}, market::geocoder::mock_location, types::phone::Phone};
use uuid::Uuid;
use std::{str::FromStr, thread, time::Duration};

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_estimation_of_new_res_strat_with_res() {
    let market = common::setup();
    common::init(&market).await;

    let id_event = common::get_id_event();
    let driver_phone = common::get_driver_phone();

    let driver_res = market.driver.find(&id_event, &driver_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver. Got error: `{:?}`", driver_res);

    let rider_phone = Phone::new("+10000000002").expect("Invalid phone number");
    let rider2_phone = Phone::new("+10000000003").expect("Invalid phone number");

    let id_reservation = Uuid::from_str("15B78E38-3F11-4D47-B9F6-8109FAA5ED16").expect("Invalid uuid");
    let id_reservation2 = Uuid::from_str("81635564-5011-4090-9d48-74de76bf331a").expect("Invalid uuid");

    let driver = driver_res.unwrap();
    
    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping failed, got {:?}", ping_res);

    let id_stop_from = Uuid::from_str("bdbde340-c1b3-432f-a095-774fa92f558e").expect("Invalid uuid");
    let id_stop_to = Uuid::from_str("63447ea8-c049-4eea-b418-a7248a1e2f36").expect("Invalid uuid");

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

    let reserve_res = market.reservation.create(&rider_phone, &id_reservation, &id_event, form).await;
    assert!(reserve_res.is_ok(), "Could not make reservation: {reserve_res:?}");
    let res1 = reserve_res.unwrap();
    thread::sleep(Duration::from_secs(1));

    let id_stop_from2 = Uuid::from_str("35cb42d2-211b-4b2b-a7aa-29c23d813e2b").expect("Invalid uuid");
    let id_stop_to2 = Uuid::from_str("1d40c442-8c10-42fc-888e-9f919d6632ee").expect("Invalid uuid");

    let form2 = FormReservation {
        passenger_count: 1,
        stops: vec![
            FormReservationStop {
                id: id_stop_from2,
                stop_order: 0,
                location: Some(mock_location::DOUTHIT.stop())
            },
            FormReservationStop {
                id: id_stop_to2,
                stop_order: 1,
                location: None,
            },
        ]
    };


    let est_res = market.event.get_estimate_reservation_new(&id_event, &form2).await;
    assert!(est_res.is_ok(), "Estimation of new event failed: {est_res:?}");
    let est = est_res.unwrap();

    assert_eq!(est.stop_etas.get(0).unwrap().eta, 19 * 60);
    assert_eq!(est.stop_etas.get(1).unwrap().eta, 23 * 60);
    assert_eq!(est.queue_position, 1);

    let reserve_res = market.reservation.create(&rider2_phone, &id_reservation2, &id_event, form2).await;
    assert!(reserve_res.is_ok(), "Could not create reservation 2: {reserve_res:?}");
    let res2 = reserve_res.unwrap();

    let est2_res = market.reservation.estimate(&res2).await;
    assert!(est2_res.is_ok(), "Could not estimate reservation 2: {est2_res:?}");


    let est2 = est2_res.unwrap();

    assert_eq!(est2.stop_etas.get(0).unwrap().eta, 19 * 60);
    assert_eq!(est2.stop_etas.get(1).unwrap().eta, 23 * 60);
    assert_eq!(est2.queue_position, 1);

    let est1_res = market.reservation.estimate(&res1).await;
    assert!(est1_res.is_ok(), "Could not estimate reservation 1: {est1_res:?}");

    let est1 = est1_res.unwrap();
    assert_eq!(est1.stop_etas.get(0).unwrap().eta, 10 * 60);
    assert_eq!(est1.stop_etas.get(1).unwrap().eta, 15 * 60);
    assert_eq!(est1.queue_position, 0);

}
