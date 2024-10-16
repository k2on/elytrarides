use std::fs::File;

use actix::Addr;
use actix_multipart::Multipart;
use actix_web::{web::Data, HttpResponse};
use sanitize_filename::sanitize;
use futures::{StreamExt, TryStreamExt};
use uuid::Uuid;
use std::io::Write;

use crate::{db_util::{AppState, DBActor}, middleware::AuthToken, graphql::media::messages::MediaUpdate};

use super::model::MediaUploadResponse;

pub async fn upload_profile_image(state: Data<AppState>, auth: AuthToken, mut payload: Multipart) -> Result<HttpResponse, actix_web::Error> {
    if let Ok(Some(mut field)) = payload.try_next().await {
        let content_disposition = field.content_disposition();
        let filename = content_disposition.get_filename().unwrap();
        let id = Uuid::new_v4();
        let filepath = format!("/var/www/images/{}.jpg", id);
        let base = if cfg!(debug_assertions) { "http://localhost:8000" } else { "https://elytra.to" };
        let url = format!("{}/images/{}.jpg", base, id);

        let mut f = File::create(filepath.clone())?;

        while let Some(chunk) = field.next().await {
            let data = chunk.map_err(|e| {
                actix_web::error::ErrorBadRequest(format!("IO Error: {:?}", e))
            })?;
            f.write_all(&data).map_err(|e| actix_web::error::ErrorInternalServerError(e))?;
        }

        let db: Addr<DBActor> = state.as_ref().db.clone();
        match db.send(MediaUpdate {
            id,
            uploader: auth.phone,
            id_org: None,
            media_type: "profile_image".to_owned(),
            url: url.clone()
        }).await {
            Ok(Ok(_)) => Ok(HttpResponse::Ok().json(MediaUploadResponse { id })),
            _ => Err(actix_web::error::ErrorBadRequest("No image given"))
        }
    } else {
        Err(actix_web::error::ErrorBadRequest("No image given"))
    }
}
