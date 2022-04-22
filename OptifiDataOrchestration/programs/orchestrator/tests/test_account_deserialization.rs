pub mod test_account_deserialization {
    use anchor_lang::AccountDeserialize;
    use optifi::state::Exchange;
    use orchestrator::constants::EXCHANGE_DISCRIMINATOR;
    use orchestrator::solana::account_utils::discriminator::has_discriminator;
    use orchestrator::solana::{get_client, Network};
    use solana_sdk::pubkey::Pubkey;
    use std::str::FromStr;

    #[tokio::test(flavor = "multi_thread")]
    pub async fn test_known_account_discriminator() {
        // A known exchange account
        let exchange_acct_address =
            Pubkey::from_str("6anqnkGSpV2fQ2nhbLoCcMnny7fkD47ts7yAkMwyVzj5").unwrap();
        let rpc_client = get_client(Network::Devnet);
        let acct_data: Box<Vec<u8>> =
            Box::new(rpc_client.get_account_data(&exchange_acct_address).unwrap());
        assert!(has_discriminator(acct_data, EXCHANGE_DISCRIMINATOR))
    }

    #[tokio::test(flavor = "multi_thread")]
    pub async fn test_known_account_deser() {
        // A known exchange account
        let exchange_acct_address =
            Pubkey::from_str("6anqnkGSpV2fQ2nhbLoCcMnny7fkD47ts7yAkMwyVzj5").unwrap();
        let rpc_client = get_client(Network::Devnet);
        let acct_data: Box<Vec<u8>> =
            Box::new(rpc_client.get_account_data(&exchange_acct_address).unwrap());
        let exchange_deser: Exchange =
            Exchange::try_deserialize(&mut acct_data.as_slice()).unwrap();
        // If we get here, deserialization was successful
        assert!(true);
    }

    #[tokio::test(flavor = "multi_thread")]
    pub async fn test_chain_account_deser() {
        // This should be a chain account
        let chain_account_address =
            Pubkey::from_str("72m7ggsBDxRTXqLGc7BpNVvZBbDb3NwRVw1KppGfWz3e").unwrap();
        let rpc_client = get_client(Network::Devnet);
        let acct_data: Box<Vec<u8>> =
            Box::new(rpc_client.get_account_data(&chain_account_address).unwrap());
        let has_discriminator = has_discriminator(acct_data, "Chain");
        assert!(has_discriminator);
    }
}
