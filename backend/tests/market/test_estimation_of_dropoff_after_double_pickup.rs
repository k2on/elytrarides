use std::{str::FromStr, time::Duration, thread};
use nujade_backend::{graphql::reservations::FormReservation, market::geocoder::mock_location, types::phone::Phone};
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

    let rider_phone = Phone::new("+18002000002").expect("Invalid phone number");
    let rider2_phone = Phone::new("+18002000003").expect("Invalid phone number");
    let rider3_phone = Phone::new("+18002000004").expect("Invalid phone number");

    let id_reservation = Uuid::from_str("15B78E38-3F11-4D47-B9F6-8109FAA5ED16").expect("Invalid uuid");
    let id_reservation2 = Uuid::from_str("81635564-5011-4090-9d48-74de76bf331a").expect("Invalid uuid");
    let id_reservation3 = Uuid::from_str("a0bbd9bd-a6e3-4203-b5a9-775907f1b790").expect("Invalid uuid");

    let driver_res = market.driver.find(&id_event, &driver_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver. Got error: `{:?}`", driver_res);

    let driver = driver_res.unwrap();
    
    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok(), "Ping failed, got {:?}", ping_res);

    let form1 = FormReservation {
        passenger_count: 2,
        is_dropoff: false,
        stops: vec![
            mock_location::BENET_HALL.stop()
        ]
    };

    let reserve_res = market.reservation.create(&rider_phone, &id_reservation, &id_event, form1).await;
    assert!(reserve_res.is_ok(), "Failed to reserve1, {reserve_res:?}");

    let form2 = FormReservation {
        passenger_count: 1,
        is_dropoff: false,
        stops: vec![
            mock_location::DOUTHIT.stop(),
        ]
    };

    thread::sleep(Duration::from_secs(1));
    let reserve2_res = market.reservation.create(&rider2_phone, &id_reservation2, &id_event, form2).await;
    assert!(reserve2_res.is_ok(), "Failed to reserve2, {reserve2_res:?}");

    let form3 = FormReservation {
        passenger_count: 1,
        is_dropoff: true,
        stops: vec![
            mock_location::BENET_HALL.stop()
        ]
    };

    thread::sleep(Duration::from_secs(1));
    let reserve3_res = market.reservation.create(&rider3_phone, &id_reservation3, &id_event, form3).await;
    assert!(reserve3_res.is_ok(), "Failed to reserve3, {reserve3_res:?}");
    let res3 = reserve3_res.unwrap();

    let est_res = market.reservation.estimate(&res3).await;
    assert!(est_res.is_ok(), "Failed to estimate 3, {est_res:?}");

    let est = est_res.unwrap();

    assert_eq!(est.time_estimate.pickup.num_minutes(), 15);
    assert_eq!(est.time_estimate.arrival.num_minutes(), 20);
    assert_eq!(est.queue_position, 1);
}
