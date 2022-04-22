use borsh::{BorshSerialize, BorshDeserialize};
use chrono::{DateTime, NaiveDateTime, Utc, Duration};


#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct Asset {
    pub code: String,
    pub name: String,
    pub token_address: String,
    pub price_usd: Option<u128>,
    pub iv: Option<u128>,
}

#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum InstrumentType {
    Option,
    Future
}

#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum OptionType {
    Call,
    Put
}

#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct OptionData {
    pub strike: u32,
    pub option_type: OptionType,
    pub quantity: u32,
    pub expiration: u128,
}

#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct FutureData {
    pub price_usd: u128,
    pub size: u32,
    pub continuous: bool,
    pub start_timestamp: i64,
    pub duration_secs: i64,
}

pub trait UTCBorshSerializedTime {
    fn utc_time(&self) -> DateTime<Utc>;
}

impl UTCBorshSerializedTime for FutureData{
    fn utc_time(&self) -> DateTime<Utc> {
        DateTime::<Utc>::from_utc(NaiveDateTime::from_timestamp(
            self.start_timestamp,
            0), Utc)
    }
}

impl FutureData {

    /// Calculates the expiration date of the contract - if it's continuous,
    /// this will be the next upcoming expiration, or otherwise it'll be a static
    /// start_utc+duration_secs
    ///
    /// ```
    pub fn expiration(&self) -> DateTime<Utc> {
        let utc_time = self.utc_time();
        let duration = Duration::seconds(self.duration_secs);
        return if self.continuous {
            let now = Utc::now();
            let time_since = now - utc_time;
            let offset_duration = time_since.num_seconds() % duration.num_seconds();
            now+(duration-Duration::seconds(offset_duration))
        } else {
            utc_time + duration
        }
    }
}

#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum InstrumentData {
    OptionData(OptionData),
    FutureData(FutureData),
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct Instrument {
    pub id: String,
    pub instrument_type: InstrumentType,
    pub data: InstrumentData,
    pub underlying: Asset,
}


#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum OrderSide {
    Buy,
    Sell
}

#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum OrderType {
    Market,
    Limit
}

#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum OrderStatus {
    Placed,
    Filled,
    Cancelled,
    Settled,
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct OrderData {
    pub order_id: String,
    pub instrument: Instrument,
    pub status: OrderStatus,
    pub ba: u128,
    pub order_type: OrderType,
    pub limit: Option<u128>,
}