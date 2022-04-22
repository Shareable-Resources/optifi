mod utils;

pub mod test_find_exchanges {
    use crate::utils::initialize_test_logging;
    use anchor_client::anchor_lang::prelude::Pubkey;
    use futures::pin_mut;
    use futures_util::StreamExt;
    use orchestrator::optifi::exchanges::find_optifi_exchanges;
    use orchestrator::solana::Network;
    use std::str::FromStr;

    #[tokio::test(flavor = "multi_thread")]
    pub async fn test_find_known_exchanges() {
        initialize_test_logging();
        let program_address =
            Pubkey::from_str("hjo3CZHSkssq4df3uhYPEuJMdAstA6qc3EEYNDXAxvW").unwrap();
        let exchange_stream = find_optifi_exchanges(Network::Devnet, program_address);
        pin_mut!(exchange_stream);

        while let Some(exchange) = exchange_stream.next().await {
            println!("{}", exchange.1.uuid);
        }
        assert!(true)
    }
}
