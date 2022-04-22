use crate::db::connection::establish_connection;
use crate::db::{
    add_chain_if_not_exists, add_instrument_if_not_exists, get_asset_id_by_code,
    get_chain_by_exchange_optifi_info, get_expiry_type_id_by_code, get_instrument_type_id_by_code,
    NewChain, NewInstrument,
};
use crate::optifi::conversions::{
    optifi_asset_to_asset_code, optifi_expiry_type_to_expiry_type_code,
    optifi_instrument_type_to_instrument_type_code,
};
use chrono::NaiveDateTime;
use optifi::financial::Chain;
use optifi::u_to_f_repr;
use solana_sdk::pubkey::Pubkey;

pub fn evaluate_optifi_chain(address: &Pubkey, chain: Chain, exchange_id: i32, market_id: i32) {
    // Check whether the chain exists, and then handle the instrument
    let connection = establish_connection();
    let chain_id: i32;
    let instrument_address = address.to_string();

    // Convert the u8 values on the chain to the
    let asset_code = optifi_asset_to_asset_code(chain.asset);
    let expiry_type_code = optifi_expiry_type_to_expiry_type_code(chain.expiry_type);
    let instrument_type_code =
        optifi_instrument_type_to_instrument_type_code(chain.instrument_type);
    let expiry_type_id = get_expiry_type_id_by_code(&connection, expiry_type_code.to_string());
    let instrument_type_id =
        get_instrument_type_id_by_code(&connection, instrument_type_code.to_string());
    let asset_id = get_asset_id_by_code(&connection, asset_code.to_string());

    let expiration = NaiveDateTime::from_timestamp(chain.expiry_date as i64, 0);

    // Actually do the query to see if the chain exists
    match get_chain_by_exchange_optifi_info(
        &connection,
        exchange_id,
        instrument_type_id,
        expiration,
        expiry_type_id,
        asset_id,
    ) {
        Some(c) => chain_id = c,
        // If it doesn't, create it
        None => {
            let created_chain = add_chain_if_not_exists(
                &connection,
                NewChain {
                    exchange_id,
                    asset_id,
                    is_trading: chain.is_listed_on_market,
                    instrument_type_id,
                    expiration,
                    expiry_type_id,
                },
            );
            chain_id = created_chain;
        }
    }

    // Now that we've created the chain, create the instrument if it doesn't already exist
    let chain_start_datetime = NaiveDateTime::from_timestamp(chain.start as i64, 0);
    add_instrument_if_not_exists(
        &connection,
        NewInstrument {
            address: instrument_address,
            instrument_type_id,
            chain_id,
            strike: chain.strike as f64,
            expiration: Some(expiration),
            expiry_type_id,
            start: chain_start_datetime.date(),
            contract_size: u_to_f_repr!(chain.contract_size),
            market_id,
        },
    );
}
