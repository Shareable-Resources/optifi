use crate::constants::{FEE, SECS_IN_DAY, SECS_IN_STANDARD_YEAR, SPREAD_LIMIT};
use crate::errors::ErrorCode;
use crate::financial::instruments::{ExpiryType, InstrumentType};
use crate::financial::{delta_wrapper, get_serum_spot_price, max_bid, min_ask, Asset, Chain};
use crate::state::market_maker_account::{MarketMakerAccount, MarketMakerData};
use crate::{f_to_u_repr, u_to_f_repr};
use anchor_spl::token::accessor::amount;
use serum_dex::critbit::SlabView;
use serum_dex::state::Market;
use solana_program::account_info::AccountInfo;
use solana_program::clock::Clock;
use solana_program::entrypoint::ProgramResult;
use std::convert::TryFrom;

pub fn calculate_rewards_penalties(
    first_run: bool,
    mm_account: &mut MarketMakerAccount,
    spot: f64,
    iv: f64,
    chain: Chain,
    serum_market: &Market,
    asks_account: &AccountInfo,
    bids_account: &AccountInfo,
    contract_position: f64,
    quantity_traded: f64,
    pool_balance: f64,
    timestamp: u64,
) -> ProgramResult {
    let mm_data: &mut MarketMakerData;

    let mut asks = serum_market.load_asks_mut(asks_account).unwrap();
    let mut bids = serum_market.load_bids_mut(bids_account).unwrap();

    let max_bid = bids.find_max().unwrap();
    let min_ask = asks.find_min().unwrap();

    let max_bid_ref = bids.get_mut(max_bid).unwrap().as_leaf_mut().unwrap();

    let min_ask_ref = asks.get_mut(min_ask).unwrap().as_leaf_mut().unwrap();

    let max_bid_price = max_bid_ref.price().get() as f64;
    let min_ask_price = min_ask_ref.price().get() as f64;

    let max_bid_qty = max_bid_ref.quantity() as f64;
    let min_ask_qty = min_ask_ref.quantity() as f64;

    // TODO: figure out how to pull the actual quantity for all bids, asks out of serum
    let tot_bids = max_bid_qty + 10f64;
    let tot_asks = min_ask_qty + 10f64;

    // Pull out the correct data from the previous run
    let asset = Asset::try_from(chain.asset).unwrap();
    match asset {
        Asset::Bitcoin => mm_data = &mut mm_account.btc_data,
        Asset::Ethereum => mm_data = &mut mm_account.eth_data,
        _ => return Err(ErrorCode::WrongAsset.into()),
    }

    // Calcluate the options time to maturity, as a fraction of a year
    let time_to_maturity: f64;
    if chain.expiry_type == ExpiryType::Standard {
        time_to_maturity = ((chain.expiry_date - timestamp) as f64) / SECS_IN_STANDARD_YEAR as f64;
    } else {
        // Use one year for expiration
        time_to_maturity = 1f64;
    }

    let is_call: bool = if chain.instrument_type == InstrumentType::Put {
        false
    } else {
        // TODO: true for calls and futures - should we do something else for futures here?
        true
    };

    let delta = delta_wrapper(
        spot,
        vec![chain.strike as f64],
        iv,
        vec![time_to_maturity],
        is_call,
        true,
    )[0][0];

    let spread = (min_ask_price - max_bid_price) / delta / spot;
    let spread_val: f64 = if spread == 0f64 {
        SPREAD_LIMIT * 100f64
    } else {
        spread * 10f64
    };

    let secs_in_day_f = SECS_IN_DAY as f64;

    let dt = timestamp as f64 - mm_data.epoch as f64;

    let spread_adj_dt: f64 = dt * spread_val / SPREAD_LIMIT;
    let spread_adj_alpha: f64 = 2f64 / (secs_in_day_f / spread_adj_dt + 1f64);

    let alpha: f64 = 2f64 / (secs_in_day_f / dt + 1f64);
    let vol: f64;

    if first_run {
        vol = 0f64;
    } else {
        // Implementation of this excel formula -
        // =((1-[@Alpha])*Q30/(24*60*60)+[@Alpha]*ABS([@[MAKER QTY traded]])/[@[dt (seconds)]])*24*60*60
        vol = ((1f64 - alpha) * u_to_f_repr!(mm_data.volume) / secs_in_day_f
            + alpha * (quantity_traded / dt).abs() / dt)
            * secs_in_day_f
    };

    let orderbook_mid = get_serum_spot_price(serum_market);

    // TODO: we need to be able to access all orderbook members to get avg bid and ask, finish calculations

    mm_data.epoch = timestamp;
    mm_data.volume = f_to_u_repr!(vol);

    Ok(())
}
