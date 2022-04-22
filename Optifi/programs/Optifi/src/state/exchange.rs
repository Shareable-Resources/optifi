use crate::financial::instruments::*;
use crate::financial::*;
use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

#[account]
#[derive(Default)]
pub struct Exchange {
    /// id of the OptiFi Exchange
    pub uuid: String,
    /// OptiFi Exchange version
    pub version: u32,
    /// the authority address
    pub exchange_authority: Pubkey,
    pub owner: Pubkey, //TODO: do we need this??
    /// the recognized usdc token mint
    pub usdc_mint: Pubkey,
    /// usdc central pool for fund settlement
    pub usdc_central_pool: Pubkey,
    /// trusted oracle account for BTC sopt price
    pub btc_spot_oracle: Pubkey,
    /// trusted oracle account for ETH sopt price
    pub eth_spot_oracle: Pubkey,
    /// trusted oracle account for BTC IV
    pub btc_iv_oracle: Pubkey,
    /// trusted oracle account for ETH IV
    pub eth_iv_oracle: Pubkey,
    /// a list of all created serum markets, it should be updated when new market is created
    pub markets: Vec<OptifiMarketKeyData>,
    // a list of all created instruments, it should be updated when new instrument is created
    pub instruments: Vec<InstrumentKeyData>,
}

/// only keep the key data for a created Instrument
#[derive(Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InstrumentKeyData {
    /// underlying asset
    pub asset: Asset, // 1 bytes
    /// option or future
    pub instrument_type: InstrumentType, // 1 bytes
    /// strike price of the instrument
    pub strike: u64, // 8 bytes
    /// expiry date of the instrument, unix timestamp
    pub expiry_date: u64, // 8 bytes

    pub expiry_type: ExpiryType, // 1 byte
    /// instrument pubkey
    pub instrument_pubkey: Pubkey,
}

/// only keep the key data for a created OptiFi Market
#[derive(Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct OptifiMarketKeyData {
    /// pubkey of created optifi market
    pub optifi_market_pubkey: Pubkey,
    /// id of the optifi market, we may have markets with id from 1 ~ 50
    pub optifi_market_id: u16,
    /// the serum orderbook market which is used to swap instrument spl token and quote token
    pub serum_market: Pubkey,
    /// the instrument which is listed on this market
    pub instrument: Pubkey,
    /// expiry date of the instrument which is listed on this market
    pub expiry_date: u64,
    /// whether the optitfi market is stopped, which may be updated when the listing instruments is expired
    pub is_stopped: bool,
}
