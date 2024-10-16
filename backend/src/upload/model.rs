use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct MediaUploadResponse {
    pub id: Uuid
}


