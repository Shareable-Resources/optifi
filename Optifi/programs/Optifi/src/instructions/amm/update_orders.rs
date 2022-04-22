use crate::errors::ErrorCode;
use crate::instructions::order::{
    mint_instrument_token_for_user,
    serum_utils::{serum_new_order, serum_prune_orders_for_user},
};
use crate::serum_utils::serum_settle_funds_for_user;
use crate::state::{AmmAccount, AmmState, OptifiMarket};
use crate::utils::PREFIX_AMM_LIQUIDITY_AUTH;
use crate::{u_to_f_repr, uvec_to_fvec_repr};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, accessor::amount};
use serum_dex::matching::{OrderType, Side};
use serum_dex::state::Market;

#[derive(Accounts)]
#[instruction(order_limit: u16, instrument_index: u16)]
pub struct UpdateAmmOrders<'info> {
    /// optifi exchange account
    pub optifi_exchange: AccountInfo<'info>,
    /// the amm to update oders for
    #[account(mut)]
    pub amm: ProgramAccount<'info, AmmAccount>,
    /// amm's margin account(usdc vault) which is controlled by amm_authority (a pda)
    #[account(mut)]
    pub amm_usdc_vault: AccountInfo<'info>,
    /// the authority of amm's amm_usdc_vault
    pub amm_authority: AccountInfo<'info>,
    /// amm's instrument long spl token account
    #[account(mut)]
    pub amm_instrument_long_token_vault: AccountInfo<'info>,
    /// amm's instrument short spl token account
    #[account(mut)]
    pub amm_instrument_short_token_vault: AccountInfo<'info>,
    /// optifi market that binds an instrument with a serum market(orderbook)
    /// it's also the mint authority of the instrument spl token
    #[account(has_one = serum_market, constraint = amm.trading_instruments[instrument_index as usize] == optifi_market.instrument)]
    pub optifi_market: ProgramAccount<'info, OptifiMarket>,
    /// the serum market(orderbook)
    #[account(mut)]
    pub serum_market: AccountInfo<'info>,
    /// amm's open orders account for this optifi market,
    /// its owner is amm account(pda)
    #[account(mut)]
    pub open_orders: AccountInfo<'info>,
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
    // #[account(mut)]
    // pub order_payer_base_token_account: AccountInfo<'info>,
    // #[account(mut)]
    // pub order_payer_pc_token_account: AccountInfo<'info>,
    // pub market_authority: AccountInfo<'info>,
    /// the mint authoriity of both long and short spl tokens
    pub instrument_token_mint_authority_pda: AccountInfo<'info>,
    /// the instrument short spl token
    #[account(mut)]
    pub instrument_short_spl_token_mint: AccountInfo<'info>,
    pub prune_authority: AccountInfo<'info>,
    pub serum_dex_program_id: AccountInfo<'info>,
    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

