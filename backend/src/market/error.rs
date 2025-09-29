use thiserror::Error;

use crate::sms::ErrorTwillio;

#[derive(Error, Debug, Clone)]
pub enum ErrorMarket {
    #[error("No drivers for the event")]
    NoDrivers,
    #[error("No driver location was found")]
    NoDriverLocation,
    #[error("The driver was not found")]
    DriverNotFound,
    #[error("Reservation was not found in strategy")]
    NoReservation,
    #[error("There is no property assigned to the event")]
    NoEventProperty,
    #[error("Data not found")]
    DBError,
    #[error("KV error")]
    KVError,
    #[error("Mailbox error")]
    MailboxError,
    #[error("Redis error")]
    RedisError,
    #[error("No geocode results")]
    NoGeocodeResults,
    #[error("Geocoding failed")]
    GeocodingFailed,
    #[error("You can not preform this action with a destination")]
    HasDest,
    #[error("You can not preform this action without a destination")]
    NoDest,
    #[error("No reservations are picked up")]
    NoPickedUpReservation,
    #[error("The reservation is already assigned a driver")]
    HasDriver,
    #[error("The reservation was not found in the driver queue")]
    ReservationNotInStrategy,
    #[error("You can not preform this action on an event stop")]
    HasEvent,
    #[error("You can not preform this action on a dropoff reservation")]
    HasDropoff,
    #[error("You can not preform this action on a pickup reservation")]
    HasPickup,
    #[error("You can not cancel a reservation that has been picked up")]
    ReservationIsPickedUp,
    #[error("Twillio request failed")]
    TwillioError,
    #[error("Google maps error")]
    GoogleMapsError,
    #[error("Could not estimate for the route")]
    NoRoutes,
    #[error("No legs for the route")]
    NoRouteLegs,
    #[error("No vehicle for this driver")]
    NoDriverVehicle,
    #[error("Bad Value")]
    BadValue(String)
}

impl From<diesel::result::Error> for ErrorMarket {
    fn from(_: diesel::result::Error) -> Self {
        ErrorMarket::DBError
    }
}

impl From<actix::MailboxError> for ErrorMarket {
    fn from(_: actix::MailboxError) -> Self {
        ErrorMarket::MailboxError
    }
}

impl From<redis::RedisError> for ErrorMarket {
    fn from(_: redis::RedisError) -> Self {
        ErrorMarket::RedisError
    }
}

impl From<ErrorTwillio> for ErrorMarket {
    fn from(_: ErrorTwillio) -> Self {
        ErrorMarket::TwillioError
    }
}

impl From<kv::Error> for ErrorMarket {
    fn from(_: kv::Error) -> Self {
        ErrorMarket::KVError
    }
}

impl From<google_maps::GoogleMapsError> for ErrorMarket {
    fn from(_: google_maps::GoogleMapsError) -> Self {
        ErrorMarket::GoogleMapsError
    }
}
