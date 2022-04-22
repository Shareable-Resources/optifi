use crate::db::assets::code as assets_code;
use crate::db::assets::dsl::assets;
use crate::db::chains::dsl::chains;
use crate::db::chains::{
    asset_id as chains_asset_id, exchange_id as chains_exchange_id,
    expiration as chains_expiration, expiry_type_id as chains_expiry_type_id,
    instrument_type_id as chains_instrument_type_id,
};
use crate::db::expiry_types::code as expiry_types_code;
use crate::db::expiry_types::dsl::expiry_types;
use crate::db::instrument_types::code as instrument_types_code;
use crate::db::instrument_types::dsl::instrument_types;
use crate::db::instruments::dsl::instruments;
use crate::db::instruments::{address as instruments_address, chain_id as instruments_chain_id};
use crate::db::optifi_markets::dsl::optifi_markets;
use crate::db::optifi_markets::{
    address as optifi_market_address, exchange_id as optifi_market_exchange_id,
};
use crate::db::schema::chains as schema_chains;
use crate::db::schema::exchanges;
use crate::db::schema::instruments as schema_instruments;
use crate::db::schema::optifi_markets as schema_optifi_markets;
use crate::db::schema::serum_markets as schema_serum_markets;
use crate::db::schema::spots as schema_spots;
use crate::db::serum_markets::dsl::serum_markets;
use crate::db::serum_markets::{address as serum_address, exchange_id as serum_exchange_id};
use crate::db::{
    Asset, Chain, Exchange, ExpiryType, Instrument, InstrumentType, NewChain, NewExchange,
    NewInstrument, NewOptifiMarket, NewSerumMarket, NewSpot, OptifiMarket, SerumMarket, Spot,
};
use crate::errors::DataError;
use crate::solana::serum::load_serum_market::BidsAsksContext;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel::{insert_into, ExpressionMethods, PgConnection, QueryDsl, RunQueryDsl};

pub fn create_exchange(
    conn: &PgConnection,
    program_id: i32,
    address: String,
    uuid: String,
) -> Exchange {
    let new_exchange = NewExchange {
        program_id,
        address,
        exchange_uuid: uuid,
    };
    insert_into(exchanges::table)
        .values(&new_exchange)
        .get_result(conn)
        .expect("Error saving new exchange")
}

pub fn add_serum_market_if_not_exists(
    connection: &PgConnection,
    rel_serum_address: String,
    rel_exchange_id: i32,
) {
    let found_markets: Vec<SerumMarket> = serum_markets
        .filter(
            serum_address
                .eq(rel_serum_address.clone())
                .and(serum_exchange_id.eq(rel_exchange_id)),
        )
        .load::<SerumMarket>(connection)
        .unwrap();
    if found_markets.len() == 0 {
        log::debug!(
            "Serum market at address {} did not already exist in DB, creating",
            rel_serum_address
        );
        let new_serum_market = NewSerumMarket {
            exchange_id: rel_exchange_id,
            address: rel_serum_address.clone(),
        };
        insert_into(schema_serum_markets::table)
            .values(&new_serum_market)
            .get_result::<SerumMarket>(connection)
            .expect("Error saving new serum market");
        log::info!(
            "Created new serum market in DB at address {}",
            rel_serum_address
        );
    } else {
        log::debug!(
            "Serum market with address {} already existed in DB",
            rel_serum_address
        );
    }
}

pub fn get_serum_market_from_address(
    connection: &PgConnection,
    rel_serum_address: String,
) -> Result<SerumMarket, DataError> {
    let found_markets: Vec<SerumMarket> = serum_markets
        .filter(serum_address.eq(rel_serum_address))
        .load::<SerumMarket>(connection)
        .expect("Couldn't load serum markets");

    match found_markets.first() {
        Some(m) => Ok(SerumMarket {
            address: m.address.clone(),
            exchange_id: m.exchange_id,
            id: m.id,
        }),
        None => Err(DataError::AddressIntegrityError),
    }
}

pub fn add_optifi_market_if_not_exists(
    connection: &PgConnection,
    rel_exchange_id: i32,
    rel_serum_market_id: i32,
    rel_address: String,
    rel_short_token_address: String,
    rel_long_token_address: String,
    rel_optifi_market_id: i32,
) -> i32 {
    let found_markets: Vec<OptifiMarket> = optifi_markets
        .filter(
            optifi_market_address
                .eq(rel_address.clone())
                .and(optifi_market_exchange_id.eq(rel_exchange_id)),
        )
        .load::<OptifiMarket>(connection)
        .unwrap();
    return if found_markets.len() == 0 {
        log::debug!(
            "Optifi market at address {} did not already exist in DB, creating",
            rel_address
        );
        let new_optifi_market = NewOptifiMarket {
            exchange_id: rel_exchange_id,
            serum_market_id: rel_serum_market_id,
            address: rel_address.clone(),
            short_token_address: rel_short_token_address,
            long_token_address: rel_long_token_address,
            optifi_market_id: rel_optifi_market_id,
        };
        let created_market: OptifiMarket = insert_into(schema_optifi_markets::table)
            .values(&new_optifi_market)
            .get_result::<OptifiMarket>(connection)
            .expect("Error saving new optifi market");
        log::info!("Created new optifi market in DB at address {}", rel_address);
        created_market.id
    } else {
        log::debug!(
            "Optifi market with address {} already existed in DB",
            rel_address
        );
        found_markets.first().unwrap().id
    };
}

