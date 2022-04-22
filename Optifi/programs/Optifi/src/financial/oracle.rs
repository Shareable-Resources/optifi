/*
Code to manage loading IV and Spot data from Oracles like Switchboard,
Pyth, etc.
 */
use crate::constants::{
    SWITCHBOARD_DEVNET_BTC_IV, SWITCHBOARD_DEVNET_BTC_USD, SWITCHBOARD_DEVNET_ETH_IV,
    SWITCHBOARD_DEVNET_ETH_USD,
};
use crate::financial::Asset;
use crate::state::Exchange;
use anchor_lang::prelude::{msg, AccountInfo, Pubkey};
use switchboard_program::{get_aggregator, get_aggregator_result, AggregatorState, RoundResult};

/// load oracle data in the switchboard feed account
fn get_switchboard_value(feed_account: &AccountInfo) -> f64 {
    let aggregator: AggregatorState = switchboard_program::get_aggregator(
        feed_account, // &AccountInfo
    )
    .expect("Couldn't build switchboard aggregator");
    let round_result: RoundResult =
        get_aggregator_result(&aggregator).expect("Couldn't get switchboard result");
    round_result
        .result
        .expect("Couldn't retrieve switchboard response")

    // AggregatorState::new(feed_account)?
    //     .get_result()?
    //     .try_into()?

    // get_aggregator_result(
    //     &get_aggregator(
    //         feed_account, // &AccountInfo
    //     )
    //     .unwrap(),
    // )
    // .unwrap()
    // .result
    // .unwrap()
}

/// get asset iv from the switchboard feed account
fn switchboard_get_iv(feed_account: &AccountInfo) -> f64 {
    get_switchboard_value(feed_account).round() / 100f64
}

/// get the asset/usdc spot price
fn switchboard_get_asset_to_usdc_spot(asset_feed: &AccountInfo, usdc_feed: &AccountInfo) -> f64 {
    (get_switchboard_value(asset_feed) / get_switchboard_value(usdc_feed) * 100f64).round() / 100f64
}

/// get the asset/usd spot price
/// !!! Important Note !!!
/// If we take the usdc/usd into account, it may exceed the computing units limit
/// in some cases because it reuqires about 18000 more units to do so.
/// We may put this into a seprate tx in order to save computing units
fn switchboard_get_asset_to_usd_spot(asset_feed: &AccountInfo) -> f64 {
    (get_switchboard_value(asset_feed) * 100f64).round() / 100f64
}

/// get iv from oracle
pub fn get_iv(feed_account: &AccountInfo) -> f64 {
    switchboard_get_iv(feed_account)
}

/// get asset/usdc sopt price from oracle
pub fn get_asset_to_usdc_spot(asset_feed: &AccountInfo, usdc_feed: &AccountInfo) -> f64 {
    switchboard_get_asset_to_usdc_spot(asset_feed, usdc_feed)
}

/// get asset/usd sopt price from oracle
pub fn get_asset_to_usd_spot(asset_feed: &AccountInfo) -> f64 {
    switchboard_get_asset_to_usd_spot(asset_feed)
}

/// Oracle data type
pub enum OracleDataType {
    Spot,
    IV,
}

/// it verfies if the given oracle account is a trusted one
pub fn verify_switchboard_account(
    asset: Asset,
    oracle_data_type: OracleDataType,
    account_to_verify: &Pubkey,
    exchange: &Exchange,
) -> bool {
    match oracle_data_type {
        OracleDataType::Spot => match asset {
            Asset::Bitcoin => account_to_verify.to_bytes() == exchange.btc_spot_oracle.to_bytes(),
            Asset::Ethereum => account_to_verify.to_bytes() == exchange.eth_spot_oracle.to_bytes(),
            _ => false,
        },
        OracleDataType::IV => match asset {
            Asset::Bitcoin => account_to_verify.to_bytes() == exchange.btc_iv_oracle.to_bytes(),
            Asset::Ethereum => account_to_verify.to_bytes() == exchange.eth_iv_oracle.to_bytes(),
            _ => false,
        },
    }
}
