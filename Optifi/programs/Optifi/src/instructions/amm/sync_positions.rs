use crate::errors::ErrorCode;
use crate::state::{AmmAccount, AmmState, OptifiMarket};
use anchor_lang::prelude::*;
use anchor_spl::token::accessor;
use lazy_static::__Deref;
use serum_dex::state::Market;

#[derive(Accounts)]
#[instruction(instrument_index: u16)]
pub struct SyncPositions<'info> {
    /// the amm to which user will deposits funds
    #[account(mut)]
    pub amm: ProgramAccount<'info, AmmAccount>,
    /// the optifi market where the instrumnet to be synced is listed
    #[account(constraint = amm.trading_instruments[instrument_index as usize] == optifi_market.instrument)]
    pub optifi_market: ProgramAccount<'info, OptifiMarket>,

    /// amm's base token vault (Long position)
    #[account(constraint = optifi_market.instrument_long_spl_token == accessor::mint(&long_token_vault)?)]
    pub long_token_vault: AccountInfo<'info>,

    /// amm's base token vault (Short position)
    #[account(constraint = optifi_market.instrument_short_spl_token == accessor::mint(&short_token_vault)?)]
    pub short_token_vault: AccountInfo<'info>,

    /// the serum market(orderbook)
    #[account(mut)]
    pub serum_market: AccountInfo<'info>,

    /// the open orders account
    pub open_orders_account: AccountInfo<'info>,

    pub open_orders_owner: AccountInfo<'info>,
}

/// Update AMM Positions
pub fn handler(ctx: Context<SyncPositions>, instrument_index: u16) -> ProgramResult {
    if ctx.accounts.amm.state != AmmState::Sync {
        return Err(ErrorCode::WrongState.into());
    }

    let amm = &mut ctx.accounts.amm;
    msg!("instrument keys: {:?}", amm.trading_instruments);

    let positions = &amm.positions;

    let long_token_vault = ctx.accounts.long_token_vault.key;

    let short_token_vault = ctx.accounts.short_token_vault.key;

    let long_index = positions
        .iter()
        .position(|x| &x.long_token_vault == long_token_vault)
        .unwrap();

    let short_index = positions
        .iter()
        .position(|x| &x.short_token_vault == short_token_vault)
        .unwrap();

    if long_index != short_index {
        return Err(ErrorCode::InvalidAccount.into());
    }

    if amm.flags[long_index] == true {
        return Err(ErrorCode::WrongInstrument.into());
    }

    msg!("Synchronizing the amm position...");

    let long_position = accessor::amount(&ctx.accounts.long_token_vault).unwrap();
    let short_position = accessor::amount(&ctx.accounts.short_token_vault).unwrap();

    amm.positions[long_index].latest_position = long_position as u64 - short_position as u64;

    // TODO
    let serum_market = &ctx.accounts.serum_market;
    let open_orders_account = &ctx.accounts.open_orders_account;
    let open_orders_owner = &ctx.accounts.open_orders_owner;

    let market = Market::load(serum_market, serum_market.owner)?;

    let serum_market_account_info = market.load_orders_mut(
        open_orders_account,
        Some(open_orders_owner),
        serum_market.owner,
        None,
        None,
    )?;

    let serum_market_account_info = serum_market_account_info.deref();

    amm.positions[long_index].usdc_balance = serum_market_account_info.native_pc_total;

    amm.flags[long_index] = true;

    if amm.flags.iter().all(|&flag| flag == true) {
        msg!("The synchronizing is finished, changing the amm state...");

        for flag in amm.flags.iter_mut() {
            *flag = false;
        }
        amm.move_to_next_state();
    }

    Ok(())
}
