use crate::constants::{
    BITCOIN_CODE, CALL_CODE, ETHEREUM_CODE, FUTURE_CODE, PERPETUAL_CODE, PUT_CODE, STANDARD_CODE,
    USDC_CODE,
};
use crate::db::assets::dsl::{assets, code as asset_code};
use crate::db::connection::establish_connection;
use crate::db::expiry_types::dsl::{code as expiry_type_code, expiry_types};
use crate::db::instrument_types::dsl::{code as instrument_type_code, instrument_types};
use crate::db::schema::{
    assets as schema_assets, expiry_types as schema_expiry_types,
    instrument_types as schema_instrument_types,
};
use crate::db::{Asset, ExpiryType, InstrumentType, NewAsset, NewExpiryType, NewInstrumentType};
use diesel::{insert_into, ExpressionMethods, PgConnection, QueryDsl, RunQueryDsl};
use lazy_static::lazy_static;
use std::ops::Deref;

// The data for the fixtures
lazy_static! {
    pub static ref ASSET_FIXTURES: Vec<NewAsset> = vec![
        NewAsset {
            name: "Bitcoin".to_string(),
            code: BITCOIN_CODE.to_string()
        },
        NewAsset {
            name: "Ethereum".to_string(),
            code: ETHEREUM_CODE.to_string()
        },
        NewAsset {
            name: "US Dollar Coin".to_string(),
            code: USDC_CODE.to_string()
        }
    ];
    pub static ref EXPIRY_TYPE_FIXTURES: Vec<NewExpiryType> = vec![
        NewExpiryType {
            code: STANDARD_CODE.to_string()
        },
        NewExpiryType {
            code: PERPETUAL_CODE.to_string()
        }
    ];
    pub static ref INSTRUMENT_TYPE_FIXTURES: Vec<NewInstrumentType> = vec![
        NewInstrumentType {
            code: PUT_CODE.to_string()
        },
        NewInstrumentType {
            code: CALL_CODE.to_string()
        },
        NewInstrumentType {
            code: FUTURE_CODE.to_string()
        }
    ];
}

fn write_asset_fixtures(connection: &PgConnection) {
    for asset_fixture in ASSET_FIXTURES.deref().clone() {
        // Check to see if the asset already exists
        let asset_code_str: String = asset_fixture.code.clone();
        let found_assets: Vec<Asset> = assets
            .filter(asset_code.eq(&asset_code_str))
            .load::<Asset>(connection)
            .expect("Couldn't load assets");
        if found_assets.len() == 0 {
            log::info!(
                "Asset fixture {} didn't exist, creating...",
                asset_fixture.code
            );
            insert_into(schema_assets::table)
                .values(asset_fixture)
                .get_result::<Asset>(connection)
                .expect("Error creating asset fixture");
            log::info!("Created asset fixture {}", asset_fixture.code);
        }
    }
}

fn write_expiry_type_fixtures(connection: &PgConnection) {
    for expiry_type_fixture in EXPIRY_TYPE_FIXTURES.deref().clone() {
        // Check to see if the expiry type already exists
        let expiry_code_str: String = expiry_type_fixture.code.clone();
        let found_expiry_types: Vec<ExpiryType> = expiry_types
            .filter(expiry_type_code.eq(&expiry_code_str))
            .load::<ExpiryType>(connection)
            .expect("Couldn't load expiry types");
        if found_expiry_types.len() == 0 {
            log::info!(
                "Expiry type fixture {} didn't exist, creating...",
                expiry_type_fixture.code
            );
            insert_into(schema_expiry_types::table)
                .values(expiry_type_fixture)
                .get_result::<ExpiryType>(connection)
                .expect("Error creating expiry type fixture");
            log::info!("Created expiry type fixture {}", expiry_type_fixture.code);
        }
    }
}

fn write_instrument_type_fixtures(connection: &PgConnection) {
    for instrument_type_fixture in INSTRUMENT_TYPE_FIXTURES.deref().clone() {
        // Check to see if the instrument type already exists
        let instrument_code_str: String = instrument_type_fixture.code.clone();
        let found_instrument_types: Vec<InstrumentType> = instrument_types
            .filter(instrument_type_code.eq(&instrument_code_str))
            .load::<InstrumentType>(connection)
            .expect("Couldn't load instrument types");
        if found_instrument_types.len() == 0 {
            log::info!(
                "Instrument type fixture {} didn't exist, creating...",
                instrument_type_fixture.code
            );
            insert_into(schema_instrument_types::table)
                .values(instrument_type_fixture)
                .get_result::<InstrumentType>(connection)
                .expect("Error creating instrument type fixture");
            log::info!(
                "Created instrument type fixture {}",
                instrument_type_fixture.code
            );
        }
    }
}

/**
If the database doesn't have common program quasi-constants, put them in at the beginning of the run
**/
pub fn write_fixtures() {
    log::info!("Writing fixtures");
    let connection = establish_connection();
    write_asset_fixtures(&connection);
    write_expiry_type_fixtures(&connection);
    write_instrument_type_fixtures(&connection);
    log::info!("Finished writing fixtures");
}