pub fn get_instrument_type_id_by_code(connection: &PgConnection, rel_code: String) -> i32 {
    let found_instrument_types: Vec<InstrumentType> = instrument_types
        .filter(instrument_types_code.eq(rel_code))
        .load::<InstrumentType>(connection)
        .unwrap();
    found_instrument_types.first().unwrap().id
}

pub fn get_asset_id_by_code(connection: &PgConnection, rel_code: String) -> i32 {
    let found_assets: Vec<Asset> = assets
        .filter(assets_code.eq(rel_code))
        .load::<Asset>(connection)
        .unwrap();
    found_assets.first().unwrap().id
}

pub fn get_expiry_type_id_by_code(connection: &PgConnection, rel_code: String) -> i32 {
    let found_expiry_types: Vec<ExpiryType> = expiry_types
        .filter(expiry_types_code.eq(rel_code))
        .load::<ExpiryType>(connection)
        .unwrap();
    found_expiry_types.first().unwrap().id
}

pub fn get_chain_by_exchange_optifi_info(
    connection: &PgConnection,
    rel_exchange_id: i32,
    rel_instrument_type_id: i32,
    rel_expiration: NaiveDateTime,
    rel_expiry_type_id: i32,
    rel_asset_id: i32,
) -> Option<i32> {
    let found_chains: Vec<Chain> = chains
        .filter(
            chains_exchange_id.eq(rel_exchange_id).and(
                chains_instrument_type_id.eq(rel_instrument_type_id).and(
                    chains_expiration.eq(rel_expiration).and(
                        chains_expiry_type_id
                            .eq(rel_expiry_type_id)
                            .and(chains_asset_id.eq(rel_asset_id)),
                    ),
                ),
            ),
        )
        .load::<Chain>(connection)
        .unwrap();
    match found_chains.first() {
        Some(c) => Some(c.id),
        None => None,
    }
}

pub fn add_chain_if_not_exists(connection: &PgConnection, rel_new_chain: NewChain) -> i32 {
    let found_chains: Vec<Chain> = chains
        .filter(
            chains_exchange_id.eq(rel_new_chain.exchange_id).and(
                chains_instrument_type_id
                    .eq(rel_new_chain.instrument_type_id)
                    .and(
                        chains_expiration.eq(rel_new_chain.expiration).and(
                            chains_expiry_type_id
                                .eq(rel_new_chain.expiry_type_id)
                                .and(chains_asset_id.eq(rel_new_chain.asset_id)),
                        ),
                    ),
            ),
        )
        .load::<Chain>(connection)
        .unwrap();
    return if found_chains.len() == 0 {
        let created_chain: Chain = insert_into(schema_chains::table)
            .values(&rel_new_chain)
            .get_result::<Chain>(connection)
            .expect("Error saving new chain");
        log::debug!("Created chain on exchange {}", rel_new_chain.exchange_id);
        created_chain.id
    } else {
        log::debug!(
            "Chain on exchange {} already existed",
            rel_new_chain.exchange_id
        );
        found_chains.first().unwrap().id
    };
}

pub fn add_instrument_if_not_exists(connection: &PgConnection, rel_new_instrument: NewInstrument) {
    let found_instruments: Vec<Instrument> = instruments
        .filter(
            instruments_chain_id
                .eq(rel_new_instrument.chain_id)
                .and(instruments_address.eq(rel_new_instrument.address.clone())),
        )
        .load::<Instrument>(connection)
        .unwrap();
    if found_instruments.len() == 0 {
        insert_into(schema_instruments::table)
            .values(&rel_new_instrument)
            .get_result::<Instrument>(connection)
            .expect("Error saving new instrument");
        log::debug!(
            "Created new instrument with address {} on chain {}",
            rel_new_instrument.address,
            rel_new_instrument.chain_id
        );
    } else {
        log::debug!(
            "Instrument with address {} on chain {} already existed",
            rel_new_instrument.address,
            rel_new_instrument.chain_id
        );
    }
}

pub fn add_spot(connection: &PgConnection, rel_instrument_id: i32, bid_ask_ctx: BidsAsksContext) {
    let new_spot = NewSpot::from(rel_instrument_id, bid_ask_ctx);
    insert_into(schema_spots::table)
        .values(&new_spot)
        .get_result::<Spot>(connection)
        .expect("Error saving new spot");
}
