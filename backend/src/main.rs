use std::sync::Arc;

use actix::SyncArbiter;
use actix_cors::Cors;
use actix_web::middleware::Logger;
use actix_web::web;
use actix_web::{web::Data, App, HttpServer};
use dotenv::dotenv;
use google_maps::GoogleMapsClient;

use backend::db_util::{get_pool, AppState, DBActor};

use backend::estimator::Estimator;
use backend::market::Market;
use backend::sms::ClientTwilio;
use backend::graphql::handlers::{graphql, graphql_playground, subscriptions};
use backend::graphql::create_schema;



#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Starting backend");
    std::env::set_var("RUST_LOG", "debug");
    env_logger::init();

    dotenv().ok();
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = get_pool(&db_url);
    let db_addr = SyncArbiter::start(5, move || DBActor(pool.clone()));

    let server_host = "0.0.0.0";
    let server_port = 8080;

    let account_sid = std::env::var("TWILIO_ACCOUNT_SID").expect("TWILIO_ACCOUNT_SID must be set");
    let auth_token = std::env::var("TWILIO_AUTH_TOKEN").expect("TWILIO_AUTH_TOKEN must be set");
    let twilio = ClientTwilio::new(&account_sid, &auth_token);

    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let google_secret = std::env::var("GOOGLE_SECRET").expect("GOOGLE_SECRET must be set");
    let google_maps_client = GoogleMapsClient::new(&google_secret);

    let cfg = kv::Config::new("./kv");
    let kv = kv::Store::new(cfg).unwrap();

    let schema = create_schema();

    // let is_mock = false;

    let _addr = Estimator::new(Arc::new(Market::new(db_addr.clone(), kv.clone(), google_maps_client.clone(), twilio.clone())));   

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .wrap(Cors::permissive()) // FIXME: figure out the right perms
            .app_data(schema.clone())
            .service(web::resource("/subscriptions").route(web::get().to(subscriptions)))
            .service(
                web::resource("/graphql")
                    .route(web::post().to(graphql))
                    .route(web::get().to(graphql)),
            )
            .configure(backend::upload::register_urls)
            .route("/playground", web::get().to(graphql_playground))
            .app_data(Data::new(AppState {
                schema: schema.clone(),
                db: db_addr.clone(),
                twilio: twilio.clone(),
                jwt_secret: jwt_secret.clone(),
                google_maps_client: google_maps_client.clone(),
                kv: kv.clone(),
                is_mock: false,
            }))
    })
    .bind((server_host, server_port))?
    .run()
    .await
}
