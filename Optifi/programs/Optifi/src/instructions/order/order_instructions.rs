use crate::errors::ErrorCode;
use crate::instrument_spl_token_utils::{
    burn_instrument_token_for_user, mint_instrument_token_for_user,
};
use crate::serum_utils::{serum_cancel_order, serum_new_order, serum_settle_funds_for_user};
use crate::utils::{
    get_central_usdc_pool_auth_pda, get_serum_market_auth_pda, PREFIX_CENTRAL_USDC_POOL_AUTH,
    PREFIX_SERUM_MARKET_AUTH, PREFIX_USER_ACCOUNT,
};

use crate::state::OptifiMarket;
use crate::state::UserAccount;
use crate::{pay_fees, Exchange, OrderSide};
use anchor_lang::prelude::*;
use anchor_spl::token;
use serum_dex::critbit::SlabView;
use serum_dex::error::DexErrorCode;
use serum_dex::matching::{OrderType, Side};
use serum_dex::state::Market;
use std::ops::DerefMut;

#[derive(Accounts)]
pub struct UpdateOrder {}

#[derive(Accounts)]
pub struct CancelOrder {}

/// Accounts used to place orders on the DEX
#[derive(Accounts, Clone)]
pub struct OrderContext<'info> {
    /// optifi exchange account
    pub exchange: ProgramAccount<'info, Exchange>,
    /// the user's wallet
    #[account(signer)]
    pub user: AccountInfo<'info>,
    /// user's optifi account
    #[account(constraint = user_account.optifi_exchange == exchange.key())]
    pub user_account: ProgramAccount<'info, UserAccount>,
    /// user's margin account which is controlled by a pda
    #[account(mut)]
    pub user_margin_account: AccountInfo<'info>,
    /// user's instrument long spl token account which is controlled by a the user's user account(pda)
    /// it stands for how many contracts the user sold for the instrument
    /// and it should be the same as order_payer_token_account if the order is ask order
    #[account(mut)]
    pub user_instrument_long_token_vault: AccountInfo<'info>,
    /// user's instrument short spl token account which is controlled by a the user's user account(pda)
    /// it stands for how many contracts the user bought for the instrument
    #[account(mut)]
    pub user_instrument_short_token_vault: AccountInfo<'info>,
    /// optifi market that binds an instrument with a serum market(orderbook)
    /// it's also the mint authority of the instrument spl token
    pub optifi_market: Account<'info, OptifiMarket>,
    /// the serum market(orderbook)
    #[account(mut)]
    pub serum_market: AccountInfo<'info>,
    /// the user's open orders account
    #[account(mut)]
    pub open_orders: AccountInfo<'info>,
    pub open_orders_owner: AccountInfo<'info>,
    #[account(mut)]
    pub request_queue: AccountInfo<'info>,
    #[account(mut)]
    pub event_queue: AccountInfo<'info>,
    #[account(mut)]
    pub bids: AccountInfo<'info>,
    #[account(mut)]
    pub asks: AccountInfo<'info>,
    /// The token mint address of "base" currency, aka the instrument long spl token
    #[account(mut)]
    pub coin_mint: AccountInfo<'info>,
    /// The vault for the "base" currency
    #[account(mut)]
    pub coin_vault: AccountInfo<'info>,
    /// The vault for the "quote" currency
    #[account(mut)]
    pub pc_vault: AccountInfo<'info>,
    /// serum market vault owner (pda)
    pub vault_signer: AccountInfo<'info>,
    /// the (coin or price currency) account paying for the order
    #[account(mut)]
    pub order_payer_token_account: AccountInfo<'info>,
    // pub market_authority: AccountInfo<'info>,
    /// the mint authoriity of both long and short spl tokens
    pub instrument_token_mint_authority_pda: AccountInfo<'info>,
    #[account(constraint = usdc_central_pool.key() == exchange.usdc_central_pool)]
    pub usdc_central_pool: AccountInfo<'info>,
    /// the instrument short spl token
    #[account(mut)]
    pub instrument_short_spl_token_mint: AccountInfo<'info>,
    pub serum_dex_program_id: AccountInfo<'info>,
    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

