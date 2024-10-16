mod controller;
mod model;
use actix_web::web;

pub fn register_urls(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(
        web::scope("/upload")
            .service(web::resource("profile_image").route(web::post().to(controller::upload_profile_image)))
    );


}
