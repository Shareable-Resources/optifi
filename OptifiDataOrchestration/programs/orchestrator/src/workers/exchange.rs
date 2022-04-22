use crate::db::connection::establish_connection;
use crate::db::programs::dsl::programs;
use crate::db::{
    add_optifi_market_if_not_exists, add_serum_market_if_not_exists, get_serum_market_from_address,
    Exchange, Program,
};
use crate::optifi::chains_instruments::evaluate_optifi_chain;
use crate::solana::{get_client, CompliantClient, Network};
use anchor_lang::prelude::Pubkey;
use anchor_lang::prelude::*;
use diesel::{QueryDsl, RunQueryDsl};
use optifi::financial::Chain;
use optifi::state::{Exchange as OptifiExchange, OptifiMarket as StateOptifiMarket};
use std::str::FromStr;
use std::time::Duration;
use tokio::time::interval;

fn evaluate_as_chain(client: &CompliantClient, account: &Pubkey, exchange_id: i32, market_id: i32) {
    let acct_data = Box::new(client.get_account_data(account).unwrap());
    match Chain::try_deserialize(&mut acct_data.as_slice()) {
        Ok(chain) => {
            evaluate_optifi_chain(account, chain, exchange_id, market_id);
        }
        Err(e) => {
            log::warn!("Got {} trying to deserialize {}", e, account.to_string());
        }
    }
}

pub async fn monitor_exchange(exchange: Exchange) {
    // Get the program context for the exchange, and load a connection and client
    let connection = establish_connection();
    let program: Program = programs
        .find(exchange.program_id)
        .first(&connection)
        .unwrap();
    let network = Network::from(program.network);
    log::info!(
        "Starting monitoring exchange {} on program {}, network {}",
        exchange.exchange_uuid,
        program.address,
        network
    );
    let client = get_client(network);
    // Every 30 minutes, get the exchange object from on chain
    let mut interval = interval(Duration::from_secs(60 * 30));
    loop {
        interval.tick().await;
        let exchange_address_key = Pubkey::from_str(exchange.address.as_str()).unwrap();
        let account_data = client.get_account_data(&exchange_address_key).unwrap();
        let optifi_exchange: OptifiExchange =
            OptifiExchange::try_deserialize(&mut account_data.as_slice()).unwrap();

        // Make sure all the Optifi and serum markets from this exchange are in the database
        for optifi_market_data in optifi_exchange.markets {
            add_serum_market_if_not_exists(
                &connection,
                optifi_market_data.serum_market.to_string().clone(),
                exchange.id,
            );
            // We know that this has to exist in the DB now
            let db_serum_market = get_serum_market_from_address(
                &connection,
                optifi_market_data.serum_market.to_string().clone(),
            )
            .unwrap();
            // Additionally, get the full market from on chain
            let state_account_data = client
                .get_account_data(&optifi_market_data.optifi_market_pubkey)
                .unwrap();
            let state_optifi_market: StateOptifiMarket =
                StateOptifiMarket::try_deserialize(&mut state_account_data.as_slice()).unwrap();
            let rel_market_id = add_optifi_market_if_not_exists(
                &connection,
                exchange.id,
                db_serum_market.id,
                optifi_market_data.optifi_market_pubkey.to_string(),
                state_optifi_market.instrument_short_spl_token.to_string(),
                state_optifi_market.instrument_long_spl_token.to_string(),
                state_optifi_market.optifi_market_id as i32,
            );
            evaluate_as_chain(
                &client,
                &state_optifi_market.instrument,
                exchange.id,
                rel_market_id,
            );
        }
    }
}