fn pay_order_fees(ctx: &Context<OrderContext>, notional: u64) -> ProgramResult {
    let exchange_key = &ctx.accounts.exchange.key();
    let (_pda, bump) = get_central_usdc_pool_auth_pda(&exchange_key.clone(), ctx.program_id);
    let seeds: &[&[&[u8]]] = &[&[
        PREFIX_CENTRAL_USDC_POOL_AUTH.as_bytes(),
        exchange_key.as_ref(),
        &[bump],
    ]];
    pay_fees(
        notional,
        ctx.accounts.token_program.clone(),
        ctx.accounts.user_margin_account.clone(),
        ctx.accounts.user.clone(),
        ctx.accounts.usdc_central_pool.clone(),
        Some(seeds),
    )
}

pub fn handle_place_order(
    ctx: Context<OrderContext>,
    side: OrderSide,
    limit: u64,
    max_coin_qty: u64,
    max_pc_qty: u64,
) -> ProgramResult {
    msg!("Creating new order instruction");
    let exchange = &ctx.accounts.exchange;
    let user_account = &ctx.accounts.user_account;
    let serum_market = &ctx.accounts.serum_market;
    let coin_mint = &ctx.accounts.coin_mint;
    let open_orders = &ctx.accounts.open_orders;
    let request_queue = &ctx.accounts.request_queue;
    let event_queue = &ctx.accounts.event_queue;
    let market_bids = &ctx.accounts.bids;
    let market_asks = &ctx.accounts.asks;
    let order_payer = &ctx.accounts.order_payer_token_account;
    let coin_vault = &ctx.accounts.coin_vault;
    let pc_vault = &ctx.accounts.pc_vault;
    let token_program = &ctx.accounts.token_program;
    let rent = &ctx.accounts.rent.to_account_info();
    let dex_program = &ctx.accounts.serum_dex_program_id;
    let user_instrument_long_token_vault = &ctx.accounts.user_instrument_long_token_vault;
    let user_instrument_short_token_vault = &ctx.accounts.user_instrument_short_token_vault;
    let instrument_short_spl_token_mint = &ctx.accounts.instrument_short_spl_token_mint;

    if user_account.is_in_liquidation {
        return Err(ErrorCode::CannotPlaceOrdersInLiquidation.into());
    }

    //pay_order_fees(&ctx, limit)?;

    // 0 is bid, 1 is ask - for the purpose of this, anything non-zero,
    // will be interpreted as ask
    let serum_side: Side;
    match side {
        OrderSide::Bid => serum_side = Side::Bid,
        OrderSide::Ask => serum_side = Side::Ask,
    }
    // =================================================================
    // TODO: make sure the user's margin account balance allows doing so
    // =================================================================
    // let user_margin_account = &ctx.accounts.user_margin_account;
    // let required_margin: u64 = 0; // TODO: call margin calc to get this number
    // if !is_margin_sufficient(user_margin_account.clone(), required_margin) {
    //     return Err(ErrorCode::InsufficientMargin.into());
    // }

    // mint the instrument spl token to the seller if it's an ask order
    if serum_side == Side::Ask {
        let instrument_token_mint_authority_pda = &ctx.accounts.instrument_token_mint_authority_pda;
        let serum_market_account_info = Market::load(serum_market, serum_market.owner)?;
        let amount_to_mint = max_coin_qty
            .checked_mul(serum_market_account_info.coin_lot_size)
            .ok_or(ErrorCode::NumericalOverflowError)? as u64;

        // mint long token to user
        mint_instrument_token_for_user(
            coin_mint,
            user_instrument_long_token_vault, // order_payer is the same as user_instrument_long_token_vault when the order is ask order
            amount_to_mint,
            token_program,
            ctx.program_id,
            &exchange.key(),
            instrument_token_mint_authority_pda,
        )?;

        // mint short token to user
        mint_instrument_token_for_user(
            instrument_short_spl_token_mint,
            user_instrument_short_token_vault,
            amount_to_mint,
            token_program,
            ctx.program_id,
            &exchange.key(),
            instrument_token_mint_authority_pda,
        )?;
        msg!("successfully minted spl tokens to the seller spl token account");
    }

    let exchange_key = exchange.clone().key();

    let (_market_auth, bump) = get_serum_market_auth_pda(&exchange_key, ctx.program_id);
    let signer_seeds: &[&[&[u8]]] = &[
        &[
            PREFIX_USER_ACCOUNT.as_bytes(),
            exchange_key.as_ref(),
            user_account.owner.as_ref(),
            &[user_account.bump],
        ],
        &[
            PREFIX_SERUM_MARKET_AUTH.as_bytes(),
            exchange_key.as_ref(),
            &[bump],
        ],
    ];

    msg!(
        "Open orders account owner is {}",
        open_orders.owner.to_string()
    );
    serum_new_order(
        signer_seeds,
        // user.key,
        serum_market,
        open_orders,
        request_queue,
        event_queue,
        market_bids,
        market_asks,
        order_payer,
        &user_account.to_account_info(), // user account is the owner of open orders account
        // user_account.bump,
        coin_vault,
        pc_vault,
        token_program,
        rent,
        dex_program,
        serum_side,
        limit,
        max_coin_qty,
        OrderType::Limit,
        max_pc_qty,
        ctx.program_id,
        &exchange.key(),
    )
}

