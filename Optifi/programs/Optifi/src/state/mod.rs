pub mod amm_state;
pub mod exchange;
pub mod liquidation_state;
pub mod market_maker_account;
pub mod position;
pub mod user_account;

pub use amm_state::*;
use anchor_lang::{prelude::*, AnchorDeserialize, AnchorSerialize};
pub use exchange::*;
pub use liquidation_state::*;
pub use position::*;
pub use user_account::*;

// Note: not sure why OptifiMarket cannot be converted to ts if put it in sub mod
#[account]
#[derive(Default)]
pub struct OptifiMarket {
    /// id of the optifi market, we may have markets with id from 1 ~ 50
    pub optifi_market_id: u16,
    /// the serum orderbook market which is used to swap instrument spl token and quote token
    pub serum_market: Pubkey,
    /// the instrument which is listed on this market
    pub instrument: Pubkey,
    /// instrumnet long spl token which would be sent to instrument buyers
    pub instrument_long_spl_token: Pubkey,
    /// instrumnet short spl token which would be minted to instrument seller
    pub instrument_short_spl_token: Pubkey,
    /// whether the optitfi market is stopped, which may be updated when the listing instruments is expired
    pub is_stopped: bool,
    /// bump seed which is used to generate this optifi market address
    pub bump: u8,
}
