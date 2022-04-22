use crate::db::connection::establish_connection;
use crate::db::exchanges::dsl::{address as exchange_dsl_address, exchanges, program_id};
use crate::db::{create_exchange, Exchange, Program};
use crate::optifi::exchanges::find_optifi_exchanges;
use crate::solana::Network;
use crate::workers::exchange::monitor_exchange;
use diesel::prelude::*;
use futures_util::{pin_mut, StreamExt};
use log::{debug, info};
use optifi::state::Exchange as OptifiExchange;
use solana_sdk::pubkey::Pubkey;
use std::collections::HashSet;
use std::str::FromStr;
use std::time::Duration;
use tokio::spawn;
use tokio::time::interval;

fn add_exchange_if_not_exists(
    connection: &PgConnection,
    program: &Program,
    exchange: OptifiExchange,
    exchange_addr: Pubkey,
) {
    let address_str = exchange_addr.to_string();
    let found_exchanges: Vec<Exchange> = exchanges
        .filter(
            program_id
                .eq(program.id)
                .and(exchange_dsl_address.eq(address_str.clone())),
        )
        .load(connection)
        .unwrap();
    if found_exchanges.len() == 0 {
        log::info!("Adding exchange {} to database", exchange.uuid);
        create_exchange(
            connection,
            program.id,
            address_str,
            exchange.uuid.to_string(),
        );
    } else {
        log::debug!("Exchange {} already existed in database", exchange.uuid);
    }
}

async fn find_exchanges(program: Program) {
    let connection = establish_connection();
    log::info!("Starting exchange search for {}", program.address);
    let program_network: Network = Network::from(program.network);
    let program_address: Pubkey = Pubkey::from_str(program.address.as_str()).unwrap();
    let optifi_exchange_stream = find_optifi_exchanges(program_network, program_address);
    pin_mut!(optifi_exchange_stream);

    while let Some(found_exchange) = optifi_exchange_stream.next().await {
        add_exchange_if_not_exists(&connection, &program, found_exchange.1, found_exchange.0);
    }
}

pub async fn monitor_program(program: Program) {
    let connection = establish_connection();
    let program_network = Network::from(program.network);
    info!(
        "Starting to watch program_id {} on network {}",
        program.address, program_network
    );
    // Start the background monitoring program that will find unknown exchanges for this program
    debug!("Spawning find exchange background task");
    let program_clone = program.clone();
    spawn(async move {
        // Refreshing all the exchanges will be a very expensive process.
        // Only do it every 2 hours
        let mut interval = interval(Duration::from_secs(60 * 60 * 2));
        loop {
            interval.tick().await;
            // Clone it again each loop iteration
            let new_program_clone = program_clone.clone();
            info!(
                "Starting find exchanges for program {}",
                new_program_clone.address
            );
            find_exchanges(new_program_clone).await;
        }
    });

    let mut monitored_exchanges: HashSet<i32> = HashSet::new();
    let mut interval = interval(Duration::from_secs(30));
    loop {
        // Every 30 seconds, load the exchanges for the database, and if there's anything that we
        // don't have a monitoring thread for, launch one
        interval.tick().await;
        let exchanges_res = exchanges
            .filter(program_id.eq(program.id))
            .load::<Exchange>(&connection)
            .unwrap();
        debug!(
            "Found {} exchanges from database for program {}",
            exchanges_res.len(),
            program.address
        );
        for exchange in exchanges_res {
            if !monitored_exchanges.contains(&exchange.id) {
                monitored_exchanges.insert(exchange.id);
                spawn(async move {
                    monitor_exchange(exchange).await;
                });
            };
        }
    }
}
