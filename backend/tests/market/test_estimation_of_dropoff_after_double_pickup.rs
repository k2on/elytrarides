use std::{str::FromStr, time::Duration, thread};
use backend::{graphql::reservations::{FormReservation, stops::model::FormReservationStop}, market::geocoder::mock_location, types::phone::Phone};
use uuid::Uuid;

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_estimation_of_new_dropoff_after_double_pickup() {
    let market = common::setup();
    common::init(&market).await;

    let id_event = common::get_id_event();
    let driver_phone = common::get_driver_phone();

    let rider_phone = Phone::new("+10000000002").expect("Invalid phone number");
    let rider2_phone = Phone::new("+10000000003").expect("Invalid phone number");
    let rider3_phone = Phone::new("+10000000004").expect("Invalid phone number");

    let id_reservation = Uuid::from_str("15B78E38-3F11-4D47-B9F6-8109FAA5ED16").expect("Invalid uuid");
    let id_reservation2 = Uuid::from_str("81635564-5011-4090-9d48-74de76bf331a").expect("Invalid uuid");
    let id_reservation3 = Uuid::from_str("a0bbd9bd-a6e3-4203-b5a9-775907f1b790").expect("Invalid uuid");

    let driver_res = market.driver.find(&id_event, &driver_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver. Got error: `{:?}`", driver_res);

    let driver = driver_res.unwrap();
    
    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping failed, got {:?}", ping_res);

    let id_stop_from = Uuid::from_str("6ead1788-30e3-4bb3-9659-9b4306e9afac").expect("Invalid uuid");
    let id_stop_to = Uuid::from_str("914bf78a-90cd-438a-8b3b-ae34cea5ece2").expect("Invalid uuid");

    let form1 = FormReservation {
        passenger_count: 2,
        stops: vec![
            FormReservationStop {
                id: id_stop_from,
                stop_order: 0,
                location: Some(mock_location::BENET_HALL.stop()),
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

    let id_stop_from2 = Uuid::from_str("dd813024-593f-4b67-8cda-bbaaaab0b347").expect("Invalid uuid");
    let id_stop_to2 = Uuid::from_str("580a30a0-784c-4107-9bfc-5d4b8a85a890").expect("Invalid uuid");

    let form2 = FormReservation {
        passenger_count: 1,
        stops: vec![
            FormReservationStop {
                id: id_stop_from2,
                stop_order: 0,
                location: Some(mock_location::DOUTHIT.stop()),
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

    let id_stop_from3 = Uuid::from_str("3fd12821-d861-45be-b830-211ba8cdc890").expect("Invalid uuid");
    let id_stop_to3 = Uuid::from_str("bbc4f9d7-b0d8-46cf-84e3-92100088eedb").expect("Invalid uuid");

    let form3 = FormReservation {
        passenger_count: 1,
        stops: vec![
            FormReservationStop {
                id: id_stop_to3,
                stop_order: 0,
                location: None,
            },
            FormReservationStop {
                id: id_stop_from3,
                stop_order: 1,
                location: Some(mock_location::BENET_HALL.stop()),
            },
        ]
    };

    thread::sleep(Duration::from_secs(1));
    let reserve3_res = market.reservation.create(&rider3_phone, &id_reservation3, &id_event, form3).await;
    assert!(reserve3_res.is_ok(), "Failed to reserve3, {reserve3_res:?}");
    let res3 = reserve3_res.unwrap();

    let est_res = market.reservation.estimate(&res3).await;
    assert!(est_res.is_ok(), "Failed to estimate 3, {est_res:?}");

    let est = est_res.unwrap();

    assert_eq!(est.stop_etas.get(0).unwrap().eta, 15 * 60);
    assert_eq!(est.stop_etas.get(1).unwrap().eta, 20 * 60);
    assert_eq!(est.queue_position, 1);
}
