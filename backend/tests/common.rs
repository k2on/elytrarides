use std::str::FromStr;

use actix::SyncArbiter;
use dotenv::dotenv;

use backend::db_util::{get_pool, DBActor};

use backend::graphql::drivers::{FormEventDriver, Driver};
use backend::graphql::drivers::messages::{EventDriverUpdate, EventDriversList};
use backend::graphql::events::{FormEvent, DBEventInsertable};
use backend::graphql::events::messages::EventUpdate;
use backend::graphql::locations::FormLocation;
use backend::graphql::locations::messages::OrgLocationUpdate;
use backend::graphql::orgs::messages::OrganizationUpdate;
use backend::graphql::orgs::model::FormOrganization;
use backend::graphql::reservations::messages::ReservationsClear;
use backend::graphql::vehicles::FormVehicle;
use backend::graphql::vehicles::messages::VehicleUpdate;
use backend::market::Market;
use backend::market::geocoder::mock_location;
use backend::types::phone::Phone;
use uuid::Uuid;

pub fn get_id_org() -> Uuid {
    Uuid::from_str("FCC5815B-A16C-4254-B3F1-B96001CEB4A6").expect("Invalid UUID")
}
pub fn get_id_location() -> Uuid {
    Uuid::from_str("784828C2-630F-4D16-9496-3BF646F7DDE7").expect("Invalid UUID")
}
pub fn get_id_event() -> Uuid {
    Uuid::from_str("7D4F5E26-98B3-420F-9B28-58689278B041").expect("Invalid UUID")
}
pub fn get_id_vehicle() -> Uuid {
    Uuid::from_str("AF92358B-62E2-4FDA-8578-DC219E8D8EED").expect("Invalid UUID")
}
pub fn get_driver_phone() -> Phone {
    Phone::new("+18001000001").expect("Invalid phone number")
}
pub fn get_driver2_phone() -> Phone {
    Phone::new("+18001000002").expect("Invalid phone number")
}

pub fn setup() -> Market {

    dotenv().ok();
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = get_pool(&db_url);
    let db_addr = SyncArbiter::start(5, move || DBActor(pool.clone()));

    // let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let cfg = kv::Config::new("./kv_tst");
    let kv = kv::Store::new(cfg).unwrap();

    // let schema = create_schema();

    let market = Market::mock(db_addr, kv);
    market
}

async fn clear_reservations(market: &Market) {
    let id_event = get_id_event();
    market.db.send(ReservationsClear { id_event }).await
        .expect("No db conn")
        .expect("Could not clear reservations");
}

#[allow(dead_code)]
pub async fn init(market: &Market) {
    market.clear_cache().expect("Could not clear cache");
    clear_drivers(&market).await;
    init_org(&market).await;
    init_location(&market).await;
    init_vehicle(&market).await;
    init_event(&market).await;
    init_driver(&market).await;
    clear_reservations(&market).await;
}

#[allow(dead_code)]
pub async fn init_with_two_drivers(market: &Market) {
    market.clear_cache().expect("Could not clear cache");
    clear_drivers(&market).await;
    init_org(&market).await;
    init_location(&market).await;
    init_vehicle(&market).await;
    init_event(&market).await;
    init_two_drivers(&market).await;
    clear_reservations(&market).await;
}


pub async fn init_org(market: &Market) {
    let id_org = get_id_org();
    let org_label = "TEST_LOCAL".to_owned();
    let org_bio = "Local test org".to_owned();

    let form_org = FormOrganization {
        label: org_label.clone(),
        bio: Some(org_bio.clone()),
        logo_url: None,
        banner_url: None,
        college: None,
    };
    let create_res = market.db.send(OrganizationUpdate { id: id_org, form: form_org }).await;
    assert!(matches!(create_res, Ok(Ok(_))), "Error creating the test organization. Got error: `{:?}`", create_res);

    let org = create_res.unwrap().unwrap();
    assert_eq!(org.id, id_org, "Org id does not match");
    assert_eq!(org.label, org_label, "Org label does not match");
    assert_eq!(org.bio, Some(org_bio), "Org bio does not match");
    assert!(org.logo_url.is_none());
    assert!(org.banner_url.is_none());
    assert!(org.college.is_none());
}

