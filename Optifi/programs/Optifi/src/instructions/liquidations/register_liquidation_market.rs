use crate::errors::ErrorCode;
use crate::financial::get_serum_spot_price;
use crate::state::{LiquidationState, LiquidationStatus, OptifiMarket, UserAccount};
use crate::utils::PREFIX_USER_ACCOUNT;
use crate::{serum_cancel_order, Exchange};
use anchor_lang::prelude::*;
use anchor_spl::token::accessor;
use anchor_spl::token::accessor::amount;
use serum_dex::matching::Side;
use serum_dex::state::Market;

#[derive(Accounts)]
pub struct RegisterLiquidationMarket<'info> {
    pub optifi_exchange: ProgramAccount<'info, Exchange>,

    #[account(constraint = user_account.is_in_liquidation)]
    pub user_account: ProgramAccount<'info, UserAccount>,

    #[account(mut, constraint = liquidation_state.user_account == user_account.key() && liquidation_state.status == LiquidationStatus::Liquidating)]
    pub liquidation_state: ProgramAccount<'info, LiquidationState>,

    pub market: ProgramAccount<'info, OptifiMarket>,

    #[account(constraint=serum_market.key() == market.serum_market)]
    pub serum_market: AccountInfo<'info>,
    pub serum_dex_program_id: AccountInfo<'info>,
    #[account(mut)]
    pub bids: AccountInfo<'info>,
    #[account(mut)]
    pub asks: AccountInfo<'info>,
    #[account(mut)]
    pub event_queue: AccountInfo<'info>,

    #[account(mut, constraint = open_orders.owner == &user_account.key())]
    pub open_orders: AccountInfo<'info>,
    pub open_orders_owner: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,

    #[account(constraint =
        market.instrument_long_spl_token == accessor::mint(&user_instrument_long_token_vault)? &&
        user_instrument_long_token_vault.owner == &user_account.key()
    )]
    pub user_instrument_long_token_vault: AccountInfo<'info>,

    #[account(constraint =
        market.instrument_short_spl_token == accessor::mint(&user_instrument_short_token_vault)? &&
        user_instrument_short_token_vault.owner == &user_account.key()
    )]
    pub user_instrument_short_token_vault: AccountInfo<'info>,
}

pub fn handler(ctx: Context<RegisterLiquidationMarket>) -> ProgramResult {
    let liquidation_state = &mut ctx.accounts.liquidation_state;
    let optifi_market = &ctx.accounts.market;
    let user_short_tokens = amount(&ctx.accounts.user_instrument_short_token_vault)?;
    let user_long_tokens = amount(&ctx.accounts.user_instrument_long_token_vault)?;
    let serum_market = Market::load(
        &ctx.accounts.serum_market,
        ctx.accounts.serum_dex_program_id.key,
    )?;

    // Check that this instrument hasn't already been registered for this liquidation
    if liquidation_state
        .registered_positions
        .contains(&optifi_market.instrument)
    {
        return Err(ErrorCode::InstrumentAlreadyRegisteredForLiquidation.into());
    }

    // If it hasn't, start by cancelling any orders the user might already have open for this instrument
    let open_orders = serum_market.load_orders_mut(
        &ctx.accounts.open_orders,
        Some(&ctx.accounts.open_orders_owner),
        &ctx.accounts.serum_dex_program_id.key(),
        None,
        None,
    )?;

    let mut order_ids: Vec<(u128, Side)> = Vec::new();

    for order_slot in 0..open_orders.orders.len() {
        let order_in_slot = open_orders.orders[order_slot];
        if order_in_slot != 0u128 {
            order_ids.push((
                order_in_slot,
                open_orders.slot_side(order_slot as u8).unwrap(),
            ));
        }
    }

    msg!(
        "Found {} open orders for user in liquidation, cancelling...",
        order_ids.len()
    );

    let exchange = &ctx.accounts.optifi_exchange;
    let exchange_key = exchange.key();
    let exchange_ref = exchange_key.as_ref();

    let signer_seeds = &[
        PREFIX_USER_ACCOUNT.as_bytes(),
        exchange_ref,
        ctx.accounts.user_account.owner.as_ref(),
        &[ctx.accounts.user_account.bump],
    ];

    for (order_id, side) in order_ids {
        msg!("Cancelling order {}", order_id);
        serum_cancel_order(
            signer_seeds,
            &ctx.accounts.serum_dex_program_id,
            &ctx.accounts.serum_market,
            &ctx.accounts.bids,
            &ctx.accounts.asks,
            &ctx.accounts.open_orders,
            &ctx.accounts.open_orders_owner,
            &ctx.accounts.event_queue,
            side,
            order_id,
            &ctx.accounts.serum_dex_program_id.key(),
        )?
    }

    // Finally, price the instrument, and add it to the pending instruments for liquidation
    let market_spot = get_serum_spot_price(&serum_market);
    let user_short_pos = market_spot * (user_short_tokens as f64);
    let user_long_pos = market_spot * (user_long_tokens as f64);

    liquidation_state.add_position(user_long_pos - user_short_pos, optifi_market.instrument);

    Ok(())
}
