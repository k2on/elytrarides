use std::fmt;

use diesel::{AsExpression, FromSqlRow};
use diesel::backend::{Backend, RawValue};
use juniper::{GraphQLScalar, InputValue, ScalarValue};
use serde::{Serialize, Serializer, Deserialize, Deserializer};


use diesel::serialize;
use diesel::deserialize;
use diesel::sql_types::Text;



#[derive(Debug, PartialEq, Eq, Clone, AsExpression, FromSqlRow, GraphQLScalar)]
#[diesel(sql_type = Text)]
#[graphql(from_input_with = Self::from_input, transparent)]
pub struct Phone {
    number: String,
}

const MOCK_USER_PHONE_PREFIX: &str = "+1800200";

impl Phone {
    pub fn new(number: &str) -> Result<Phone, &'static str> {
        if Phone::is_valid(number) {
            Ok(Phone {
                number: number.to_string(),
            })
        } else {
            Err("Invalid phone number")
        }
    }

    fn is_valid(number: &str) -> bool {
        let re = regex::Regex::new(r"^\+1\d{10}$").unwrap();
        re.is_match(number)
    }

    pub fn is_mock(&self) -> bool {
        self.number.starts_with(MOCK_USER_PHONE_PREFIX)
    }

    pub fn to_string(&self) -> String {
        self.number.clone()
    }

    fn from_input<S>(v: &InputValue<S>) -> Result<Self, String>
    where
        S: ScalarValue
    {
        let str = v.as_string_value()
            .ok_or(format!("Error converting to string"))?;
        let phone = Self::new(str)?;
        Ok(phone)
    }
}

impl fmt::Display for Phone {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.number)
    }
}

impl Serialize for Phone {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.number)
    }
}

impl<'de> Deserialize<'de> for Phone {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Phone::new(&s).map_err(serde::de::Error::custom)
    }
}



impl<B: Backend> serialize::ToSql<Text, B> for Phone
where
    String: serialize::ToSql<Text, B>,
{
    fn to_sql<'b>(&'b self, out: &mut serialize::Output<'b, '_, B>) -> serialize::Result {
        <String as serialize::ToSql<Text, B>>::to_sql(&self.number, out)
    }
}

impl<B: Backend> deserialize::FromSql<Text, B> for Phone
where
    String: deserialize::FromSql<Text, B>,
{
    fn from_sql(bytes: RawValue<B>) -> deserialize::Result<Self> {
        <String as deserialize::FromSql<Text, B>>::from_sql(bytes).map(|phone| Phone::new(&phone).expect("Invalid phone number format"))
    }
}

