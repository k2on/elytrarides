use nujade_backend::{graphql::drivers::Driver, schema::reservations::id_driver, market::geocoder::mock_location};

#[path = "../common.rs"]
mod common;

#[actix_web::main]
#[test]
async fn it_checks_empty_strategy() {
    let market = common::setup();
    common::init(&market).await;

    let id_event = common::get_id_event();
    let driver_phone = common::get_driver_phone();

    let driver_res = market.driver.find(&id_event, &driver_phone).await;
    assert!(matches!(driver_res, Ok(_)), "Error getting the event driver. Got error: `{:?}`", driver_res);

    let driver: Driver = driver_res.unwrap().into();
    assert_eq!(driver.phone, driver_phone);
    assert_eq!(driver.id_event, id_event);

    let res_strat = market.event.get_estimates(&id_event).await;
    assert!(res_strat.is_ok(), "Stratgy is not ok, Get error: `{:?}`", res_strat);

    let strat = res_strat.unwrap();

    assert_eq!(strat.drivers.len(), 0);
    let ping_res = market.driver.ping(&id_event, &driver.id, &mock_location::TIGER_BLVD_LATLNG).await;
    assert!(ping_res.is_ok());

    let strat = market.event.get_estimates(&id_event).await.unwrap();
    assert_eq!(strat.drivers.len(), 1);

    assert!(strat.drivers.contains_key(&driver.id));

    let driver_strat = strat.drivers.get(&driver.id).unwrap();
    assert!(driver_strat.dest.is_none());
    assert!(driver_strat.queue.is_empty());
    assert!(driver_strat.picked_up.is_empty());

    let pool_res = market.event.get_pool(&id_event).await;
    assert!(pool_res.is_ok());

    let pool = pool_res.unwrap();
    assert!(pool.is_empty());
}

