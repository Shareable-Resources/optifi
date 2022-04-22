use crate::constants::EXCHANGE_DISCRIMINATOR;
use crate::solana::account_utils::accounts_interacted::stream_accounts_interacted;
use crate::solana::account_utils::discriminator::has_discriminator;
use crate::solana::compliant_client::get_client;
use crate::solana::Network;
use anchor_lang::prelude::*;
use async_stream::stream;
use futures_util::{pin_mut, Stream, StreamExt};
use optifi::state::Exchange;
use solana_sdk::pubkey::Pubkey;
use std::sync::Arc;
use tokio::spawn;
use tokio::sync::mpsc;
use tokio::sync::mpsc::UnboundedSender;
use tokio::task::JoinHandle;

#[derive(Debug)]
struct AcctDataInteractedMsg {
    data: Box<Vec<u8>>,
    address: Pubkey,
}

async fn generate_account_interacted_data(
    network: Network,
    optifi_program: Pubkey,
    sender: UnboundedSender<AcctDataInteractedMsg>,
) {
    log::debug!(
        "Starting generate account interacted data for program {}",
        optifi_program.to_string()
    );
    let accounts_interacted_stream = stream_accounts_interacted(network, optifi_program);
    pin_mut!(accounts_interacted_stream);
    let client = get_client(network);
    let mut data_waiters: Vec<JoinHandle<_>> = Vec::new();
    while let Some(account) = accounts_interacted_stream.next().await {
        let client_clone = Arc::clone(&client);
        let sender_clone = sender.clone();
        let handle = spawn(async move {
            match client_clone.get_account_data(&account) {
                Ok(d) => {
                    sender_clone
                        .send(AcctDataInteractedMsg {
                            data: Box::new(d),
                            address: account.clone(),
                        })
                        .unwrap();
                }
                Err(e) => {
                    log::warn!("{:?}", e);
                }
            };
        });
        data_waiters.push(handle);
    }
    log::debug!(
        "Waiting for {} account data fetchers to exit",
        data_waiters.len()
    );
    for waiter in data_waiters {
        waiter.await.unwrap();
    }
    log::debug!("Finished, exiting generate account interacted data");
    drop(sender);
}

fn evaluate_account_as_exchange(data: AcctDataInteractedMsg) -> Option<Exchange> {
    return if has_discriminator(data.data.clone(), EXCHANGE_DISCRIMINATOR) {
        let exchange = Exchange::try_deserialize(&mut data.data.as_slice());
        match exchange {
            Ok(e) => {
                log::info!("Found exchange with UUID {}", e.uuid);
                Some(e)
            }
            Err(e) => {
                log::warn!("{} for exchange at {}", e, data.address.to_string());
                None
            }
        }
    } else {
        None
    };
}

/**
Parse the transaction logs of a program to find every exchange UUID associated with,
and return those UUIDs and their addresses
**/
pub fn find_optifi_exchanges(
    network: Network,
    optifi_program: Pubkey,
) -> impl Stream<Item = (Pubkey, Exchange)> {
    log::debug!(
        "Starting find Optifi exchanges stream for {}",
        optifi_program.to_string()
    );
    let (sender, mut receiver) = mpsc::unbounded_channel::<AcctDataInteractedMsg>();

    stream! {
        let mut data_received = 0;
        let exchanges_found = 0;

        log::debug!("About to spawn generate account interacted");
        let acct_interacted = spawn(async move {
            generate_account_interacted_data(
                network.clone(),
                optifi_program.clone(),
                sender
            ).await
        });


        log::debug!("Spawned generate account interacted");
        loop {
            match receiver.recv().await {
                Some(a) => {
                    data_received += 1;
                    // Save the key before moving the account message
                    let key = a.address.clone();
                    // Check the discriminator
                    if let Some(found_exchange) = evaluate_account_as_exchange(a) {
                        yield (key, found_exchange);
                    }
                }
                None => {
                    log::debug!("Finished streaming associated exchanges, received {} accounts, {} \
                    of which were exchanges", data_received, exchanges_found);
                    break;
                }
            };
        }
        acct_interacted.await.unwrap();
    }
}
