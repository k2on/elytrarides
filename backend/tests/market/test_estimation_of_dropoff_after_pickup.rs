use std::{str::FromStr, thread, time::Duration};
use backend::{graphql::reservations::{FormReservation, stops::model::FormReservationStop}, market::geocoder::mock_location, types::phone::Phone};
use uuid::Uuid;

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_estimation_of_new_dropoff_after_pickup() {
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

    let id_stop_from = Uuid::from_str("ebb08250-09b2-4bb0-9583-756b9309b184").expect("Invalid uuid");
    let id_stop_to = Uuid::from_str("42bc7910-dca4-4c1d-a01f-e309734e3490").expect("Invalid uuid");

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
    // let res1 = reserve_res.unwrap();
    thread::sleep(Duration::from_secs(1));

    let id_stop_from2 = Uuid::from_str("1bc17aa8-e99f-4d01-b640-4e90f9f37982").expect("Invalid uuid");
    let id_stop_to2 = Uuid::from_str("663e8c39-15b0-4f14-abe8-6986460ffecf").expect("Invalid uuid");

    let form2 = FormReservation {
        passenger_count: 1,
        stops: vec![
            FormReservationStop {
                id: id_stop_to2,
                stop_order: 0,
                location: None,
            },
            FormReservationStop {
                id: id_stop_from2,
                stop_order: 1,
                location: Some(mock_location::DOUTHIT.stop()),
            },
        ]
    };

    let reserve2_res = market.reservation.create(&rider2_phone, &id_reservation2, &id_event, form2).await;
    assert!(reserve2_res.is_ok(), "Failed to reserve2, {reserve2_res:?}");
    let res2 = reserve2_res.unwrap();

    let est_res = market.reservation.estimate(&res2).await;
    assert!(est_res.is_ok(), "Failed to estimate 2, {est_res:?}");

    let est = est_res.unwrap();

    assert_eq!(est.stop_etas.get(0).unwrap().eta, 15 * 60);
    assert_eq!(est.stop_etas.get(1).unwrap().eta, 19 * 60);
    assert_eq!(est.queue_position, 1);
}
