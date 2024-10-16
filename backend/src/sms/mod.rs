use std::io::{Error, ErrorKind};

use reqwest::{Client, StatusCode};
use serde::Deserialize;
use thiserror::Error;

use crate::types::phone::Phone;

#[derive(Debug, Clone)]
pub struct ClientTwilio {
    account_sid: String,
    auth_token: String,
    reqwest_client: Client,
}

const SERVICE_ID_VERFIY: &str = "";
const SERVICE_ID_SMS: &str = "";
const MESSAGING_SERVICE_ID: &str = "";
const URL_BASE_VERIFY: &str = "https://verify.twilio.com/v2/";
const URL_BASE_SMS: &str = "https://api.twilio.com/2010-04-01/";
const ENDPOINT_VERIFICATIONS: &str = "Verifications";
const ENDPOINT_VERIFICATION_CHECK: &str = "VerificationCheck";

#[derive(Debug, Deserialize)]
pub struct SendResponse {
    pub status: String,
    pub valid: bool,
}

#[derive(Debug, Deserialize)]
pub struct VerifyResponse {
    pub status: String,
    pub valid: bool,
}

#[derive(Debug, Deserialize)]
pub struct SMSResponse {
    pub status: String,
}


#[derive(Error, Debug, Clone)]
pub enum ErrorTwillio {
    #[error("SMS message failed")]
    SMSFailed,
}


impl ClientTwilio {
    pub fn new(account_sid: &str, auth_token: &str) -> Self {
        let reqwest_client = Client::new();
        ClientTwilio {
            account_sid: account_sid.to_owned(),
            auth_token: auth_token.to_owned(),
            reqwest_client,
        }
    }
    
    pub async fn post_message(&self, to: &Phone, message: &str) -> Result<SMSResponse, ErrorTwillio> {
        let is_mock = to.is_mock();
        println!("Sending SMS to {to} with message '{message}, ismock: {is_mock}'");
        if is_mock { return Ok(SMSResponse {status: "ok".to_owned()}); }
        let phone = to.clone().to_string();

        let url = format!("{}Accounts/{}/Messages.json", URL_BASE_SMS, SERVICE_ID_SMS);
        let params = vec![
            ("MessagingServiceSid", MESSAGING_SERVICE_ID),
            ("To", &phone),
            ("Body", message),
        ];
        match self
            .reqwest_client
            .post(url)
            .form(&params)
            .basic_auth(&self.account_sid, Some(&self.auth_token))
            .send()
            .await
        {
            Ok(resp) => {
                println!("{:?}", resp);
                match resp.status() {
                    StatusCode::OK | StatusCode::CREATED => Ok(resp.json::<SMSResponse>().await.unwrap()),
                    StatusCode::NOT_FOUND => Err(ErrorTwillio::SMSFailed),
                    _ => {
                        println!("twilio err: {:?}", resp);
                        Err(ErrorTwillio::SMSFailed)
                    }
                }
            }
            Err(e) => {
                print!("err: {:?}", e);
                Err(ErrorTwillio::SMSFailed)
            }
        }
    }

    async fn post<T>(&self, endpoint: &str, params: Vec<(&str, &str)>) -> Result<T, Error>
    where
        T: for<'de> Deserialize<'de>,
    {
        let url_service = format!("{}Services/{}/", URL_BASE_VERIFY, SERVICE_ID_VERFIY);
        let url = url_service + endpoint;
        match self
            .reqwest_client
            .post(url)
            .form(&params)
            .basic_auth(&self.account_sid, Some(&self.auth_token))
            .send()
            .await
        {
            Ok(resp) => {
                println!("{:?}", resp);
                match resp.status() {
                    StatusCode::OK | StatusCode::CREATED => Ok(resp.json::<T>().await.unwrap()),
                    StatusCode::NOT_FOUND => Err(Error::new(ErrorKind::NotFound, "invaid code")),
                    _ => {
                        println!("twilio err: {:?}", resp);
                        Err(Error::new(ErrorKind::Other, "Bad sms request"))
                    }
                }
            }
            Err(e) => {
                print!("err: {:?}", e);
                Err(Error::new(ErrorKind::Other, "Sms request failed"))
            }
        }
    }

    pub async fn code_send(&self, number: &str) -> Result<SendResponse, Error> {
        self.post(
            ENDPOINT_VERIFICATIONS,
            vec![("To", number), ("Channel", "sms")],
        )
        .await
    }

    pub async fn code_verify(&self, number: &str, code: &str) -> Result<VerifyResponse, Error> {
        self.post(
            ENDPOINT_VERIFICATION_CHECK,
            vec![("To", number), ("Code", code)],
        )
        .await
    }
}
