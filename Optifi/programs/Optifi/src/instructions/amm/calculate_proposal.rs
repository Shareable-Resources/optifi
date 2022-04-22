use crate::constants::SECS_IN_STANDARD_YEAR;
use crate::errors::ErrorCode;
use crate::financial::amm::{calculate_amm_price, calculate_amm_quote_price, calculate_amm_size};
use crate::financial::instruments::InstrumentType;
use crate::financial::{delta_wrapper, Asset, OrderSide};
use crate::state::AmmAccount;
use crate::state::{AmmState, Exchange};
use crate::{f_to_u_repr, fvec_to_uvec_repr, i_to_f_repr, u_to_f_repr};
use anchor_lang::prelude::*;
use anchor_spl::token;
use solana_program::log::sol_log_compute_units;
use std::convert::TryFrom;

#[derive(Accounts)]
pub struct CalculateAmmProposal<'info> {
    /// get the exchange and markets
    pub optifi_exchange: Account<'info, Exchange>,

    /// the amm to which user will deposits funds
    #[account(mut)]
    pub amm: ProgramAccount<'info, AmmAccount>,

    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,

    /// Clock to get the timestamp
    pub clock: Sysvar<'info, Clock>,
}

/// Withdraw tokens from amm handler
pub fn handler(ctx: Context<CalculateAmmProposal>) -> ProgramResult {
    if ctx.accounts.amm.state != AmmState::CalculateProposal {
        return Err(ErrorCode::WrongState.into());
    }
    let amm = &mut ctx.accounts.amm;

    // Find the first index not calculated yet
    let index = amm.flags.iter().position(|&x| x == false).unwrap();

    let exchange = &ctx.accounts.optifi_exchange;
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
    let mut is_call: bool = true;

    let mut strikes: Vec<f64> = vec![];
    let mut dt: Vec<f64> = vec![];

    let asset = Asset::try_from(amm.asset).unwrap();
    let instrument_pubkey = amm.trading_instruments[index];

    let instrument = instruments[index];

    if instrument.asset == asset && instrument.instrument_pubkey == instrument_pubkey {
        let now = Clock::get().unwrap().unix_timestamp as u64;

        let time_to_maturity = instrument.expiry_date - now;

        let time_to_maturity = time_to_maturity as f64 / SECS_IN_STANDARD_YEAR as f64;

        match instrument.instrument_type {
            InstrumentType::Put => {
                is_call = false;

                strikes.push(instrument.strike as f64);

                dt.push(time_to_maturity)
            }
            InstrumentType::Call => {
                is_call = true;

                strikes.push(instrument.strike as f64);

                dt.push(time_to_maturity)
            }

            _ => {}
        }
    } else {
        return Err(ErrorCode::WrongInstrument.into());
    }
    // Get the spot_price and iv from log
    let (spot_price, iv) = (u_to_f_repr!(amm.price), u_to_f_repr!(amm.iv));

    // Get the delta and amm_liquidity_btc from log
    let (net_delta, amm_liquidity_btc) = (
        i_to_f_repr!(amm.net_delta),
        u_to_f_repr!(amm.total_liquidity),
    );

    msg!("Calculating the AMM position proposal...");

    msg!("Before calculate_amm_quote_price - for btc_delta_size_2ask");
    sol_log_compute_units();

    let quote_size = u_to_f_repr!(amm.contract_size);

    let (mut btc_delta_size_2ask, quote_price_2ask) = calculate_amm_quote_price(
        spot_price,
        OrderSide::Ask,
        net_delta,
        amm_liquidity_btc,
        quote_size,
    );

    msg!("After calculate_amm_quote_price - for btc_delta_size_2ask");
    sol_log_compute_units();

    let (mut btc_delta_size_2bid, quote_price_2bid) = calculate_amm_quote_price(
        spot_price,
        OrderSide::Bid,
        net_delta,
        amm_liquidity_btc,
        quote_size,
    );

    msg!("After calculate_amm_quote_price - for btc_delta_size_2bid");
    sol_log_compute_units();
    // todo!("if is future");

    let (size_2ask, price_2ask, mut size_2bid, mut price_2bid) = if is_call {
        let cdelta_btc_raw =
            delta_wrapper(spot_price, strikes.clone(), iv, dt.clone(), true, false);

        msg!("Before calculate_amm_price - for cprice_btc_2ask");
        sol_log_compute_units();

        let cprice_btc_2ask = calculate_amm_price(
            is_call,
            &quote_price_2ask,
            &cdelta_btc_raw,
            &strikes,
            iv,
            &dt,
            spot_price,
        );

        msg!("After calculate_amm_price - for cprice_btc_2ask");
        sol_log_compute_units();

        let call_size_2ask =
            calculate_amm_size(true, &btc_delta_size_2ask, &cdelta_btc_raw, quote_size);

        msg!("After calculate_amm_size - for call_size_2ask");
        sol_log_compute_units();

        let cprice_btc_2bid = calculate_amm_price(
            is_call,
            &quote_price_2bid,
            &cdelta_btc_raw,
            &strikes,
            iv,
            &dt,
            spot_price,
        );

        msg!("After calculate_amm_price - for cprice_btc_2bid");
        sol_log_compute_units();

        let call_size_2bid =
            calculate_amm_size(true, &btc_delta_size_2bid, &cdelta_btc_raw, quote_size);

        msg!("After calculate_amm_size - for call_size_2bid");
        sol_log_compute_units();

        (
            call_size_2ask[0].clone(),
            cprice_btc_2ask[0].clone(),
            call_size_2bid[0].clone(),
            cprice_btc_2bid[0].clone(),
        )
    } else {
        let pdelta_btc_raw =
            delta_wrapper(spot_price, strikes.clone(), iv, dt.clone(), false, false);
        msg!("After delta_wrapper");
        sol_log_compute_units();

        let pprice_btc_2ask = calculate_amm_price(
            false,
            &quote_price_2bid,
            &pdelta_btc_raw,
            &strikes,
            iv,
            &dt,
            spot_price,
        );

        msg!("After calculate_amm_price - for pprice_btc_2ask");
        sol_log_compute_units();

        let pprice_btc_2bid = calculate_amm_price(
            false,
            &quote_price_2ask,
            &pdelta_btc_raw,
            &strikes,
            iv,
            &dt,
            spot_price,
        );

        msg!("After calculate_amm_price - for pprice_btc_2bid");
        sol_log_compute_units();

        btc_delta_size_2bid.reverse();
        btc_delta_size_2ask.reverse();

        msg!("After reverse");
        sol_log_compute_units();

        let put_size_2ask =
            calculate_amm_size(false, &btc_delta_size_2bid, &pdelta_btc_raw, quote_size);

        msg!("After calculate_amm_size - for put_size_2ask");
        sol_log_compute_units();

        let put_size_2bid =
            calculate_amm_size(false, &btc_delta_size_2ask, &pdelta_btc_raw, quote_size);

        msg!("After calculate_amm_size - for put_size_2bid");
        sol_log_compute_units();

        (
            put_size_2ask[0].clone(),
            pprice_btc_2ask[0].clone(),
            put_size_2bid[0].clone(),
            pprice_btc_2bid[0].clone(),
        )
    };

    size_2bid.reverse();
    price_2bid.reverse();

    amm.proposals[index].ask_orders_size = fvec_to_uvec_repr!(size_2ask);
    amm.proposals[index].ask_orders_price = fvec_to_uvec_repr!(price_2ask);

    amm.proposals[index].bid_orders_size = fvec_to_uvec_repr!(size_2bid);
    amm.proposals[index].bid_orders_price = fvec_to_uvec_repr!(price_2bid);

    // Done
    amm.flags[index] = true;

    if amm.flags.iter().all(|&flag| flag == true) {
        msg!("The proposal calculation is finished, changing the amm state...");

        for flag in amm.flags.iter_mut() {
            *flag = false;
        }
        amm.move_to_next_state();
    }
    Ok(())
}
