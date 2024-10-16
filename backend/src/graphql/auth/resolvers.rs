use crate::{graphql::context::Context, types::phone::Phone};

use juniper::{FieldResult, graphql_value, FieldError};

pub struct AuthMutation;

impl AuthMutation {
    pub fn new() -> Self {
        Self
    }
}

const MOCK_USER_CODE: &str = "000000";

#[juniper::graphql_object(Context = Context)]
impl AuthMutation {
    #[graphql(description = "Send OTP to phone")]
    async fn send_otp(ctx: &Context, phone: Phone) -> FieldResult<bool> {
        if phone.is_mock() {
            return Ok(true)
        }
        match ctx.twilio.code_send(&phone.to_string()).await {
            Ok(_) => Ok(true),
            Err(_) => Err(FieldError::new("Error sending code", graphql_value!({ "internal_error": "Error sending code" }))),
        }
    }

    #[graphql(description = "Verify OTP and return JWT")]
    async fn verify_otp(ctx: &Context, phone: Phone, code: String) -> FieldResult<String> {
        if phone.is_mock() {
            return if code == MOCK_USER_CODE {
                let token = ctx.jwt.sign(&phone);
                Ok(token)
            } else {
                Err(FieldError::new("Error validating code", graphql_value!({ "unauthorized": "Invaild code" })))
            }
        }
        match ctx.twilio.code_verify(&phone.to_string(), &code).await {
            Ok(resp) => {
                match resp.valid {
                    true => {
                        let token = ctx.jwt.sign(&phone);
                        Ok(token)
                    },
                    _ => Err(FieldError::new("Error validating code", graphql_value!({ "unauthorized": "Invaild code" }))),
                }
            },
            Err(err) => {
                println!("Error: {}", err);
                Err(FieldError::new("Error getting users", graphql_value!({ "internal_error": "Error getting users" })))
            }
        }
    }
}