pub async fn init_location(market: &Market) {
    let id_org = get_id_org();
    let id_location = get_id_location();
    let loc_label = "My event location".to_owned();
    let loc_image_url = "https://url.com".to_owned();
    let loc_latlng = mock_location::CSP_LATLNG;

    let form = FormLocation {
        label: Some(loc_label.clone()),
        location_lat: Some(loc_latlng.lat),
        location_lng: Some(loc_latlng.lng),
        image_url: Some(loc_image_url.clone()),
        obsolete_at: None,
    };

    let create_res = market.db.send(OrgLocationUpdate {
        id_org,
        id_location,
        form,
    }).await;
    assert!(matches!(create_res, Ok(Ok(_))), "Error creating the test location. Got error: `{:?}`", create_res);

    let location = create_res.unwrap().unwrap();
    assert_eq!(location.id, id_location);
    assert_eq!(location.id_org, id_org);
    assert_eq!(location.label, Some(loc_label));
    assert_eq!(location.location_lat, Some(loc_latlng.lat));
    assert_eq!(location.location_lng, Some(loc_latlng.lng));
    assert_eq!(location.image_url, Some(loc_image_url));
    assert!(location.obsolete_at.is_none());
}

pub async fn init_vehicle(market: &Market) {
    let id_org = get_id_org();
    let id_vehicle = get_id_vehicle();
    let year = 2020;
    let make = "INFINITI".to_owned();
    let model = "G37".to_owned();
    let color = "GREY".to_owned();
    let image_url = "https://image.url".to_owned();
    let license = "PLATE".to_owned();
    let capacity = 4;

    let form = FormVehicle {
        year: Some(year),
        make: Some(make.clone()),
        model: Some(model.clone()),
        color: Some(color.clone()),
        image_url: Some(image_url.clone()),
        license: Some(license.clone()),
        capacity: Some(capacity),
        obsolete_at: None,
        owner: None,
    };

    let res = market.db.send(VehicleUpdate {
        id_org,
        id_vehicle,
        form
    }).await;
    assert!(matches!(res, Ok(Ok(_))), "Error creating the test vehicle. Got error: `{:?}`", res);
    let vehicle = res.unwrap().unwrap();

    assert_eq!(vehicle.year, Some(year));
    assert_eq!(vehicle.make, Some(make));
    assert_eq!(vehicle.model, Some(model));
    assert_eq!(vehicle.color, Some(color));
    assert_eq!(vehicle.image_url, Some(image_url));
    assert_eq!(vehicle.license, Some(license));
    assert_eq!(vehicle.capacity, Some(capacity));
    assert!(vehicle.obsolete_at.is_none())
}

pub async fn init_event(market: &Market) {
    let id_org = get_id_org();
    let id_event = get_id_event();
    let id_location = get_id_location();

    let name = "My event".to_owned();
    let bio = "Come to my party".to_owned();
    let image_url = "https://my.url".to_owned();
    let time_start = 10;
    let time_end = 10;
    let reservations_start = 10;
    let reservations_end = 10;

    let form = FormEvent {
        name: Some(name.clone()),
        bio: Some(bio.clone()),
        image_url: Some(image_url.clone()),
        time_start: Some(time_start),
        time_end: Some(time_end),
        reservations_start: Some(reservations_start),
        reservations_end: Some(reservations_end),
        id_location: Some(id_location),
        obsolete_at: None,
        published_at: None,
    };




    let res = market.db.send(EventUpdate { event: DBEventInsertable {
        id: id_event,
        name: name.to_owned(),
        bio: form.bio,
        image_url: form.image_url,
        time_start,
        time_end,
        reservations_start,
        reservations_end,
        id_location,
        id_org,
        obsolete_at: None,
        published_at: form.published_at,
    } }).await;
    assert!(matches!(res, Ok(Ok(_))), "Error creating the test event. Got error: `{:?}`", res);

    let event = res.unwrap().unwrap();

    assert_eq!(event.id, id_event);
    assert_eq!(event.name, name);
    assert_eq!(event.bio, Some(bio));
    assert_eq!(event.image_url, Some(image_url));
    assert_eq!(event.time_start, time_start);
    assert_eq!(event.time_end, time_end);
    assert_eq!(event.reservations_start, reservations_start);
    assert_eq!(event.reservations_end, reservations_end);
    assert_eq!(event.id_location, id_location);
    assert!(event.obsolete_at.is_none());
    assert!(event.published_at.is_none());

}

