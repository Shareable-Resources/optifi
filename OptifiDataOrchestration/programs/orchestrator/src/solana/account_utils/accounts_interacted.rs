use crate::solana::transactions::stream_transactions;
use crate::solana::Network;
use anchor_client::anchor_lang::prelude::Pubkey;
use async_stream::stream;
use futures::pin_mut;
use std::collections::HashSet;
use tokio_stream::{Stream, StreamExt};

pub fn stream_accounts_interacted(network: Network, account: Pubkey) -> impl Stream<Item = Pubkey> {
    stream! {
        log::debug!(
        "Starting to stream interacted accounts for account {} ",
        account
    );
    let mut seen_accounts: HashSet<Pubkey> = HashSet::new();
    let mut accounts_found = 0;
    let tx_stream = stream_transactions(network, account.clone());
    pin_mut!(tx_stream);
    while let Some(tx) = tx_stream.next().await {
        for account_key in tx.message.account_keys {
            if !seen_accounts.contains(&account_key) {
                seen_accounts.insert(account_key);
                yield account_key;
                accounts_found += 1;
            }
        }
    }
    log::debug!(
        "Finished streaming accounts interacted for {}, found {}",
        account,
        accounts_found
    );
    }
}
