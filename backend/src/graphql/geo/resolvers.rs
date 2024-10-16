use juniper::{graphql_value, FieldError, FieldResult};
use uuid::Uuid;

use crate::graphql::{context::Context, geo::mock::get_mock_locations, events::messages::EventLocationGet};

use super::model::{GeocodeResult, LatLng, SearchResult};

pub struct GeoQuery;

impl GeoQuery {
    pub fn new() -> Self {
        Self
    }
}

#[juniper::graphql_object(Context = Context)]
impl GeoQuery {
    #[graphql(description = "Search for a location")]
    async fn search(ctx: &Context, id_event: Option<Uuid>, query: String) -> FieldResult<Vec<SearchResult>> {
        if !ctx.validate_is_authed().await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        if ctx.is_mock {
            let results = get_mock_locations()
                .iter()
                .filter_map(|res| {
                    if res.main.to_lowercase().contains(&query.to_lowercase()) {
                        Some(SearchResult {
                            main: res.main.to_owned(),
                            sub: res.sub.to_owned(),
                            place_id: res.place_id.to_owned(),
                        })
                    } else {
                        None
                    }
                })
                .collect();
            return Ok(results);
        }

        let result = if let Some(id) = &id_event {
            let property = ctx.db.send(EventLocationGet { id: id.to_owned() })
                .await
                .expect("Could not connect to db")
                .expect("Could not find event")
                .expect("Could not find location for event");

            let location = google_maps::LatLng::try_from_f64(property.location_lat, property.location_lng).unwrap();
            let radius_meters = 10_000u32;
            ctx.google_maps_client
                .place_autocomplete(query.to_owned())
                .with_strict_location_and_radius(location, radius_meters)
                .execute()
                .await
        } else {
            ctx.google_maps_client
                .place_autocomplete(query.to_owned())
                .execute()
                .await
        };

        match result {
            Ok(result) => {
                let results = result
                    .predictions
                    .iter()
                    .map(SearchResult::new)
                    .collect();

                Ok(results)
            }
            Err(err) => {
                println!("{}", err);
                Err(FieldError::new(
                    "Internal error",
                    graphql_value!({ "internal_error": "Search failed" }),
                ))
            }
        }
    }

    #[graphql(description = "Get a locations coordinates from its placeId")]
    async fn geocode(ctx: &Context, place_id: String) -> FieldResult<GeocodeResult> {
        if !ctx.validate_is_authed().await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        if ctx.is_mock {
            let locations = get_mock_locations();
            let res = locations.iter().find(|loc| loc.place_id.eq(&place_id));
            return match &res {
                Some(loc) => Ok(GeocodeResult {
                    location: loc.location.clone(),
                }),
                None => Err(FieldError::new(
                    "No results",
                    graphql_value!({ "internal_error": "No results were found for the placeId" }),
                )),
            };
        }

        match ctx
            .google_maps_client
            .geocoding()
            .with_place_id(&place_id)
            .execute()
            .await
        {
            Ok(response) => match response.results.first() {
                Some(result) => Ok(GeocodeResult {
                    location: LatLng {
                        lat: result
                            .geometry
                            .location
                            .lat
                            .try_into()
                            .expect("Could not convert to f64"),
                        lng: result
                            .geometry
                            .location
                            .lng
                            .try_into()
                            .expect("Could not convert to f64"),
                    },
                }),
                None => Err(FieldError::new(
                    "No results",
                    graphql_value!({ "internal_error": "No results were found for the placeId" }),
                )),
            },
            Err(err) => {
                println!("{}", err);
                Err(FieldError::new(
                    "Internal error",
                    graphql_value!({ "internal_error": "Geocoding failed" }),
                ))
            }
        }
    }
}
