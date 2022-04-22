mod utils;

/**
Test the auto rate limited client, and make sure requests are efficiently dispatched
and received
**/
#[cfg(test)]
mod test_client_synchronization {
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

    async fn test_async_no_rate_limit() {
        // Development wallet on devnet, should be lots of transactions
        let test_address: Pubkey =
            Pubkey::from_str("3Ss57KZTYhtE5k2v7JcSoejv489Vg1wWckNi3BoysqSN").unwrap();
        let client = get_client(Network::Devnet);
        let mut total_signatures: Vec<Signature> = Vec::new();
        let mut sig_stream = stream_signatures(Network::Devnet, test_address);
        pin_mut!(sig_stream);
        while let Some(sig) = sig_stream.next().await {
            total_signatures.push(sig);
        }
        assert!(!total_signatures.is_empty())
    }

    #[test]
    pub fn test_no_rate_limit() {
        initialize_test_logging();
        block_on(test_async_no_rate_limit())
    }
}
