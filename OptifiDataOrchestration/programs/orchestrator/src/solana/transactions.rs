use crate::solana::signatures::stream_signatures;
use crate::solana::{get_client, Network};
use async_stream::stream;
use futures::pin_mut;
use futures_util::stream::StreamExt;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Signature;
use solana_sdk::transaction::Transaction;
use solana_transaction_status::UiTransactionEncoding;
use std::sync::Arc;
use std::time::Duration;
use tokio::spawn;
use tokio::sync::RwLock;
use tokio::task::JoinHandle;
use tokio::time::sleep;
use tokio_stream::Stream;

async fn get_transaction(sig: Signature, network: Network) -> Option<Transaction> {
    let client = get_client(network);
    let tx_res = client.get_transaction(&sig, UiTransactionEncoding::Base64);
    match tx_res {
        Ok(tx_enc) => tx_enc.transaction.transaction.decode(),
        Err(e) => {
            log::error!(
                "Got error trying to fetch transaction for sig {:?}, {:?}",
                sig,
                e
            );
            None
        }
    }
}

struct TxStreamContext {
    streamers: Vec<JoinHandle<Option<Transaction>>>,
    done: bool,
}

impl TxStreamContext {
    pub fn new() -> Self {
        Self {
            streamers: Vec::new(),
            done: false,
        }
    }
}

async fn start_transaction_streamers(
    tx_ctx: Arc<RwLock<TxStreamContext>>,
    network: Network,
    account: Pubkey,
) {
    let signatures_stream = stream_signatures(network, account);
    pin_mut!(signatures_stream);

    let mut transactions_collected = 0;
    while let Some(sig) = signatures_stream.next().await {
        let mut tx_ctx_inner = tx_ctx.write().await;
        let task = spawn(async move { get_transaction(sig, network.clone()).await });
        tx_ctx_inner.streamers.push(task);
        transactions_collected += 1;
        if transactions_collected % 1000 == 0 {
            log::debug!(
                "Started {} transaction stream tasks",
                transactions_collected
            );
        }
    }

    log::debug!(
        "Finished creating transaction streamers, created {} overall",
        transactions_collected
    );

    let mut tx_ctx_inner = tx_ctx.write().await;
    tx_ctx_inner.done = true;
}

pub fn stream_transactions(network: Network, account: Pubkey) -> impl Stream<Item = Transaction> {
    let tx_ctx: Arc<RwLock<TxStreamContext>> = Arc::new(RwLock::new(TxStreamContext::new()));
    let tx_ctx_clone = Arc::clone(&tx_ctx);
    let tx_stream_producer = spawn(async move {
        start_transaction_streamers(tx_ctx_clone, network.clone(), account.clone()).await
    });

    stream! {
        log::debug!(
            "Starting to stream transactions for account {}",
            account
        );
        let mut transactions_returned = 0;
        let mut transactions_errored = 0;

        // Wait for everything to be done
        loop {
            let mut tx_ctx_write = tx_ctx.write().await;
            if tx_ctx_write.done {
               break;
            }
            match tx_ctx_write.streamers.pop() {
                Some(streamer) => {
                    let tx_val: Option<Transaction> = streamer.await.unwrap();
                    match tx_val {
                        Some(t) => {
                            transactions_returned += 1;
                            if transactions_returned % 100 == 0 {
                                log::debug!("Fetched {} transactions", transactions_returned);
                            }
                            yield t;
                        },
                        None => {
                            transactions_errored += 1;
                            log::debug!("Couldn't decode transaction")
                        }
                    }
                }
                None => {
                    // Wait for a second to give the producer time to make more streamers
                    drop(tx_ctx_write);
                    log::debug!("Letting producer catch up");
                    sleep(Duration::from_secs(1)).await;
                }
            }
        }
        log::debug!("Waiting for tx stream producer to clean up and exit");
        tx_stream_producer.await.unwrap();
        log::info!("Finished streaming transactions for {}, got {}, {} errored", account,
            transactions_returned,
            transactions_errored);
    }
}
