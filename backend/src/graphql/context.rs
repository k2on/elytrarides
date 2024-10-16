use actix::Addr;
use kv::Store;
use google_maps::GoogleMapsClient;
use std::str::FromStr;
use uuid::Uuid;

use crate::{
    sms::ClientTwilio,
    db_util::DBActor,
    jwt::JWT,
    r#const::ADMIN_ORG_ID, market::{Market, strategy::model::IdEventDriver}, types::phone::Phone
};

use super::{
    memberships::messages::UserMembership,
    reservations::{messages::ReservationGet, Reservation},
    users::{messages::UserGet, User}, drivers::{messages::EventDriverGet, Driver}, events::messages::EventGet
};

pub struct Context {
    pub db: Addr<DBActor>,
    pub twilio: ClientTwilio,
    pub jwt: JWT,
    pub google_maps_client: GoogleMapsClient,
    pub user: Option<UserCtx>,
    pub is_mock: bool,
    pub market: Market,
}

#[derive(Debug, Clone)]
pub struct UserCtx {
    pub phone: Phone,
}

impl Context {
    pub fn new(
        db: Addr<DBActor>,
        twilio: ClientTwilio,
        jwt_secret: String,
        google_maps_client: GoogleMapsClient,
        kv: Store,
        user_phone: Option<Phone>,
        is_mock: bool,
    ) -> Self {
        Self {
            db: db.clone(),
            twilio: twilio.clone(),
            jwt: JWT(jwt_secret),
            google_maps_client: google_maps_client.clone(),
            user: user_phone.map(|phone| UserCtx { phone }),
            is_mock,
            market: if !is_mock { Market::new(db, kv, google_maps_client, twilio) } else { Market::mock(db, kv) },
        }
    }

    pub fn as_user(&self, phone: Phone) -> Self {
        Self {
            db: self.db.clone(),
            twilio: self.twilio.clone(),
            jwt: self.jwt.clone(),
            google_maps_client: self.google_maps_client.clone(),
            is_mock: self.is_mock,
            market: self.market.clone(),
            user: Some(UserCtx { phone }),
        }
    }

    pub fn phone(&self) -> Phone {
        self.user.as_ref().expect("No user").phone.clone()
    }

    async fn validate_member_flags(&self, id_org: Uuid, flag: i32) -> bool {
        // TODO: Use flags in the JWT for permissions
        match &self.user {
            Some(user) => {
                let res = self
                    .db
                    .send(UserMembership {
                        phone: user.phone.clone(),
                        id_org,
                    })
                    .await;
                match res {
                    Ok(Ok(membership)) => membership.flags & flag != 0,
                    _ => false,
                }
            }
            None => false,
        }
    }

    pub async fn validate_is_member(&self, id_org: Uuid) -> bool {
        self.validate_member_flags(id_org, 1).await
    }

    pub async fn validate_is_driver(&self, id_org: Uuid) -> bool {
        self.validate_member_flags(id_org, 2).await
    }

    pub async fn validate_is_admin(&self, id_org: Uuid) -> bool {
        self.validate_member_flags(id_org, 4).await
    }

    pub async fn validate_is_new_member(&self, id_org: Uuid) -> bool {
        self.validate_member_flags(id_org, 8).await
    }

    pub async fn validate_is_superuser(&self) -> bool {
        self.validate_is_admin(Uuid::from_str(ADMIN_ORG_ID).expect("Could not parse admin org id"))
            .await
    }

    pub async fn validate_is_authed(&self) -> bool {
        self.user.is_some()
    }

    pub async fn validate_own_user(&self, phone: &Phone) -> bool {
        self.user.is_some() && self.phone().eq(phone)
    }

    pub async fn validate_owns_reservation(&self, id: Uuid) -> bool {
        match (self.validate_is_superuser().await, self.user.clone()) {
            (true, _) => true,
            (_, Some(user)) => match self.db.send(ReservationGet { id }).await {
                Ok(Ok(db_reservation)) => {
                    let reservation: Reservation = db_reservation.into();
                    reservation.reserver == user.phone
                }
                _ => false,
            },
            _ => false,
        }
    }

    pub async fn validate_is_driver_for_event(&self, id_event: &Uuid, id_driver: &IdEventDriver) -> bool {
        match (self.validate_is_superuser().await, self.user.clone()) {
            (true, _) => true,
            (_, Some(user)) => match self.db.send(EventDriverGet { id: *id_driver }).await {
                Ok(Ok(db_driver)) => {
                    let driver: Driver = db_driver.into();
                    if driver.phone == user.phone && driver.id_event.eq(id_event) { return true; }
                    match self.db.send(EventGet { id: id_event.clone() }).await {
                        Ok(Ok(db_event)) => {
                            self.validate_is_admin(db_event.id_org).await
                        }
                        _ => false,
                    }
                }
                _ => false,
            }
            _ => false,
        }
    }

    pub async fn validate_is_driver_able_to_accept_reservation(&self, id_driver: &IdEventDriver, id_reservation: &Uuid) -> bool {
        match (self.validate_is_superuser().await, self.user.clone()) {
            (true, _) => true,
            (_, Some(_)) => match self.db.send(ReservationGet { id: id_reservation.to_owned() }).await {
                Ok(Ok(reservation)) => match self.market.event.list_drivers(&reservation.id_event).await { // maybe cache this
                    Ok(drivers) => drivers.iter().any(|driver| driver.id.eq(id_driver)),
                    _ => false,
                }
                _ => false,
            }
            _ => false,
        }
    }

    pub async fn user_get(&self, phone: &Phone) -> User {
        match self
            .db
            .send(UserGet {
                phone: phone.to_owned(),
            })
            .await
        {
            Ok(Ok(result)) => {
                let user: User = result.into();
                user
            }
            _ => User::anonymous(phone),
        }
    }

}

impl juniper::Context for Context {}
