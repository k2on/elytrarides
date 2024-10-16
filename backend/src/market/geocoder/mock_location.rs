use crate::{graphql::{geo::model::LatLng, reservations::{stops::model::{FormReservationStop, FormLatLng, FormReservationStopLocation}}}, market::strategy::driver::stop::reservation::location::model::Address};

pub struct MockLocation {
    pub id: &'static str,
    pub address: &'static str,
    pub lat_lng: (f64, f64),
}

macro_rules! define_latlng_const {
    ($name:ident, $lat:expr, $lng:expr) => {
        paste::item! {
            pub const [<$name _LATLNG>]: LatLng = LatLng {
                lat: $lat,
                lng: $lng,
            };
        }
    };
}

macro_rules! define_locations {
    ($($name:ident => $id:expr, $lat:expr, $lng:expr);+ $(;)?) => {
        $(
            pub const $name: MockLocation = MockLocation {
                id: $id,
                address: $id,
                lat_lng: ($lat, $lng),
            };

            define_latlng_const!($name, $lat, $lng);
        )+

        pub const ALL_LOCATIONS: &[MockLocation] = &[$($name),+];
    };
}

define_locations! {
    BENET_HALL => "Benet Hall", 34.677455852675024, -82.84019416252406;
    DOUTHIT => "Douthit", 34.68054375809933, -82.82993899496442;
    TIGER_BLVD => "Tiger Blvd", 34.691450, -82.837422;
    CSP => "CSP", 34.682813, -82.837402;
}

impl MockLocation {
    pub fn latlng(&self) -> FormLatLng {
        let (lat, lng) = self.lat_lng;
        FormLatLng::new(lat, lng)
    }

    pub fn stop(&self) -> FormReservationStopLocation {
        FormReservationStopLocation {
            place_id: Some(self.id.to_owned()),
            address: self.address.to_owned(),
            location: self.latlng(),
        }
    }

    pub fn address(&self) -> Address {
        Address::new(self.address.to_owned(), "MOCK".to_owned())
    }
}
