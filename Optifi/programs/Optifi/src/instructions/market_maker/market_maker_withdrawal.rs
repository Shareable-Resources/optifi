use crate::constants::SECS_IN_HOUR;
use crate::errors::ErrorCode;
use crate::state::market_maker_account::MarketMakerAccount;
use crate::state::UserAccount;
use crate::utils::{get_market_maker_pool_auth_pda, PREFIX_MM_LIQUIDITY_AUTH};
use anchor_lang::prelude::*;
use anchor_spl::token::accessor;
use anchor_spl::token::accessor::{amount, mint};
use anchor_spl::token::{self, Transfer};
use solana_program::clock::SECONDS_PER_DAY;

#[derive(Accounts)]
pub struct ScheduleMarketMakerWithdrawal<'info> {
    #[account(constraint = user_account.owner == user.key())]
    pub user_account: ProgramAccount<'info, UserAccount>,

    #[account(mut, constraint = market_maker_account.user_account == user_account.key())]
    pub market_maker_account: ProgramAccount<'info, MarketMakerAccount>,

    #[account(mut, constraint = liquidity_pool.key() == market_maker_account.liquidity_pool.key())]
    pub liquidity_pool: AccountInfo<'info>,

    #[account(signer)]
    pub user: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,
}

pub fn schedule_handler(
    withdrawal_amount: u64,
    ctx: Context<ScheduleMarketMakerWithdrawal>,
) -> ProgramResult {
    let mut mm_acount = &mut ctx.accounts.market_maker_account;
    let day_from_now = &ctx.accounts.clock.epoch + SECONDS_PER_DAY;

    if mm_acount.withdraw_ts != 0 && mm_acount.withdraw_ts <= day_from_now {
        msg!(
            "Cannot initiate new withdrawal before active request for {} expires",
            mm_acount.withdraw_ts
        );
        return Err(ErrorCode::WithdrawRequestInvalid.into());
    }

    let current_liquidity = amount(&ctx.accounts.liquidity_pool)?;

    // TODO: check whether they're allowed to withdraw this amount

    if withdrawal_amount >= current_liquidity {
        return Err(ErrorCode::WithdrawRequestInvalid.into());
    }

    msg!("Setting new withdrawal request for {}", day_from_now);
    mm_acount.withdraw_ts = day_from_now;
    mm_acount.withdrawal_amount = withdrawal_amount;

    Ok(())
}

#[derive(Accounts)]
pub struct ExecuteMarketMakerWithdrawal<'info> {
    pub optifi_exchange: AccountInfo<'info>,

    #[account(constraint = user_account.owner == user.key())]
    pub user_account: ProgramAccount<'info, UserAccount>,

    #[account(constraint = accessor::mint(&destination) == accessor::mint(&liquidity_pool))]
    pub destination: AccountInfo<'info>,

    #[account(mut, constraint = market_maker_account.user_account == user_account.key())]
    pub market_maker_account: ProgramAccount<'info, MarketMakerAccount>,

    #[account(mut, constraint = liquidity_pool.key() == market_maker_account.liquidity_pool)]
    pub liquidity_pool: AccountInfo<'info>,

    #[account(constraint = liquidity_pool_auth.key() == accessor::authority(&liquidity_pool)?)]
    pub liquidity_pool_auth: AccountInfo<'info>,

    #[account(signer)]
    pub user: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,

    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
}

impl<'info> ExecuteMarketMakerWithdrawal<'info> {
    fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.clone(),
            Transfer {
                from: self.liquidity_pool.clone(),
                to: self.destination.clone(),
                authority: self.liquidity_pool_auth.clone(),
            },
        )
    }
}

pub fn withdrawal_handler(ctx: Context<ExecuteMarketMakerWithdrawal>) -> ProgramResult {
    let now_ts = ctx.accounts.clock.epoch as u64;

    if ctx.accounts.market_maker_account.withdraw_ts == 0 {
        msg!("Withdraw requested without having been initialized");
        return Err(ErrorCode::MMWithdrawNotInWindow.into());
    }

    let mm_account = &ctx.accounts.market_maker_account;

    let window_start = mm_account.withdraw_ts;
    let window_end = mm_account.withdraw_ts + SECS_IN_HOUR;

    if !(window_start <= now_ts && now_ts <= window_end) {
        msg!("Withdraw outside of valid window");
        return Err(ErrorCode::MMWithdrawNotInWindow.into());
    }

    msg!("Executing withdrawal");
    let optifi_exchange = &ctx.accounts.optifi_exchange;
    let transfer_context = ctx.accounts.transfer_context();
    token::transfer(
        transfer_context.with_signer(&[&[
            &PREFIX_MM_LIQUIDITY_AUTH.as_bytes(),
            &optifi_exchange.key().as_ref(),
            mm_account.key().as_ref(),
        ]]),
        mm_account.withdrawal_amount,
    )?;

    ctx.accounts.market_maker_account.withdraw_ts = 0;
    ctx.accounts.market_maker_account.withdrawal_amount = 0;
    Ok(())
}
