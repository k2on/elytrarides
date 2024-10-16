use juniper::{graphql_value, FieldError, FieldResult};
use reqwest::Url;

use crate::graphql::context::Context;


pub struct VehicleQuery;

impl VehicleQuery {
    pub fn new() -> Self {
        Self
    }
}

fn get_base_url() -> Url {
    Url::parse("https://raw.githubusercontent.com/k2on/BasedCarAPI/main/data/").expect("Could not parse URL")
}

#[juniper::graphql_object(Context = Context)]
impl VehicleQuery {

    #[graphql(description = "Get the avaliable years for a vehicle")]
    async fn years(ctx: &Context) -> FieldResult<Vec<String>> {
        if !ctx.validate_is_authed().await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        if ctx.is_mock {
            let results = vec![
                String::from("2024"),
                String::from("2023"),
                String::from("2022"),
                String::from("2021"),
                String::from("2020"),
                String::from("2019"),
                String::from("2018"),
                String::from("2017"),
                String::from("2016"),
                String::from("2015"),
                String::from("2014"),
                String::from("2013"),
                String::from("2012"),
                String::from("2011"),
                String::from("2010"),
                String::from("2009"),
                String::from("2008"),
                String::from("2007"),
                String::from("2006"),
                String::from("2005"),
                String::from("2004"),
                String::from("2003"),
                String::from("2002"),
                String::from("2001"),
                String::from("2000"),
            ];

            return Ok(results);
        }

        let base = get_base_url();
        let url = base.join("years.json").expect("Could not append URL");
        let response = reqwest::get(url).await?;
        let years: Vec<String> = response.json().await?;
        Ok(years)
    }

    #[graphql(description = "Get the avaliable makes for a year")]
    async fn makes(ctx: &Context, year: String) -> FieldResult<Vec<String>> {
        if !ctx.validate_is_authed().await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        if ctx.is_mock {
            let results = vec![
                String::from("Infiniti"),
                String::from("Ford"),
                String::from("Tesla"),
            ];

            return Ok(results);
        }

        let base = get_base_url();
        let url = base.join(&format!("years/{year}/makes.json")).expect("Could not append URL");
        let response = reqwest::get(url).await?;
        let makes: Vec<String> = response.json().await?;
        Ok(makes)
    }

    #[graphql(description = "Get the avaliable models for a make and year")]
    async fn models(ctx: &Context, year: String, make: String) -> FieldResult<Vec<String>> {
        if !ctx.validate_is_authed().await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        if ctx.is_mock {
            let results = vec![
                String::from("G37"),
                String::from("Q50"),
                String::from("Q60"),
            ];

            return Ok(results);
        }

        let base = get_base_url();
        let url = base.join(&format!("years/{year}/{make}/models.json")).expect("Could not append URL");
        let response = reqwest::get(url).await?;
        let models: Vec<String> = response.json().await?;
        Ok(models)
    }

    #[graphql(description = "Get the colors for a model")]
    async fn colors(ctx: &Context, year: String, make: String, model: String) -> FieldResult<Vec<String>> {
        if !ctx.validate_is_authed().await {
            return Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Not authorized" }),
            ));
        }

        if ctx.is_mock {
            let results = vec![
                String::from("Red"),
                String::from("Black"),
                String::from("Blue"),
            ];

            return Ok(results);
        }

        let base = get_base_url();
        let url = base.join(&format!("years/{year}/{make}/{model}/colors.json")).expect("Could not append URL");
        let response = reqwest::get(url).await?;
        let colors: Vec<String> = response.json().await?;
        Ok(colors)
    }
}