/// Submit orders in order proposal - for executing crankers to call
pub fn handler(
    ctx: Context<UpdateAmmOrders>,
    order_limit: u16,
    instrument_index: u16,
    amm_authority_bump: u8,
) -> ProgramResult {
    let amm = &mut ctx.accounts.amm;
    msg!("instrument keys: {:?}", amm.trading_instruments);
    if amm.state != AmmState::Execute {
        return Err(ErrorCode::WrongState.into());
    }

    let exchange = &ctx.accounts.optifi_exchange;
    // let _optifi_market = &ctx.accounts.optifi_market;
    // here we may change the owner of amm's serum accounts to another light weight pda account
    // the amm itself might be too heavy to clone
    let open_orders_account_owner = &ctx.accounts.amm_authority;
    let bump = amm_authority_bump;

    let serum_market = &ctx.accounts.serum_market;
    let coin_mint = &ctx.accounts.coin_mint;
    let open_orders = &ctx.accounts.open_orders;
    let request_queue = &ctx.accounts.request_queue;
    let event_queue = &ctx.accounts.event_queue;
    let market_bids = &ctx.accounts.bids;
    let market_asks = &ctx.accounts.asks;
    // let order_payer = &ctx.accounts.order_payer_token_account;
    let coin_vault = &ctx.accounts.coin_vault;
    let pc_vault = &ctx.accounts.pc_vault;
    let token_program = &ctx.accounts.token_program;
    let rent = &ctx.accounts.rent.to_account_info();
    let dex_program = &ctx.accounts.serum_dex_program_id;
    let instrument_short_spl_token_mint = &ctx.accounts.instrument_short_spl_token_mint;
    let amm_usdc_vault = &ctx.accounts.amm_usdc_vault;
    let amm_instrument_long_token_vault = &ctx.accounts.amm_instrument_long_token_vault;
    let amm_instrument_short_token_vault = &ctx.accounts.amm_instrument_short_token_vault;
    let prune_authority = &ctx.accounts.prune_authority;

    if amm.flags[instrument_index as usize] == true {
        return Err(ErrorCode::WrongInstrument.into());
    }

    let order_proposal = amm
        .proposals
        .get_mut(instrument_index as usize)
        .ok_or(ErrorCode::WrongInstrument)?;

    let ask_orders_prices: &mut Vec<f64> = &mut uvec_to_fvec_repr!(order_proposal.ask_orders_price);
    let ask_orders_sizes: &mut Vec<f64> = &mut uvec_to_fvec_repr!(order_proposal.ask_orders_size);
    let bid_orders_prices: &mut Vec<f64> = &mut uvec_to_fvec_repr!(order_proposal.bid_orders_price);
    let bid_orders_sizes: &mut Vec<f64> = &mut uvec_to_fvec_repr!(order_proposal.bid_orders_size);

    // Cancel previous orders if first cranker
    if !order_proposal.is_started {
        // cancel previous orders
        serum_prune_orders_for_user(
            dex_program,
            serum_market,
            market_bids,
            market_asks,
            prune_authority,
            open_orders,
            open_orders_account_owner,
            bump,
            event_queue,
            &ctx.program_id,
            &exchange.key(),
        )?;

        let vault_signer = &ctx.accounts.vault_signer;
        // TODO: use the right signer seeds of authority of AMM's open orders account
        let signer_seeds = &[
            PREFIX_AMM_LIQUIDITY_AUTH.as_bytes(),
            exchange.key.as_ref(),
            &[bump],
        ];

        serum_settle_funds_for_user(
            signer_seeds,
            // &amm_immut.key(),
            dex_program,
            serum_market,
            token_program,
            open_orders,
            open_orders_account_owner,
            // amm_immut.bump,
            coin_vault,
            amm_instrument_long_token_vault,
            pc_vault,
            amm_usdc_vault,
            vault_signer,
            &ctx.program_id,
            // &exchange.key(),
        )?;
        // set is_started to true
        order_proposal.is_started = true;
    }

    let mut order_limit = order_limit as usize;
    order_limit = order_limit.min(ask_orders_prices.len());

    msg!("ask_orders_prices: {:?}", ask_orders_prices);
    msg!("ask_orders_sizes: {:?}", ask_orders_sizes);
    msg!("bid_orders_prices: {:?}", bid_orders_prices);
    msg!("bid_orders_sizes: {:?}", bid_orders_sizes);

    let quote_size = u_to_f_repr!(amm.contract_size);
    for _i in 0..order_limit {
        // execute an order in ask side
        let order_price = ask_orders_prices.pop().unwrap();
        let order_size = ask_orders_sizes.pop().unwrap();

        let decimals = 6; //   TODO: How to get the USDC decimals ?
        let limit = (order_price * 10_i32.pow(decimals) as f64) as u64;

        let max_coin_qty = (order_size / quote_size) as u64;
        let max_pc_qty = max_coin_qty * limit;

        let serum_side = Side::Ask;
        let order_payer = &ctx.accounts.amm_instrument_long_token_vault;

        // mint the instrument spl token to the seller if it's an ask order
        let instrument_token_mint_authority_pda = &ctx.accounts.instrument_token_mint_authority_pda;
        let serum_market_account_info = Market::load(serum_market, serum_market.owner)?;

        // only mint the gap between the amount to sell and the long token balance
        let amount_to_sell = max_coin_qty
            .checked_mul(serum_market_account_info.coin_lot_size)
            .ok_or(ErrorCode::NumericalOverflowError)? as u64;
        let long_token_balance = amount(amm_instrument_long_token_vault).unwrap();
        if long_token_balance < amount_to_sell {
            let amount_to_mint = amount_to_sell
                .checked_sub(long_token_balance)
                .ok_or(ErrorCode::NumericalOverflowError)?;
            // mint long token to amm
            mint_instrument_token_for_user(
                coin_mint,
                order_payer, // order_payer is the same as user_instrument_long_token_vault when the order is ask order
                amount_to_mint,
                token_program,
                &ctx.program_id,
                &exchange.key(),
                instrument_token_mint_authority_pda,
            )?;

            // mint short token to amm
            mint_instrument_token_for_user(
                instrument_short_spl_token_mint,
                amm_instrument_short_token_vault,
                amount_to_mint,
                token_program,
                &ctx.program_id,
                &exchange.key(),
                instrument_token_mint_authority_pda,
            )?;
            msg!("successfully minted spl tokens to the seller spl token account");
        }

        // TODO: use the right signer seeds of authority of AMM's open orders account
        let signer_seeds = &[
            PREFIX_AMM_LIQUIDITY_AUTH.as_bytes(),
            exchange.key.as_ref(),
            &[bump],
        ];

        serum_new_order(
            &[signer_seeds],
            serum_market,
            open_orders,
            request_queue,
            event_queue,
            market_bids,
            market_asks,
            order_payer,
            open_orders_account_owner, // amm account is the owner of its open orders account
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
            &ctx.program_id,
            &exchange.key(),
        )?;

        // execute an order in bid side
        // note that no need to mint long/short token here
        let order_price = bid_orders_prices.pop().unwrap();
        let order_size = bid_orders_sizes.pop().unwrap();

        let limit = (order_price * 10_i32.pow(decimals) as f64) as u64;
        let max_coin_qty = (order_size / quote_size) as u64;
        let max_pc_qty = max_coin_qty * limit;

        let serum_side = Side::Bid;
        let order_payer = &ctx.accounts.amm_usdc_vault;

        serum_new_order(
            &[signer_seeds],
            serum_market,
            open_orders,
            request_queue,
            event_queue,
            market_bids,
            market_asks,
            order_payer,
            open_orders_account_owner, // amm account is the owner of its open orders account
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
            &ctx.program_id,
            &exchange.key(),
        )?;
    }

    // if the length of orders in the proposal is 0, all orders are executed,
    // so set the flag for this instrument to true
    if ask_orders_prices.len() == 0 {
        amm.flags[instrument_index as usize] = true;
    }

    // if all proposals for all instrumnents have been executed,
    // move to next state of AMM, and reset all flags to false
    if amm.flags.iter().all(|&flag| flag == true) {
        amm.move_to_next_state();
        for f in amm.flags.iter_mut() {
            *f = false;
        }
    }
    Ok(())
}
