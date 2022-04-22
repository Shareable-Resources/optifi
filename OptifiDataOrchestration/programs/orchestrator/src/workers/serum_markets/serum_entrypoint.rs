use crate::db::connection::establish_connection;
use crate::db::instruments::dsl::instruments;
use crate::db::instruments::market_id;
use crate::db::optifi_markets::dsl::optifi_markets;
use crate::db::serum_markets::dsl::serum_markets;
use crate::db::{Instrument, OptifiMarket, SerumMarket};
use crate::workers::serum_markets::serum_market_watch::watch_serum_market;
use diesel::{QueryDsl, RunQueryDsl};
use std::collections::HashSet;
use std::time::Duration;
use tokio::spawn;
use tokio::time::interval;

fn get_serum_markets() -> Vec<(SerumMarket, OptifiMarket)> {
    // We only run this every hour, so it's more efficient to establish a connection each
    // time than to keep one hanging around
    let connection = establish_connection();
    let instruments_referencing_optifi_markets: Vec<Instrument> = instruments
        .distinct_on(market_id)
        .load::<Instrument>(&connection)
        .unwrap();
    let mut referenced_markets: Vec<(SerumMarket, OptifiMarket)> = Vec::new();
    for referencing_instrument in instruments_referencing_optifi_markets {
        let relevant_market: OptifiMarket = optifi_markets
            .find(referencing_instrument.market_id)
            .first(&connection)
            .unwrap();
        let relevant_serum_market: SerumMarket = serum_markets
            .find(relevant_market.serum_market_id)
            .first(&connection)
            .unwrap();
        referenced_markets.push((relevant_serum_market, relevant_market));
    }
    log::debug!(
        "Found {} serum markets referenced by instruments",
        referenced_markets.len()
    );
    referenced_markets
}

pub async fn monitor_serum_markets() {
    log::info!("Starting serum monitoring");
    // Refresh serum markets every hour
    let mut interval = interval(Duration::from_secs(60 * 60));
    let mut monitored_serum_markets: HashSet<i32> = HashSet::new();
    loop {
        interval.tick().await;
        let relevant_serum_markets = get_serum_markets();
        for (serum_market, optifi_market) in relevant_serum_markets {
            if !monitored_serum_markets.contains(&serum_market.id) {
                monitored_serum_markets.insert(serum_market.id);
                spawn(async move {
                    watch_serum_market(&serum_market.clone(), &optifi_market).await;
                });
            }
        }
    }
}
