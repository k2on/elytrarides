use std::{str::FromStr, time::Duration, thread};
use backend::{graphql::reservations::{FormReservation, stops::model::FormReservationStop, ReservationStatus}, market::geocoder::mock_location, types::phone::Phone};
use uuid::Uuid;

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_estimation_pickup_after_complete_pickup() {
    let market = common::setup();
    common::init(&market).await;

    let id_event = common::get_id_event();
    let driver_phone = common::get_driver_phone();

    let rider_phone = Phone::new("+10000000002").expect("Invalid phone number");
    let rider2_phone = Phone::new("+10000000003").expect("Invalid phone number");

    let id_reservation = Uuid::from_str("15B78E38-3F11-4D47-B9F6-8109FAA5ED16").expect("Invalid uuid");
    let id_reservation2 = Uuid::from_str("81635564-5011-4090-9d48-74de76bf331a").expect("Invalid uuid");

    let driver_res = market.driver.find(&id_event, &driver_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver. Got error: `{:?}`", driver_res);

    let driver = driver_res.unwrap();
    
    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping failed, got {:?}", ping_res);

    let id_stop_from = Uuid::from_str("a6c1c245-22af-42e2-86b9-435905b7a559").expect("Invalid uuid");
    let id_stop_to = Uuid::from_str("5a028840-4154-445b-8912-4c9dadb0f378").expect("Invalid uuid");

    let form1 = FormReservation {
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

    let reserve_res = market.reservation.create(&rider_phone, &id_reservation, &id_event, form1).await;
    assert!(reserve_res.is_ok(), "Failed to reserve1, {reserve_res:?}");

    let id_stop_from2 = Uuid::from_str("6a240e97-936d-461b-89c1-09109dd52a28").expect("Invalid uuid");
    let id_stop_to2 = Uuid::from_str("bd474086-1546-4568-9a45-6ff7e435aee1").expect("Invalid uuid");

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

    thread::sleep(Duration::from_secs(1));
    let reserve2_res = market.reservation.create(&rider2_phone, &id_reservation2, &id_event, form2).await;
    assert!(reserve2_res.is_ok(), "Failed to reserve2, {reserve2_res:?}");
    let res2 = reserve2_res.unwrap();

    let accept_res = market.driver.accept(&driver.id, &id_reservation).await;
    assert!(accept_res.is_ok());

    let res1_res = market.reservation.get(&id_reservation).await;
    assert!(res1_res.is_ok());
    let res1 = res1_res.unwrap();

    let est_res = market.reservation.estimate(&res1).await;
    assert!(est_res.is_ok());
    let est = est_res.unwrap();

    assert_eq!(est.stop_etas.get(0).unwrap().eta, 10 * 60);
    assert_eq!(est.stop_etas.get(1).unwrap().eta, 15 * 60);
    assert_eq!(est.queue_position, 0);


    let est_res = market.reservation.estimate(&res2).await;
    assert!(est_res.is_ok());
    let est = est_res.unwrap();

    assert_eq!(est.stop_etas.get(0).unwrap().eta, 19 * 60);
    assert_eq!(est.stop_etas.get(1).unwrap().eta, 23 * 60);
    assert_eq!(est.queue_position, 1);

    let pickup_res = market.driver.next(&id_event, &driver.id).await;
    assert!(pickup_res.is_ok());

    let res1 = market.reservation.get(&id_reservation).await.unwrap();
    let stops = res1.stops.clone();
    assert!(stops.get(0).unwrap().complete_at.is_some());
    assert!(!matches!(res1.status, ReservationStatus::COMPLETE));

    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::BENET_HALL_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping failed, got {:?}", ping_res);
    
    let refresh_res = market.event.refresh_estimates(&id_event).await;
    assert!(refresh_res.is_ok());

    let est_res = market.reservation.estimate(&res1).await;
    assert!(est_res.is_ok());
    let est = est_res.unwrap();

    assert_eq!(est.stop_etas.get(0).unwrap().eta, 0);
    assert_eq!(est.stop_etas.get(1).unwrap().eta, 5 * 60);
    assert_eq!(est.queue_position, 0);

    let est_res = market.reservation.estimate(&res2).await;
    assert!(est_res.is_ok());
    let est = est_res.unwrap();

    assert_eq!(est.stop_etas.get(0).unwrap().eta, 9 * 60);
    assert_eq!(est.stop_etas.get(1).unwrap().eta, 13 * 60);
    assert_eq!(est.queue_position, 1);

    let dropoff_res = market.driver.next(&id_event, &driver.id).await;
    assert!(dropoff_res.is_ok());

    let res1 = market.reservation.get(&id_reservation).await.unwrap();
    assert!(matches!(res1.status, ReservationStatus::COMPLETE));

    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::CSP_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping failed, got {:?}", ping_res);

    let est_res = market.reservation.estimate(&res2).await;
    assert!(est_res.is_ok());
    let est = est_res.unwrap();

    assert_eq!(est.stop_etas.get(0).unwrap().eta, 4 * 60);
    assert_eq!(est.stop_etas.get(1).unwrap().eta, 8 * 60);
    assert_eq!(est.queue_position, 0);
}
