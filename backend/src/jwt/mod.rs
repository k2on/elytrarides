use chrono::{Utc, Duration};
use jsonwebtoken::{EncodingKey, errors::Error as ErrorJwt, Header, DecodingKey, Validation, decode, TokenData};

use crate::{middleware::Claims, types::phone::Phone};

#[derive(Debug, Clone)]
pub struct JWT(pub String);

impl JWT {
    pub fn sign(&self, phone: &Phone) -> String {
        let secret = self.0.as_bytes();
        let key = &EncodingKey::from_secret(secret);
        let exp: usize = (Utc::now() + Duration::days(365)).timestamp() as usize;
        let jwt = Claims { phone: phone.to_owned(), exp };
        jsonwebtoken::encode(&Header::default(), &jwt, &key).unwrap()
    }

    pub fn decode(&self, token: String) -> Result<Phone, String> {
        let secret = self.0.as_bytes();
        let key = &DecodingKey::from_secret(secret);
        let validation = &Validation::new(jsonwebtoken::Algorithm::HS256);
        let decode: Result<TokenData<Claims>, ErrorJwt> = decode(&token, key, validation);

        match decode {
            Ok(token) => Ok(token.claims.phone),
            Err(_err) => Err("Invalid token".to_owned()),
        }

    }
}