pub async fn init_driver(market: &Market) {
    let id_event = get_id_event();
    let id_vehicle = get_id_vehicle();
    let phone = get_driver_phone();

    let res = market.db.send(EventDriverUpdate {
        id_event,
        phone: phone.clone(),
        form: FormEventDriver {
            id_vehicle: Some(id_vehicle),
            obsolete_at: None
        }
    }).await;
    assert!(matches!(res, Ok(Ok(_))), "Error creating the test driver. Got error: `{:?}`", res);

    let res_drivers = market.db.send(EventDriversList { id_event }).await;
    assert!(matches!(res_drivers, Ok(Ok(_))), "Error getting event drivers. Got error: `{:?}`", res_drivers);

    let drivers = res_drivers.unwrap().unwrap();
    assert_eq!(drivers.len(), 1);

    let driver: Driver = drivers.first().unwrap().clone().into();
    assert_eq!(driver.id_event, id_event);
    assert_eq!(driver.phone, phone);
    assert_eq!(driver.id_vehicle, Some(id_vehicle));
}

pub async fn init_two_drivers(market: &Market) {
    let id_event = get_id_event();
    let id_vehicle = get_id_vehicle();
    let phone1 = get_driver_phone();
    let phone2 = get_driver2_phone();

    let res = market.db.send(EventDriverUpdate {
        id_event,
        phone: phone1,
        form: FormEventDriver {
            id_vehicle: Some(id_vehicle),
            obsolete_at: None
        }
    }).await;
    assert!(matches!(res, Ok(Ok(_))), "Error creating the test driver 1. Got error: `{:?}`", res);

    let res = market.db.send(EventDriverUpdate {
        id_event,
        phone: phone2,
        form: FormEventDriver {
            id_vehicle: Some(id_vehicle),
            obsolete_at: None
        }
    }).await;
    assert!(matches!(res, Ok(Ok(_))), "Error creating the test driver 2. Got error: `{:?}`", res);

    let res_drivers = market.db.send(EventDriversList { id_event }).await;
    assert!(matches!(res_drivers, Ok(Ok(_))), "Error getting event drivers. Got error: `{:?}`", res_drivers);
    let drivers = res_drivers.unwrap().unwrap();

    assert_eq!(drivers.len(), 2);
}


async fn clear_drivers(market: &Market) {
    let id_event = get_id_event();
    let id_vehicle = get_id_vehicle();
    let driver1_phone = get_driver_phone();
    let driver2_phone = get_driver2_phone();

    let res = market.db.send(EventDriverUpdate {
        id_event,
        phone: driver1_phone,
        form: FormEventDriver {
            id_vehicle: Some(id_vehicle),
            obsolete_at: Some(1),
        }
    }).await;
    assert!(matches!(res, Ok(Ok(_))), "Error removing driver 1. Got error: `{:?}`", res);
    
    let res = market.db.send(EventDriverUpdate {
        id_event,
        phone: driver2_phone,
        form: FormEventDriver {
            id_vehicle: Some(id_vehicle),
            obsolete_at: Some(1),
        }
    }).await;
    assert!(matches!(res, Ok(Ok(_))), "Error removing driver 2. Got error: `{:?}`", res);

    let res_drivers = market.db.send(EventDriversList { id_event }).await;
    assert!(matches!(res_drivers, Ok(Ok(_))), "Error getting event drivers. Got error: `{:?}`", res_drivers);
    let drivers = res_drivers.unwrap().unwrap();
    assert!(drivers.is_empty(), "Drivers not empty, got {drivers:#?}");
}
