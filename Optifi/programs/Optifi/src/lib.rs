use anchor_lang::prelude::*;
pub mod constants;
pub mod errors;
pub mod financial;
pub mod instructions;
mod macros;
pub mod state;
pub mod utils;

use financial::OrderSide;
use instructions::*;
use state::amm_state::AmmAccount;
use state::exchange::Exchange;

#[cfg(feature = "mainnet")]
#[cfg(feature = "testing")]
declare_id!("hjo3CZHSkssq4df3uhYPEuJMdAstA6qc3EEYNDXAxvW");

#[cfg(feature = "mainnet")]
#[cfg(not(feature = "testing"))]
declare_id!("hjo3CZHSkssq4df3uhYPEuJMdAstA6qc3EEYNDXAxvW");

#[cfg(feature = "devnet")]
#[cfg(feature = "testing")]
declare_id!("6y5xgEHE6akEVG59uXkAHffWpuafSiowk9T4Cz9zYKQB");

#[cfg(feature = "devnet")]
#[cfg(not(feature = "testing"))]
declare_id!("hjo3CZHSkssq4df3uhYPEuJMdAstA6qc3EEYNDXAxvW");

#[program]
pub mod optifi_exchange {
    use super::*;
    use std::cmp::max;

    /// Initialize OptiFi Exchange
    pub fn initialize(
        ctx: Context<InitializeOptiFiExchange>,
        bump: u8,
        data: InitializeExchangeData,
    ) -> ProgramResult {
        msg!("start to initialize optifi exchange");
        // Ok(())
        instructions::init_optifi_exchange::handler(ctx, bump, data)
    }

    /// Create a new instrument with specified data
    /// do we need such accounts to hold instrument specifier data?
    pub fn create_new_instrument(
        ctx: Context<CreateInstrument>,
        bump: u8,
        data: ChainData,
    ) -> ProgramResult {
        instructions::chain_instructions::handler(ctx, bump, data)
    }

    /// Initialize a new serum market(orderbook)
    pub fn initialize_serum_orderbook(
        ctx: Context<InitializeSerumMarket>,
        authority_pk: Option<Pubkey>,
        prune_authority_pk: Option<Pubkey>,
        coin_lot_size: u64,
        pc_lot_size: u64,
        vault_signer_nonce: u64,
        pc_dust_threshold: u64,
    ) -> ProgramResult {
        instructions::create_serum_market::handler(
            ctx,
            authority_pk,
            prune_authority_pk,
            coin_lot_size,
            pc_lot_size,
            vault_signer_nonce,
            pc_dust_threshold,
        )
    }

    /// Create a new optifi market with an instrument listed on it
    pub fn create_optifi_market(ctx: Context<CreateOptifiMarket>, bump: u8) -> ProgramResult {
        instructions::optifi_market::handle_create_optifi_market(ctx, bump)
    }

    /// Init an open orders for the user to place orders on an optifi market
    pub fn init_user_on_optifi_market(
        ctx: Context<InitUserOnOptifiMarket>,
        bump: u8,
    ) -> ProgramResult {
        instructions::optifi_market::handle_init_user_on_optifi_market(ctx, bump)
    }

    /// Init an open orders account for the amm to place orders on an optifi market
    pub fn init_amm_on_optifi_market(
        ctx: Context<InitAMMOnOptifiMarket>,
        bump: u8,
    ) -> ProgramResult {
        instructions::optifi_market::handle_init_amm_on_optifi_market(ctx, bump)
    }

    /// Update a stopped optifi market with a new instrument
    pub fn update_optifi_market(ctx: Context<UpdateOptifiMarket>) -> ProgramResult {
        instructions::optifi_market::handle_update_optifi_market(ctx)
    }

    /// Submit a new order
    pub fn place_order(
        ctx: Context<OrderContext>,
        side: OrderSide,
        limit: u64,
        max_coin_qty: u64,
        max_pc_qty: u64,
    ) -> ProgramResult {
        instructions::order::handle_place_order(ctx, side, limit, max_coin_qty, max_pc_qty)
    }

    /// Update a previously placed order
    pub fn update_order(
        ctx: Context<OrderContext>,
        side: OrderSide,
        limit: u64,
        max_coin_qty: u64,
        max_pc_qty: u64,
        order_id: u128,
    ) -> ProgramResult {
        instructions::order::handle_update_order(
            ctx,
            side,
            order_id,
            limit,
            max_coin_qty,
            max_pc_qty,
        )
    }

    /// Cancel a previously placed order
    pub fn cancel_order(
        ctx: Context<OrderContext>,
        side: OrderSide,
        order_id: u128,
    ) -> ProgramResult {
        instructions::order::handle_cancel_order(ctx, side, order_id)
    }

