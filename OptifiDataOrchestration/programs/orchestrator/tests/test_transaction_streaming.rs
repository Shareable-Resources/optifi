mod utils;

#[cfg(test)]
mod test_transaction_streaming {
    use crate::utils::initialize_test_logging;
    use anchor_client::anchor_lang::prelude::Pubkey;
    use futures::executor::block_on;
    use futures::pin_mut;
    use orchestrator::solana::signatures::stream_signatures;
    use orchestrator::solana::transactions::stream_transactions;
    use orchestrator::solana::{get_client, Network};
    use solana_sdk::signature::Signature;
    use solana_sdk::transaction::Transaction;
    use std::str::FromStr;
    use tokio::task::JoinHandle;
    use tokio_stream::StreamExt;

    #[tokio::test(flavor = "multi_thread")]
    pub async fn test_get_transactions() {
        initialize_test_logging();
        // Development wallet on devnet, should be lots of transactions
        let test_address: Pubkey =
            Pubkey::from_str("3Ss57KZTYhtE5k2v7JcSoejv489Vg1wWckNi3BoysqSN").unwrap();
        let client = get_client(Network::Devnet);
        let mut total_transactions: Vec<Transaction> = Vec::new();
        let mut tx_stream = stream_transactions(Network::Devnet, test_address);
        pin_mut!(tx_stream);
        while let Some(tx) = tx_stream.next().await {
            total_transactions.push(tx);
        }
        assert!(!total_transactions.is_empty())
    }
}
