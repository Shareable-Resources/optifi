use std::time::Duration;

// The number of signatures to retrieve at once in calls that load signatures for an account
pub const SOLANA_SIGNATURES_LIMIT: usize = 500;

pub const SOLANA_MAINNET_URL: &str = "https://api.mainnet-beta.solana.com";
pub const SOLANA_DEVNET_URL: &str = "https://api.devnet.solana.com";

// Solana rate limits
pub const SOLANA_MAXIMUM_REQUESTS_PER_RATE_SLOT: usize = 100;
pub const RATE_SLOT_LEN: Duration = Duration::from_secs(10);

// Known discriminators
pub const EXCHANGE_DISCRIMINATOR: &str = "Exchange";
pub const CHAIN_DISCRIMINATOR: &str = "Chain";

// Constant ids for fixtures
pub const BITCOIN_CODE: &str = "BTC";
pub const ETHEREUM_CODE: &str = "ETH";
pub const USDC_CODE: &str = "USDC";
pub const STANDARD_CODE: &str = "Standard";
pub const PERPETUAL_CODE: &str = "Perpetual";
pub const PUT_CODE: &str = "Put";
pub const CALL_CODE: &str = "Call";
pub const FUTURE_CODE: &str = "Future";

// Serum dex program IDs
pub const SERUM_DEVNET_ID: &str = "DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY";
pub const SERUM_MAINNET_ID: &str = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

// The account to use as the owner when creating AccountInfo structs for use in serum internals
pub const FAKE_OWNER: &str = "3Ss57KZTYhtE5k2v7JcSoejv489Vg1wWckNi3BoysqSN";
pub const FAKE_LAMPORTS: u64 = 500u64;
