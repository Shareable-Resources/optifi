use crate::errors::ErrorCode;
use crate::financial::{Chain, Duration};
use crate::state::{AmmAccount, Exchange, OptifiMarket, Position, Proposal};
use anchor_lang::prelude::*;
use anchor_spl::token::accessor;
use std::convert::TryFrom;

#[derive(Accounts)]
#[instruction(instrument_index: u16)]
pub struct RemoveOptiFiMarketForAMM<'info> {
    pub optifi_exchange: ProgramAccount<'info, Exchange>,

    /// the amm
    #[account(mut)] // TODO: remove hardcoded data space
    pub amm: Account<'info, AmmAccount>,
    /// the optifi_market which list the instrument
    #[account(constraint = amm.trading_instruments[instrument_index as usize] == optifi_market.instrument)]
    pub optifi_market: ProgramAccount<'info, OptifiMarket>,
    /// the instrumnet to remove from amm's trading instrument list
    #[account(constraint = amm.trading_instruments[instrument_index as usize] == instrument.key() && instrument.expiry_date as i64 <= clock.unix_timestamp)]
    pub instrument: ProgramAccount<'info, Chain>,
    pub clock: Sysvar<'info, Clock>,
}

/// remove an instrument from amm's trading instrument list due to expiration
pub fn remove_instrument_handler(
    ctx: Context<RemoveOptiFiMarketForAMM>,
    instrument_index: u16,
) -> ProgramResult {
    let amm = &mut ctx.accounts.amm;
    if amm
        .positions
        .get(instrument_index as usize)
        .unwrap()
        .latest_position
        != 0
    {
        return Err(ErrorCode::CannotRemoveInstrumentForAMM.into());
    }
    amm.trading_instruments.remove(instrument_index as usize);
    amm.positions.remove(instrument_index as usize);
    amm.flags.remove(instrument_index as usize);

    Ok(())
}

#[derive(Accounts)]
pub struct AddOptiFiMarketForAMM<'info> {
    pub optifi_exchange: ProgramAccount<'info, Exchange>,

    /// the amm
    #[account(mut)] // TODO: remove hardcoded data space
    pub amm: ProgramAccount<'info, AmmAccount>,
    /// the optifi_market which list the instrument
    //#[account(constraint = optifi_market.instrument == instrument.key())]
    pub optifi_market: ProgramAccount<'info, OptifiMarket>,
    /// the instrumnet to add into amm's trading instrument list, it must not be expired
    #[account(constraint = instrument.asset == amm.asset
        && instrument.expiry_date as i64 > clock.unix_timestamp
        && instrument.duration == Duration::try_from(amm.duration).unwrap()
        && instrument.contract_size == amm.contract_size
    )]
    pub instrument: ProgramAccount<'info, Chain>,
    #[account(constraint = optifi_market.instrument_long_spl_token == accessor::mint(&amm_long_token_vault)?)]
    pub amm_long_token_vault: AccountInfo<'info>,
    #[account(constraint = optifi_market.instrument_short_spl_token == accessor::mint(&amm_short_token_vault)?)]
    pub amm_short_token_vault: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
}

/// add an instrument to amm's trading instrument list due to expiration
pub fn add_instrument_handler(ctx: Context<AddOptiFiMarketForAMM>) -> ProgramResult {
    msg!("In add instrument handler");
    let amm = &mut ctx.accounts.amm;
    let instrument_to_add = &ctx.accounts.instrument;
    let amm_long_token_vault = &ctx.accounts.amm_long_token_vault;
    let amm_short_token_vault = &ctx.accounts.amm_short_token_vault;

    if let Some(_) = amm
        .trading_instruments
        .iter()
        .find(|&instrument| instrument == &instrument_to_add.key())
    {
        msg!("Returning duplicate instrument error");
        return Err(ErrorCode::DuplicateInstrumentForAMM.into());
    }

    msg!("Adding to trading instruments");
    amm.trading_instruments.push(instrument_to_add.key());
    msg!("Adding to positions");
    amm.positions.push(Position {
        instruments: instrument_to_add.key(),
        long_token_vault: amm_long_token_vault.key(),
        short_token_vault: amm_short_token_vault.key(),
        latest_position: 0u64,
        usdc_balance: 0u64,
    });
    msg!("Adding to flags");
    amm.proposals.push(Proposal {
        ask_orders_size: vec![],
        ask_orders_price: vec![],
        bid_orders_size: vec![],
        bid_orders_price: vec![],
        instrument: instrument_to_add.key(),
        is_started: false,
    });
    amm.flags.push(false);

    msg!("Ok!");
    Ok(())
}
