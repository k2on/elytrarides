use actix_web::{web, Error, HttpRequest, HttpResponse};
use juniper_actix::{graphql_handler, playground_handler, subscriptions::subscriptions_handler};
use juniper_graphql_ws::ConnectionConfig;

use crate::{
    db_util::AppState,
    middleware::UserId,
};

use super::context::Context;

pub async fn graphql(
    data: web::Data<AppState>,
    req: HttpRequest,
    payload: web::Payload,
    user_id: UserId,
) -> Result<HttpResponse, Error> {
    let schema = data.schema.clone();
    // Clone the data you want to pass to the context
    let db = data.db.clone();
    let twilio = data.twilio.clone();
    let jwt_secret = data.jwt_secret.clone();
    let google_maps_client = data.google_maps_client.clone();
    let kv = data.kv.clone();
    let is_mock = data.is_mock;

    let ctx = Context::new(
        db,
        twilio,
        jwt_secret,
        google_maps_client,
        kv,
        user_id.phone,
        is_mock,
    );

    let res = graphql_handler(&schema, &ctx, req, payload).await;
    res
}

pub async fn subscriptions(data: web::Data<AppState>, req: HttpRequest, stream: web::Payload, user_id: UserId) -> Result<HttpResponse, Error> {
    let schema = data.schema.clone();
    // Clone the data you want to pass to the context
    let db = data.db.clone();
    let twilio = data.twilio.clone();
    let jwt_secret = data.jwt_secret.clone();
    let google_maps_client = data.google_maps_client.clone();
    let kv = data.kv.clone();
    let is_mock = data.is_mock;


    let ctx = Context::new(
        db,
        twilio,
        jwt_secret,
        google_maps_client,
        kv,
        user_id.phone,
        is_mock,
    );

    let config = ConnectionConfig::new(ctx);

    subscriptions_handler(req, stream,schema, config).await
}

pub async fn graphql_playground() -> Result<HttpResponse, Error> {
    playground_handler("/", Some("/subscriptions")).await
}
