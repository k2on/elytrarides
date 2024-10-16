use crate::graphql::geo::model::LatLng;

use super::model::MockLocation;

pub fn get_mock_locations() -> Vec<MockLocation> {
    vec![
        MockLocation {
            main: "Benet Hall".to_owned(),
            sub: "Clemson, SC".to_owned(),
            place_id: "benet".to_owned(),
            location: LatLng {
                lat: 10.0,
                lng: 10.0,
            },
        },
        MockLocation {
            main: "Cope Hall".to_owned(),
            sub: "Clemson, SC".to_owned(),
            place_id: "cope".to_owned(),
            location: LatLng {
                lat: 10.0,
                lng: 10.0,
            },
        },
        MockLocation {
            main: "Douthit Hills".to_owned(),
            sub: "Clemson, SC".to_owned(),
            place_id: "douthit".to_owned(),
            location: LatLng {
                lat: 10.0,
                lng: 10.0,
            },
        },
        MockLocation {
            main: "Lever Hall".to_owned(),
            sub: "Clemson, SC".to_owned(),
            place_id: "lever".to_owned(),
            location: LatLng {
                lat: 10.0,
                lng: 10.0,
            },
        },
    ]
}


