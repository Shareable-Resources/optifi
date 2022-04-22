use crate::state::{OptifiMarket, UserAccount};
use crate::utils::PREFIX_USER_ACCOUNT;
use crate::{serum_settle_funds_for_user, Exchange};
use anchor_lang::prelude::*;
use anchor_spl::token::Token;

#[derive(Accounts)]
pub struct OrderSettlement<'info> {
    pub optifi_exchange: ProgramAccount<'info, Exchange>,

    #[account(mut)]
    pub user_account: ProgramAccount<'info, UserAccount>,

    #[account(mut, constraint = !optifi_market.is_stopped)]
    pub optifi_market: ProgramAccount<'info, OptifiMarket>,

    #[account(mut, constraint = serum_market.key() == optifi_market.serum_market)]
    pub serum_market: AccountInfo<'info>,

    #[account(mut)]
    pub user_serum_open_orders: AccountInfo<'info>,

    #[account(mut)]
    pub coin_vault: AccountInfo<'info>,

    #[account(mut)]
    pub pc_vault: AccountInfo<'info>,

    #[account(mut)]
    pub user_instrument_long_token_vault: AccountInfo<'info>,

    #[account(mut)]
    pub user_margin_account: AccountInfo<'info>,

    #[account(mut)]
    pub vault_signer: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,

    pub serum_dex_program_id: AccountInfo<'info>,
}

pub fn handler(ctx: Context<OrderSettlement>) -> ProgramResult {
    let optifi_exchange = &ctx.accounts.optifi_exchange;
    let user_account = &ctx.accounts.user_account;
    let dex_program = &ctx.accounts.serum_dex_program_id;
    let serum_market = &ctx.accounts.serum_market;
    let token_program = &ctx.accounts.token_program;
    let user_serum_open_orders = &ctx.accounts.user_serum_open_orders;
    let coin_vault = &ctx.accounts.coin_vault;
    let pc_vault = &ctx.accounts.pc_vault;
    let vault_signer = &ctx.accounts.vault_signer;
    let user_instrument_long_token_vault = &ctx.accounts.user_instrument_long_token_vault;
    let user_margin_account = &ctx.accounts.user_margin_account;

    let signer_seeds = &[
        PREFIX_USER_ACCOUNT.as_bytes(),
        optifi_exchange.to_account_info().key.as_ref(),
        user_account.owner.as_ref(),
        &[user_account.bump],
    ];
    serum_settle_funds_for_user(
        // &user_account.owner,
        signer_seeds,
        dex_program,
        serum_market,
        token_program,
        user_serum_open_orders,
        &user_account.to_account_info(),
        // user_account.bump,
        coin_vault,
        user_instrument_long_token_vault,
        pc_vault,
        user_margin_account,
        vault_signer,
        &ctx.program_id,
        // &optifi_exchange.key(),
    )?;
    Ok(())
}