fn is_margin_sufficient(user_margin_account: AccountInfo, amount_to_reserve: u64) -> bool {
    // TODO
    return false;
}

pub fn handle_cancel_order(
    ctx: Context<OrderContext>,
    side: OrderSide,
    order_id: u128,
) -> ProgramResult {
    let exchange = &ctx.accounts.exchange;
    let user = &ctx.accounts.user;
    let user_account = &ctx.accounts.user_account;
    let _optifi_market = &ctx.accounts.optifi_market;
    let serum_market = &ctx.accounts.serum_market;
    let coin_mint = &ctx.accounts.coin_mint;
    let open_orders = &ctx.accounts.open_orders;
    let event_queue = &ctx.accounts.event_queue;
    let market_bids = &ctx.accounts.bids;
    let market_asks = &ctx.accounts.asks;
    let order_payer = &ctx.accounts.order_payer_token_account;
    let open_orders_authority = &ctx.accounts.open_orders_owner;
    let token_program = &ctx.accounts.token_program;
    let dex_program = &ctx.accounts.serum_dex_program_id;
    let coin_vault = &ctx.accounts.coin_vault;
    let pc_vault = &ctx.accounts.pc_vault;
    let user_margin_account = &ctx.accounts.user_margin_account;
    let user_instrument_long_token_vault = &ctx.accounts.user_instrument_long_token_vault;
    let user_instrument_short_token_vault = &ctx.accounts.user_instrument_short_token_vault;
    let instrument_short_spl_token_mint = &ctx.accounts.instrument_short_spl_token_mint;

    if user_account.is_in_liquidation {
        return Err(ErrorCode::CannotPlaceOrdersInLiquidation.into());
    }

    // 0 is bid, 1 is ask - for the purpose of this, anything non-zero,
    // will be interpreted as ask
    let serum_side: Side;
    match side {
        OrderSide::Bid => serum_side = Side::Bid,
        OrderSide::Ask => serum_side = Side::Ask,
    }

    // get the order amount
    let mut order_amount: u64 = 0;
    let mut lot_size: u64 = 0;

    if serum_side == Side::Ask {
        let program_id = dex_program.key;
        let market = Market::load(serum_market, program_id)?;
        lot_size = market.coin_lot_size;

        // let mut bids = market.load_bids_mut(market_bids)?;
        let mut asks = market.load_asks_mut(market_asks)?;

        let key = asks
            .find_by_key(order_id)
            .ok_or(DexErrorCode::OrderNotFound)
            .unwrap();

        let node = asks.deref_mut().get(key).unwrap().as_leaf().unwrap();

        order_amount = node.quantity();
    }

    let exchange_key = exchange.key();

    let signer_seeds = &[
        PREFIX_USER_ACCOUNT.as_bytes(),
        exchange_key.as_ref(),
        user_account.owner.as_ref(),
        &[user_account.bump],
    ];
    msg!("cancelling the previous order");
    serum_cancel_order(
        // user.key,
        signer_seeds,
        dex_program,
        serum_market,
        market_bids,
        market_asks,
        open_orders,
        open_orders_authority,
        // user_account.bump,
        event_queue,
        serum_side,
        order_id,
        ctx.program_id,
        // exchange.key,
    )?;

    // let instrument_token_mint_authority_pda = &ctx.accounts.instrument_token_mint_authority_pda;
    let vault_signer = &ctx.accounts.vault_signer;
    // settle funds - get base tokens back
    serum_settle_funds_for_user(
        // user.key,
        signer_seeds,
        dex_program,
        serum_market,
        token_program,
        open_orders,
        open_orders_authority,
        // user_account.bump,
        coin_vault,
        user_instrument_long_token_vault,
        pc_vault,
        user_margin_account,
        vault_signer,
        &ctx.program_id,
        // exchange.key,
    )?;

    // burn the same amount of both instrument long and short tokens if ask side
    if serum_side == Side::Ask {
        let amount_to_burn = order_amount
            .checked_div(lot_size)
            .ok_or(ErrorCode::NumericalOverflowError)? as u64;
        // burn the long tokens
        burn_instrument_token_for_user(
            coin_mint,
            order_payer, // order_payer is the same as user_instrument_long_token_vault when the order is ask order
            user.key(),
            &user_account.to_account_info(),
            user_account.bump,
            amount_to_burn,
            token_program,
            &exchange.key(),
        )?;

        // burn the short tokens
        burn_instrument_token_for_user(
            instrument_short_spl_token_mint,
            user_instrument_short_token_vault,
            user.key(),
            &user_account.to_account_info(),
            user_account.bump,
            amount_to_burn,
            token_program,
            &exchange.key(),
        )?;

        msg!("successfully burn spl tokens to the seller spl token account");
    }
    Ok(())
}