    /// Initialize user's optifi account
    pub fn init_user_account(
        ctx: Context<InitializeUserAccount>,
        bump: InitUserAccountBumpSeeds,
    ) -> ProgramResult {
        instructions::initialize_user_account::handler(ctx, bump)
    }

    /// Deposit a supported underlying asset into your wallet
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        instructions::deposit::handler(ctx, amount)
    }

    /// Withdrawal a supported underlying asset from your wallet
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        instructions::withdraw::handler(ctx, amount)
        // instructions::withdraw::handler2(ctx, amount)
    }

    /// Fund settlement - cranker function
    /// Record pnl for one user on one optifi market(one instruments)
    pub fn record_pnl_for_one_user(ctx: Context<RecordPnLForOneUser>) -> ProgramResult {
        instructions::optifi_market::record_pnl_for_one_user(ctx)
    }

    /// Fund settlement - cranker function
    /// Settle fund for one user for all markets with same expiry date - simultaneous settlement
    pub fn settle_fund_for_one_user(ctx: Context<SettleMarketFundForOneUser>) -> ProgramResult {
        instructions::optifi_market::settle_market_fund_for_one_user(ctx)
    }

    pub fn settle_order_funds(ctx: Context<OrderSettlement>) -> ProgramResult {
        instructions::order::order_settlement::handler(ctx)
    }

    /// Initialize AMM
    pub fn initialize_amm(
        ctx: Context<InitializeAMM>,
        bump: u8,
        data: InitializeAMMData,
    ) -> ProgramResult {
        instructions::amm::initialize_amm::handler(ctx, bump, data)
    }

    /// Deposit funds to AMM
    pub fn amm_deposit(ctx: Context<DepositToAMM>, amount: u64) -> ProgramResult {
        instructions::amm::amm_deposit::handler(ctx, amount)
    }

    /// Withdraw funds from AMM
    pub fn amm_withdraw(ctx: Context<WithdrawFromAMM>, amount: u64) -> ProgramResult {
        instructions::amm::amm_withdraw::handler(ctx, amount)
    }

    /// Sync AMM opsitions
    pub fn amm_sync_positions(ctx: Context<SyncPositions>, instrument_index: u16) -> ProgramResult {
        instructions::amm::sync_positions::handler(ctx, instrument_index)
    }
    /// Calculate AMM delta
    pub fn amm_calculate_delta(ctx: Context<CalculateAmmDelta>) -> ProgramResult {
        instructions::amm::calculate_delta::handler(ctx)
    }
    /// Calculate orders to update and save the orders in proposal
    pub fn amm_calculate_proposal(ctx: Context<CalculateAmmProposal>) -> ProgramResult {
        instructions::amm::calculate_proposal::handler(ctx)
    }
    /// Update AMM orders
    pub fn amm_update_orders(
        ctx: Context<UpdateAmmOrders>,
        order_limit: u16,
        instrument_index: u16,
        amm_authority_bump: u8,
    ) -> ProgramResult {
        instructions::amm::update_orders::handler(
            ctx,
            order_limit,
            instrument_index,
            amm_authority_bump,
        )
    }
    /// Remove instrument for AMM
    pub fn amm_remove_instrument(
        ctx: Context<RemoveOptiFiMarketForAMM>,
        instrument_index: u16,
    ) -> ProgramResult {
        instructions::amm::remove_instrument_handler(ctx, instrument_index)
    }
    /// Add instrument for AMM
    pub fn amm_add_instrument(ctx: Context<AddOptiFiMarketForAMM>) -> ProgramResult {
        instructions::amm::add_instrument_handler(ctx)
    }

    /// Register as a market maker
    pub fn register_market_maker(ctx: Context<RegisterMarketMaker>, bump: u8) -> ProgramResult {
        instructions::market_maker::register_market_maker::handler(ctx)
    }

    /// Deregister as a market maker
    pub fn deregister_market_maker(ctx: Context<DeregisterMarketMaker>) -> ProgramResult {
        instructions::market_maker::deregister_market_maker::handler(ctx)
    }

    pub fn init_liquidation(ctx: Context<InitializeLiquidation>) -> ProgramResult {
        instructions::liquidations::init_liquidation::handler(ctx)
    }

    pub fn register_liquidation_market(ctx: Context<RegisterLiquidationMarket>) -> ProgramResult {
        instructions::liquidations::register_liquidation_market::handler(ctx)
    }

    pub fn liquidate_position(
        ctx: Context<LiquidatePosition>,
        max_coin_qty: u64,
        max_pc_qty: u64,
    ) -> ProgramResult {
        instructions::liquidations::liquidate_position::handler(ctx, max_coin_qty, max_pc_qty)
    }

    pub fn schedule_market_maker_withdrawal(
        ctx: Context<ScheduleMarketMakerWithdrawal>,
        amount: u64,
    ) -> ProgramResult {
        instructions::market_maker::market_maker_withdrawal::schedule_handler(amount, ctx)
    }
}
