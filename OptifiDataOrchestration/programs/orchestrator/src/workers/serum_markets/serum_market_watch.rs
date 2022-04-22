use crate::db::connection::establish_connection;
use crate::db::exchanges::dsl::exchanges;
use crate::db::instruments::dsl::instruments;
use crate::db::instruments::market_id as instruments_market_id;
use crate::db::programs::dsl::programs;
use crate::db::{add_spot, Exchange, Instrument, OptifiMarket, Program, SerumMarket};
use crate::solana::serum::load_serum_market::{get_bids_asks, load_serum_market, BidsAsksContext};
use crate::solana::{get_client, Network};
use diesel::PgConnection;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;
use std::time::Duration;
use tokio::time::interval;

fn record_spot_price(
    connection: &PgConnection,
    optifi_market: &OptifiMarket,
    bids_asks_ctx: BidsAsksContext,
) {
    // Get the ID of the instrument currently associated with this market
    let found_instruments: Vec<Instrument> = instruments
        .filter(instruments_market_id.eq(optifi_market.id))
        .load::<Instrument>(connection)
        .expect("Couldn't load instrument");
    let rel_instrument = found_instruments
        .first()
        .expect("No instrument found for market");
    add_spot(connection, rel_instrument.id, bids_asks_ctx);
}

pub async fn watch_serum_market(serum_market: &SerumMarket, optifi_market: &OptifiMarket) {
    // Load the exchange object from the optifi network to find out what network we're working on,
    // and get the appropriate client
    let connection = establish_connection();
    let relevant_exchange: Exchange = exchanges
        .find(optifi_market.exchange_id)
        .first(&connection)
        .unwrap();
    let relevant_program: Program = programs
        .find(relevant_exchange.program_id)
        .first(&connection)
        .unwrap();
    let network = Network::from(relevant_program.network);
    log::info!(
        "Watching serum market at address {} on program {} on network {}",
        serum_market.address,
        relevant_program.address,
        network
    );
    let client = get_client(network);
    let serum_market_pubkey = Pubkey::from_str(serum_market.address.as_str()).unwrap();
    let mut market_ctx = load_serum_market(&client, &serum_market_pubkey, network);

    // Every 20 seconds, load the latest bids and asks from the market
    let mut interval = interval(Duration::from_secs(20));
    loop {
        interval.tick().await;
        let bids_asks_ctx = get_bids_asks(&client, &mut market_ctx);
        // Push the spot to the database
        record_spot_price(&connection, optifi_market, bids_asks_ctx);
    }
}
