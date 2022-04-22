use crate::state::market_maker_account::MarketMakerAccount;
use crate::state::UserAccount;
use crate::utils::{get_market_maker_pool_auth_pda, PREFIX_MARKET_MAKER};
use crate::Exchange;
use anchor_lang::prelude::*;
use anchor_spl::token::accessor;
use std::mem::size_of;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct RegisterMarketMaker<'info> {
    pub optifi_exchange: ProgramAccount<'info, Exchange>,
    pub user_account: ProgramAccount<'info, UserAccount>,

    #[account(init,
    seeds=[
        PREFIX_MARKET_MAKER.as_bytes(),
        optifi_exchange.key().as_ref(),
        user_account.key().as_ref()
    ],
    payer=owner,
    bump=bump,
    space=size_of::<MarketMakerAccount>())
    ]
    pub market_maker_account: ProgramAccount<'info, MarketMakerAccount>,

    #[account(constraint =
            accessor::mint(&liquidity_pool)? == optifi_exchange.usdc_mint &&
            accessor::authority(&liquidity_pool)? == get_market_maker_pool_auth_pda(
                                                            &optifi_exchange.key(),
                                                            &market_maker_account.key(),
                                                            program_id).0
    )]
    pub liquidity_pool: AccountInfo<'info>,

    #[account(signer, constraint = owner.key() == user_account.owner)]
    pub owner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<RegisterMarketMaker>) -> ProgramResult {
    let market_maker = &mut ctx.accounts.market_maker_account;
    // Set the market maker account as active
    market_maker.active = true;
    market_maker.user_account = ctx.accounts.user_account.key();
    market_maker.liquidity_pool = ctx.accounts.liquidity_pool.key();
    market_maker.withdraw_ts = 0;
    market_maker.withdrawal_amount = 0;

    Ok(())
}