pub fn handle_update_order(
    ctx: Context<OrderContext>,
    side: OrderSide,
    order_id: u128,
    limit: u64,
    max_coin_qty: u64,
    max_pc_qty: u64,
) -> ProgramResult {
    let exchange = &ctx.accounts.exchange;
    let user = &ctx.accounts.user;
    let user_account = &ctx.accounts.user_account;
    let _optifi_market = &ctx.accounts.optifi_market;
    let serum_market = &ctx.accounts.serum_market;
    let coin_mint = &ctx.accounts.coin_mint;
    let open_orders = &ctx.accounts.open_orders;
    let request_queue = &ctx.accounts.request_queue;
    let event_queue = &ctx.accounts.event_queue;
    let market_bids = &ctx.accounts.bids;
    let market_asks = &ctx.accounts.asks;
    let order_payer = &ctx.accounts.order_payer_token_account;
    let open_orders_authority = &ctx.accounts.open_orders_owner;
    let token_program = &ctx.accounts.token_program;
    let dex_program = &ctx.accounts.serum_dex_program_id;
    let coin_vault = &ctx.accounts.coin_vault;
    let pc_vault = &ctx.accounts.pc_vault;
    let user_margin_account = &ctx.accounts.user_margin_account;
    let user_instrument_long_token_vault = &ctx.accounts.user_instrument_long_token_vault;
    let user_instrument_short_token_vault = &ctx.accounts.user_instrument_short_token_vault;
    let rent = &ctx.accounts.rent.to_account_info();
    let instrument_short_spl_token_mint = &ctx.accounts.instrument_short_spl_token_mint;

    if user_account.is_in_liquidation {
        return Err(ErrorCode::CannotPlaceOrdersInLiquidation.into());
    }

    //pay_order_fees(&ctx, limit)?;

    // 0 is bid, 1 is ask - for the purpose of this, anything non-zero,
    // will be interpreted as ask
    let serum_side: Side;
    match side {
        OrderSide::Bid => serum_side = Side::Bid,
        OrderSide::Ask => serum_side = Side::Ask,
    }

    // get the order amount
    let mut order_amount: u64 = 0;
    let mut lot_size: u64 = 0;

    if serum_side == Side::Ask {
        let program_id = dex_program.key;
        let market = Market::load(serum_market, program_id)?;
        lot_size = market.coin_lot_size;

        // let mut bids = market.load_bids_mut(market_bids)?;
        let mut asks = market.load_asks_mut(market_asks)?;

        let key = asks
            .find_by_key(order_id)
            .ok_or(DexErrorCode::OrderNotFound)
            .unwrap();

        let node = asks.deref_mut().get(key).unwrap().as_leaf().unwrap();

        order_amount = node.quantity();
    }

    let exchange_key = exchange.key();

    let signer_seeds = &[
        PREFIX_USER_ACCOUNT.as_bytes(),
        exchange_key.as_ref(),
        user_account.owner.as_ref(),
        &[user_account.bump],
    ];

    msg!("cancelling the previous order");
    serum_cancel_order(
        signer_seeds,
        // user.key,
        dex_program,
        serum_market,
        market_bids,
        market_asks,
        open_orders,
        open_orders_authority,
        // user_account.bump,
        event_queue,
        serum_side,
        order_id,
        ctx.program_id,
        // exchange.key,
    )?;

    let vault_signer = &ctx.accounts.vault_signer;
    // settle funds - get base tokens back
    serum_settle_funds_for_user(
        // user.key,
        signer_seeds,
        dex_program,
        serum_market,
        token_program,
        open_orders,
        open_orders_authority,
        // user_account.bump,
        coin_vault,
        user_instrument_long_token_vault,
        pc_vault,
        user_margin_account,
        vault_signer,
        &ctx.program_id,
        // exchange.key,
    )?;

    // burn the same amount of both instrument long and short tokens if ask side
    if serum_side == Side::Ask {
        let amount_to_burn = order_amount
            .checked_div(lot_size)
            .ok_or(ErrorCode::NumericalOverflowError)? as u64;
        // burn the long tokens
        burn_instrument_token_for_user(
            coin_mint,
            order_payer, // order_payer is the same as user_instrument_long_token_vault when the order is ask order
            user.key(),
            &user_account.to_account_info(),
            user_account.bump,
            amount_to_burn,
            token_program,
            &exchange.key(),
        )?;

        // burn the short tokens
        burn_instrument_token_for_user(
            instrument_short_spl_token_mint,
            user_instrument_short_token_vault,
            user.key(),
            &user_account.to_account_info(),
            user_account.bump,
            amount_to_burn,
            token_program,
            &exchange.key(),
        )?;
        msg!("successfully burn spl tokens to the seller spl token account");
    }

    // place a new order
    // mint the instrument spl token to the seller if it's an ask order
    if serum_side == Side::Ask {
        let instrument_token_mint_authority_pda = &ctx.accounts.instrument_token_mint_authority_pda;
        let serum_market_account_info = Market::load(serum_market, serum_market.owner)?;
        let amount_to_mint = max_coin_qty
            .checked_mul(serum_market_account_info.coin_lot_size)
            .ok_or(ErrorCode::NumericalOverflowError)? as u64;

        // mint long token to user
        mint_instrument_token_for_user(
            coin_mint,
            order_payer, // order_payer is the same as user_instrument_long_token_vault when the order is ask order
            amount_to_mint,
            token_program,
            ctx.program_id,
            &exchange.key(),
            instrument_token_mint_authority_pda,
        )?;

        // mint short token to user
        mint_instrument_token_for_user(
            instrument_short_spl_token_mint,
            user_instrument_short_token_vault,
            amount_to_mint,
            token_program,
            ctx.program_id,
            &exchange.key(),
            instrument_token_mint_authority_pda,
        )?;
        msg!("successfully minted spl tokens to the seller spl token account");
    }

    let exchange_key = exchange.key();

    let signer_seeds = &[
        PREFIX_USER_ACCOUNT.as_bytes(),
        exchange_key.as_ref(),
        user_account.owner.as_ref(),
        &[user_account.bump],
    ];

    msg!(
        "Open orders account owner is {}",
        open_orders.owner.to_string()
    );

    serum_new_order(
        &[signer_seeds],
        // user.key,
        serum_market,
        open_orders,
        request_queue,
        event_queue,
        market_bids,
        market_asks,
        order_payer,
        &user_account.to_account_info(),
        // user_account.bump,
        coin_vault,
        pc_vault,
        token_program,
        rent,
        dex_program,
        serum_side,
        limit,
        max_coin_qty,
        OrderType::Limit,
        max_pc_qty,
        ctx.program_id,
        &exchange.key(),
    )
}
