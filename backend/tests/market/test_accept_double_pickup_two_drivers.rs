use backend::{graphql::reservations::{FormReservation, stops::model::FormReservationStop}, market::geocoder::mock_location, types::phone::Phone};
use uuid::Uuid;
use std::{str::FromStr, thread, time::Duration};

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_accept_double_pickup_two_drivers() {
    let market = common::setup();
    common::init_with_two_drivers(&market).await;

    let id_event = common::get_id_event();
    let driver1_phone = common::get_driver_phone();
    let driver2_phone = common::get_driver2_phone();

    let driver_res = market.driver.find(&id_event, &driver1_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver 1. Got error: `{:?}`", driver_res);
    let driver1 = driver_res.unwrap();

    let driver_res = market.driver.find(&id_event, &driver2_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver 1. Got error: `{:?}`", driver_res);
    let driver2 = driver_res.unwrap();

    let rider_phone = Phone::new("+10000000002").expect("Invalid phone number");
    let rider2_phone = Phone::new("+10000000003").expect("Invalid phone number");

    let ping_res = market.driver.ping(&id_event, &driver1.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping 1 failed, got {:?}", ping_res);

    let ping_res = market.driver.ping(&id_event, &driver2.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping 2 failed, got {:?}", ping_res);

    let id_reservation = Uuid::from_str("15B78E38-3F11-4D47-B9F6-8109FAA5ED16").expect("Invalid uuid");
    let id_stop_from = Uuid::from_str("25348de1-1f5e-410a-8c83-3b2354ae9395").expect("Invalid uuid");
    let id_stop_to = Uuid::from_str("897d80d7-203c-4bea-b69a-a48268c25b6b").expect("Invalid uuid");

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
            }
        ]
    };

    let reserve_res = market.reservation.create(&rider_phone, &id_reservation, &id_event, form).await;
    assert!(reserve_res.is_ok(), "Could not make reservation: {reserve_res:?}");
    let res1 = reserve_res.unwrap();

    let est1_res = market.reservation.estimate(&res1).await;
    assert!(est1_res.is_ok(), "Could not estimate 1, got {est1_res:?}");
    let est1 = est1_res.unwrap();

    assert_eq!(est1.stop_etas.get(0).unwrap().eta, 10 * 60);
    assert_eq!(est1.stop_etas.get(1).unwrap().eta, 15 * 60);
    assert_eq!(est1.queue_position, 0);

    let id_reservation2 = Uuid::from_str("81635564-5011-4090-9d48-74de76bf331a").expect("Invalid uuid");
    let id_stop_from2 = Uuid::from_str("e11d02ed-3611-4404-bfbd-a99203374f69").expect("Invalid uuid");
    let id_stop_to2 = Uuid::from_str("10a7aaff-e186-4136-b061-11970d5f2b3c").expect("Invalid uuid");
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
            }
        ]
    };

    thread::sleep(Duration::from_secs(1));
    let reserve_res = market.reservation.create(&rider2_phone, &id_reservation2, &id_event, form2).await;
    assert!(reserve_res.is_ok(), "Could not create reservation 2: {reserve_res:?}");
    let res2 = reserve_res.unwrap();

    let est2_res = market.reservation.estimate(&res2).await;
    assert!(est2_res.is_ok(), "Could not estimate 2, got {est2_res:?}");
    let est2 = est2_res.unwrap();

    assert_eq!(est2.stop_etas.get(0).unwrap().eta, 8 * 60);
    assert_eq!(est2.stop_etas.get(1).unwrap().eta, 12 * 60);
    assert_eq!(est2.queue_position, 0);

    let avaliable1_res = market.event.get_avaliable_reservation(&id_event, &driver1.id).await;
    assert!(avaliable1_res.is_ok());
    let avaliable1_opt = avaliable1_res.unwrap();
    assert!(avaliable1_opt.is_some());
    let avaliable1 = avaliable1_opt.unwrap();

    assert_eq!(avaliable1.id, id_reservation);

    let avaliable2_res = market.event.get_avaliable_reservation(&id_event, &driver2.id).await;
    assert!(avaliable2_res.is_ok());
    let avaliable2_opt = avaliable2_res.unwrap();
    assert!(avaliable2_opt.is_some());
    let avaliable2 = avaliable2_opt.unwrap();

    assert_eq!(avaliable2.id, id_reservation);

    let accept_res = market.driver.accept(&driver1.id, &avaliable2.id).await;
    assert!(accept_res.is_ok());

    let avaliable3_res = market.event.get_avaliable_reservation(&id_event, &driver2.id).await;
    assert!(avaliable3_res.is_ok());
    let avaliable3_opt = avaliable3_res.unwrap();
    assert!(avaliable3_opt.is_some());
    let avaliable3 = avaliable3_opt.unwrap();

    assert_eq!(avaliable3.id, id_reservation2);

    let accept2_res = market.driver.accept(&driver2.id,  &avaliable3.id).await;
    assert!(accept2_res.is_ok());

    let res1_res = market.reservation.get(&res1.id).await;
    assert!(res1_res.is_ok());
    let res1 = res1_res.unwrap();

    let est1_res = market.reservation.estimate(&res1).await;
    assert!(est1_res.is_ok(), "Could not estimate 1, got {est1_res:?}");

    let est1 = est1_res.unwrap();

    assert_eq!(est1.stop_etas.get(0).unwrap().eta, 10 * 60);
    assert_eq!(est1.stop_etas.get(1).unwrap().eta, 15 * 60);
    assert_eq!(est1.queue_position, 0);

    let res2_res = market.reservation.get(&res2.id).await;
    assert!(res2_res.is_ok());
    let res2 = res2_res.unwrap();

    let est2_res = market.reservation.estimate(&res2).await;
    assert!(est2_res.is_ok(), "Could not estimate 2, got {est2_res:?}");
    let est2 = est2_res.unwrap();

    assert_eq!(est2.stop_etas.get(0).unwrap().eta, 8 * 60);
    assert_eq!(est2.stop_etas.get(1).unwrap().eta, 12 * 60);
    assert_eq!(est2.queue_position, 0);
}
