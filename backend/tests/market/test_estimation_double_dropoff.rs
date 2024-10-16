use std::{str::FromStr, thread, time::Duration};
use backend::{graphql::reservations::{FormReservation, stops::model::FormReservationStop}, market::geocoder::mock_location, types::phone::Phone};
use uuid::Uuid;

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_estimation_double_dropoff() {
    let market = common::setup();
    common::init(&market).await;

    let id_event = common::get_id_event();
    let driver_phone = common::get_driver_phone();

    let rider_phone = Phone::new("+10000000002").expect("Invalid phone number");
    let rider2_phone = Phone::new("+10000000003").expect("Invalid phone number");

    let id_reservation = Uuid::from_str("15B78E38-3F11-4D47-B9F6-8109FAA5ED16").expect("Invalid uuid");
    let id_reservation2 = Uuid::from_str("81635564-5011-4090-9d48-74de76bf331a").expect("Invalid uuid");

    let id_stop_from = Uuid::from_str("4a9c8e3d-a453-488f-a3d0-8aec71da4d30").expect("Invalid uuid");
    let id_stop_to = Uuid::from_str("bc4a58b6-f095-4456-a4b8-2fde4a43b31c").expect("Invalid uuid");

    let id_stop_from2 = Uuid::from_str("33ef0231-b75a-41f5-bf5f-a55c4e93e3b0").expect("Invalid uuid");
    let id_stop_to2 = Uuid::from_str("9c6952ba-6fce-42e4-bdbb-b0b6f0e319df").expect("Invalid uuid");

    let driver_res = market.driver.find(&id_event, &driver_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver. Got error: `{:?}`", driver_res);

    let driver = driver_res.unwrap();
    
    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping failed, got {:?}", ping_res);

    let form1 = FormReservation {
        passenger_count: 2,
        stops: vec![
            FormReservationStop {
                id: id_stop_from,
                stop_order: 0,
                location: None,
            },
            FormReservationStop {
                id: id_stop_to,
                stop_order: 1,
                location: Some(mock_location::BENET_HALL.stop()),
            },
        ]
    };

    let reserve_res = market.reservation.create(&rider_phone, &id_reservation, &id_event, form1).await;
    assert!(reserve_res.is_ok(), "Failed to reserve1, {reserve_res:?}");
    let res1 = reserve_res.unwrap();

    let est1_res = market.reservation.estimate(&res1).await;
    assert!(est1_res.is_ok(), "Failed to estimate 1, {est1_res:?}");

    let est1 = est1_res.unwrap();

    assert_eq!(est1.stop_etas.get(0).unwrap().eta, 3 * 60);
    assert_eq!(est1.stop_etas.get(1).unwrap().eta, 8 * 60);
    assert_eq!(est1.queue_position, 0);

    let form2 = FormReservation {
        passenger_count: 1,
        stops: vec![
            FormReservationStop {
                id: id_stop_from2,
                stop_order: 0,
                location: None,
            },
            FormReservationStop {
                id: id_stop_to2,
                stop_order: 1,
                location: Some(mock_location::DOUTHIT.stop()),
            },
        ]
    };

    thread::sleep(Duration::from_secs(1));
    let reserve2_res = market.reservation.create(&rider2_phone, &id_reservation2, &id_event, form2).await;
    assert!(reserve2_res.is_ok(), "Failed to reserve1, {reserve2_res:?}");
    let res2 = reserve2_res.unwrap();

    let est2_res = market.reservation.estimate(&res2).await;
    assert!(est2_res.is_ok(), "Failed to estimate 2, {est2_res:?}");

    let est2 = est2_res.unwrap();

    assert_eq!(est2.stop_etas.get(0).unwrap().eta, 13 * 60);
    assert_eq!(est2.stop_etas.get(1).unwrap().eta, 17 * 60);
    assert_eq!(est2.queue_position, 1);
}
