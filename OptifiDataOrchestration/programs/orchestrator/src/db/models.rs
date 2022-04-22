use super::schema::*;
use crate::solana::serum::load_serum_market::BidsAsksContext;
use chrono::{NaiveDate, NaiveDateTime, Utc};
use std::time::SystemTime;

#[derive(Queryable, Identifiable)]
pub struct Asset {
    pub id: i32,
    pub code: String,
    pub name: String,
}

#[derive(Insertable)]
#[table_name = "assets"]
pub struct NewAsset {
    pub code: String,
    pub name: String,
}

#[derive(Queryable, Identifiable)]
pub struct InstrumentType {
    pub(crate) id: i32,
    pub(crate) code: String,
}

#[derive(Insertable)]
#[table_name = "instrument_types"]
pub struct NewInstrumentType {
    pub code: String,
}

#[derive(Queryable, Identifiable)]
pub struct ExpiryType {
    pub(crate) id: i32,
    pub(crate) code: String,
}

#[derive(Insertable)]
#[table_name = "expiry_types"]
pub struct NewExpiryType {
    pub code: String,
}

#[derive(Queryable, Identifiable, Clone)]
pub struct Program {
    pub id: i32,
    pub address: String,
    pub network: i32,
}

#[derive(Queryable, Identifiable, Associations)]
#[belongs_to(Program)]
pub struct Exchange {
    pub id: i32,
    pub program_id: i32,
    pub exchange_uuid: String,
    pub address: String,
}

#[derive(Insertable)]
#[table_name = "exchanges"]
pub struct NewExchange {
    pub program_id: i32,
    pub exchange_uuid: String,
    pub address: String,
}

#[derive(Clone, Queryable, Identifiable, Associations)]
#[belongs_to(Exchange)]
pub struct SerumMarket {
    pub id: i32,
    pub exchange_id: i32,
    pub address: String,
}

#[derive(Insertable)]
#[table_name = "serum_markets"]
pub struct NewSerumMarket {
    pub(crate) exchange_id: i32,
    pub(crate) address: String,
}

#[derive(Queryable, Identifiable, Associations)]
#[belongs_to(SerumMarket)]
#[belongs_to(Exchange)]
pub struct OptifiMarket {
    pub id: i32,
    pub exchange_id: i32,
    pub serum_market_id: i32,
    pub address: String,
    pub short_token_address: String,
    pub long_token_address: String,
    pub optifi_market_id: i32,
}

#[derive(Insertable)]
#[table_name = "optifi_markets"]
pub struct NewOptifiMarket {
    pub exchange_id: i32,
    pub serum_market_id: i32,
    pub address: String,
    pub short_token_address: String,
    pub long_token_address: String,
    pub optifi_market_id: i32,
}

#[derive(Queryable, Associations, Identifiable)]
#[belongs_to(Exchange)]
#[belongs_to(Asset)]
#[belongs_to(InstrumentType)]
#[belongs_to(ExpiryType)]
pub struct Chain {
    pub id: i32,
    pub exchange_id: i32,
    pub asset_id: i32,
    pub is_trading: bool,
    pub instrument_type_id: i32,
    pub expiration: Option<NaiveDateTime>,
    pub expiry_type_id: i32,
}

#[derive(Insertable)]
#[table_name = "chains"]
pub struct NewChain {
    pub exchange_id: i32,
    pub asset_id: i32,
    pub is_trading: bool,
    pub instrument_type_id: i32,
    pub expiration: NaiveDateTime,
    pub expiry_type_id: i32,
}

#[derive(Queryable, Associations, Identifiable)]
#[belongs_to(InstrumentType)]
#[belongs_to(Chain)]
#[belongs_to(ExpiryType)]
#[belongs_to(OptifiMarket, foreign_key = "market_id")]
pub struct Instrument {
    pub id: i32,
    pub address: String,
    pub instrument_type_id: i32,
    pub chain_id: i32,
    pub strike: f64,
    pub expiration: Option<NaiveDateTime>,
    pub expiry_type_id: i32,
    pub start: NaiveDate,
    pub contract_size: f64,
    pub market_id: i32,
}

#[derive(Insertable)]
#[table_name = "instruments"]
pub struct NewInstrument {
    pub address: String,
    pub instrument_type_id: i32,
    pub chain_id: i32,
    pub strike: f64,
    pub expiration: Option<NaiveDateTime>,
    pub expiry_type_id: i32,
    pub start: NaiveDate,
    pub contract_size: f64,
    pub market_id: i32,
}

#[derive(Queryable, Associations)]
#[belongs_to(Instrument)]
pub struct MetricsGreek {
    pub id: i32,
    pub time: NaiveDateTime,
    pub instrument_id: i32,
    pub implied_vol: f64,
    pub weekly_hist_vol: f64,
    pub monthly_hist_vol: f64,
    pub delta: f64,
    pub gamma: f64,
}

#[derive(Queryable, Associations)]
#[belongs_to(SerumMarket)]
#[belongs_to(Instrument)]
pub struct Order {
    pub id: i32,
    pub time: NaiveDateTime,
    pub transaction_id: String,
    pub serum_market_id: i32,
    pub instrument_id: i32,
    pub price: f64,
    pub side: i32,
    pub size: f64,
    pub fee_cost: f64,
    pub price_before_fees: f64,
}

#[derive(Queryable, Associations)]
#[belongs_to(Instrument)]
pub struct Spot {
    pub id: i32,
    pub time: NaiveDateTime,
    pub instrument_id: i32,
    pub mark: f64,
    pub bid: f64,
    pub ask: f64,
    pub bid_size: f64,
    pub ask_size: f64,
}

#[derive(Insertable)]
#[table_name = "spots"]
pub struct NewSpot {
    pub time: NaiveDateTime,
    pub instrument_id: i32,
    pub mark: f64,
    pub bid: f64,
    pub ask: f64,
    pub bid_size: f64,
    pub ask_size: f64,
}

impl NewSpot {
    pub fn from(instrument_id: i32, bid_ask_ctx: BidsAsksContext) -> Self {
        let now = Utc::now().naive_utc();
        Self {
            time: now,
            instrument_id,
            mark: bid_ask_ctx.mark,
            bid: bid_ask_ctx.bid,
            ask: bid_ask_ctx.ask,
            bid_size: bid_ask_ctx.bid_size,
            ask_size: bid_ask_ctx.ask_size,
        }
    }
}
