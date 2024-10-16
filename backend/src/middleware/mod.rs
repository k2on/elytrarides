use std::future::{ready, Ready};

use actix_web::{error::ErrorUnauthorized, http, web, Error as ErrorActixWeb, FromRequest};
use jsonwebtoken::{decode, errors::Error as ErrorJwt, DecodingKey, TokenData, Validation};
use serde::{Deserialize, Serialize};

use crate::{db_util::AppState, types::phone::Phone};

#[derive(Serialize, Deserialize)]
pub struct AuthToken {
    pub phone: Phone,
}

#[derive(Serialize, Deserialize)]
pub struct UserId {
    pub phone: Option<Phone>,
}

#[derive(Serialize, Deserialize)]
pub struct Claims {
    pub phone: Phone,
    pub exp: usize,
}

impl FromRequest for AuthToken {
    type Error = ErrorActixWeb;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &actix_web::HttpRequest, _: &mut actix_web::dev::Payload) -> Self::Future {
        let auth = req.headers().get(http::header::AUTHORIZATION);
        if auth.is_none() {
            return ready(Err(ErrorUnauthorized("No token found")));
        }

        let token = auth.unwrap().to_str().unwrap_or("");
        if token.is_empty() {
            return ready(Err(ErrorUnauthorized("No token found")));
        }

        let state = req.app_data::<web::Data<AppState>>().unwrap();
        let secret = &state.jwt_secret;

        let key = &DecodingKey::from_secret(secret.as_str().as_ref());
        let validation = &Validation::new(jsonwebtoken::Algorithm::HS256);
        let decode: Result<TokenData<Claims>, ErrorJwt> = decode(token, key, validation);

        match decode {
            Ok(token) => ready(Ok(AuthToken {
                phone: token.claims.phone,
            })),
            Err(_err) => ready(Err(ErrorUnauthorized("Unauthorized"))),
        }
    }
}

impl FromRequest for UserId {
    type Error = ErrorActixWeb;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &actix_web::HttpRequest, _: &mut actix_web::dev::Payload) -> Self::Future {
        let auth = req.headers().get(http::header::AUTHORIZATION);
        if auth.is_none() { return ready(Ok(UserId { phone: None })) }

        let token = auth.unwrap().to_str().unwrap_or("");
        if token.is_empty() { return ready(Ok(UserId { phone: None })) }

        let state = req.app_data::<web::Data<AppState>>().unwrap();
        let secret = &state.jwt_secret;

        let key = &DecodingKey::from_secret(secret.as_str().as_ref());
        let validation = &Validation::new(jsonwebtoken::Algorithm::HS256);
        let decode: Result<TokenData<Claims>, ErrorJwt> = decode(token, key, validation);

        match decode {
            Ok(token) => ready(Ok(UserId {
                phone: Some(token.claims.phone),
            })),
            Err(_err) => ready(Ok(UserId { phone: None })),
        }
    }
}

