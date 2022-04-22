use crate::constants::{DELTA_LIMIT, PRICE_MOVE, SECS_IN_STANDARD_YEAR};
use crate::errors::ErrorCode;
use crate::financial::amm::total_amm_liquidity;
use crate::financial::instruments::InstrumentType;
use crate::financial::oracle::{get_asset_to_usdc_spot, get_iv};
use crate::financial::Asset;
use crate::state::{AmmAccount, AmmState, Exchange};
use crate::{f_to_i_repr, f_to_u_repr, u_to_f_repr};
use anchor_lang::prelude::*;
use anchor_spl::token;
use std::convert::TryFrom;

#[derive(Accounts)]
pub struct CalculateAmmDelta<'info> {
    /// get the exchange and markets
    pub optifi_exchange: Account<'info, Exchange>,

    /// the amm to which user will deposits funds
    #[account(mut)]
    pub amm: ProgramAccount<'info, AmmAccount>,

    /// amm's quote token vault to get the USDC balance
    pub quote_token_vault: AccountInfo<'info>,

    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,

    /// Clock to get the timestamp
    pub clock: Sysvar<'info, Clock>,

    /// Oracle to get the spot price
    pub asset_feed: AccountInfo<'info>,
    pub usdc_feed: AccountInfo<'info>,
    pub iv_feed: AccountInfo<'info>,
}

/// Withdraw tokens from amm handler
pub fn handler(ctx: Context<CalculateAmmDelta>) -> ProgramResult {
    if ctx.accounts.amm.state != AmmState::CalculateDelta {
        return Err(ErrorCode::WrongState.into());
    }
    let asset_feed = &ctx.accounts.asset_feed;
    let usdc_feed = &ctx.accounts.usdc_feed;
    let iv_feed = &ctx.accounts.iv_feed;

    let exchange = &ctx.accounts.optifi_exchange;
    let amm = &mut ctx.accounts.amm;
    let amm_price = u_to_f_repr!(amm.price);
    let spot_price = get_asset_to_usdc_spot(asset_feed, usdc_feed);

    if (spot_price - amm_price).abs() > PRICE_MOVE * amm_price {
        // let optifi_markets = &exchange.markets;
        let instruments = &exchange.instruments;
        // let instruments = &vec![
        //     InstrumentKeyData {
        //         asset: Asset::Bitcoin,
        //         instrument_type: InstrumentType::Put,
        //         strike: 42900,
        //         expiry_date: 1646071200,
        //         expiry_type: crate::financial::instruments::ExpiryType::Standard,
        //         instrument_pubkey: Pubkey::from_str("AqZ8zt3kqnEfBWMwhBPnbKNq8vezzrTBdkx7hCTJtaaL")
        //             .unwrap(),
        //     },
        //     InstrumentKeyData {
        //         asset: Asset::Bitcoin,
        //         instrument_type: InstrumentType::Put,
        //         strike: 42975,
        //         expiry_date: 1646071200,
        //         expiry_type: crate::financial::instruments::ExpiryType::Standard,
        //         instrument_pubkey: Pubkey::from_str("95RE8yx177oQcvwGjt4rPvzpu1twRhz5SR6zUVUhy1uH")
        //             .unwrap(),
        //     },
        // ];
        let asset = Asset::try_from(amm.asset).unwrap();

        // Sum the usdc in all markets
        let usdc_in_markets: u64 = amm
            .positions
            .iter()
            .map(|position| position.usdc_balance)
            .sum();

        let mut usdc_balance = token::accessor::amount(&ctx.accounts.quote_token_vault).unwrap();
        usdc_balance += usdc_in_markets;

        let futures_position = 0.0;
        let amm_position: Vec<f64> = amm
            .positions
            .iter()
            .map(|x| x.latest_position as f64)
            .collect();

        let mut is_call: Vec<u8> = vec![];
        let mut strikes: Vec<f64> = vec![];
        let mut dt: Vec<f64> = vec![];

        let iv = get_iv(iv_feed);

        let now = Clock::get().unwrap().unix_timestamp as u64;

        for instrument in instruments.iter() {
            if instrument.asset == asset {
                let time_to_maturity = instrument.expiry_date - now;

                let time_to_maturity = time_to_maturity as f64 / SECS_IN_STANDARD_YEAR as f64;

                match instrument.instrument_type {
                    InstrumentType::Put => {
                        is_call.push(0);

                        strikes.push(instrument.strike as f64);

                        dt.push(time_to_maturity)
                    }
                    InstrumentType::Call => {
                        is_call.push(1);

                        strikes.push(instrument.strike as f64);

                        dt.push(time_to_maturity)
                    }

                    _ => {}
                }
            }
        }

        msg!("Calculating the AMM delta and liquidiity...");

        let (net_delta, amm_liquidity_btc) = total_amm_liquidity(
            spot_price,
            strikes,
            iv,
            dt,
            is_call,
            amm_position,
            futures_position,
            usdc_balance as f64,
        );

        msg!("The net_delta surpass the limit , changing the amm to next state...");
        amm.net_delta = f_to_i_repr!(net_delta);
        assert!(amm_liquidity_btc >= 0.0);
        assert!(spot_price >= 0.0);
        assert!(iv >= 0.0);
        amm.total_liquidity = f_to_u_repr!(amm_liquidity_btc);
        amm.price = f_to_u_repr!(spot_price);
        amm.iv = f_to_u_repr!(iv);

        amm.move_to_next_state();

        if net_delta.abs() > amm_liquidity_btc * DELTA_LIMIT {
            todo!("update future positions");
        }
    } else {
        amm.move_to_first_state();
    }

    Ok(())
}
