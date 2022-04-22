use crate::errors::ErrorCode;
use crate::floor;
use crate::state::user_account::UserAccount;
use crate::state::AmmAccount;
use crate::utils::{get_amm_liquidity_auth_pda, PREFIX_AMM_LIQUIDITY_AUTH};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Transfer};

#[derive(Accounts)]
pub struct DepositToAMM<'info> {
    pub optifi_exchange: AccountInfo<'info>,
    /// the amm to which user will deposits funds
    pub amm: Account<'info, AmmAccount>,

    /// user account - also the pda that controls the user's spl token accounts
    #[account(mut, constraint= user_account.owner == user.key())]
    pub user_account: Account<'info, UserAccount>,

    // /// The quote token mint of the amm
    // pub amm_quote_token_mint: AccountInfo<'info>,
    ///  The quote token vault of amm - usdc vault
    #[account(mut, constraint = amm_quote_token_vault.key == &amm.quote_token_vault )]
    pub amm_quote_token_vault: AccountInfo<'info>,

    /// user's quote token vault from which user will transfer funds
    ///
    /// TODO: this account's owner/authority should be user or user_account?
    #[account(mut)]
    pub user_quote_token_vault: AccountInfo<'info>,

    /// amm's lp token mint address
    #[account(mut, constraint = lp_token_mint.mint_authority.unwrap() == get_amm_liquidity_auth_pda(&optifi_exchange.key(), program_id).0)]
    pub lp_token_mint: Account<'info, Mint>,

    /// amm's lp token mint authority, and usdc vault authority
    pub amm_liquidity_auth: AccountInfo<'info>,

    /// user's token vault for receiving lp tokens
    #[account(mut)]
    pub user_lp_token_vault: AccountInfo<'info>,

    /// The user that owns the deposits
    #[account(signer)]
    pub user: AccountInfo<'info>,

    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
}

impl<'info> DepositToAMM<'info> {
    fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        // self.vault_account

        CpiContext::new(
            self.token_program.clone(),
            Transfer {
                from: self.user_quote_token_vault.clone(),
                to: self.amm_quote_token_vault.to_account_info(),
                authority: self.user.clone(),
            },
        )
    }

    fn mint_to_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        CpiContext::new(
            self.token_program.clone(),
            MintTo {
                mint: self.lp_token_mint.to_account_info(),
                to: self.user_lp_token_vault.clone(),
                authority: self.amm_liquidity_auth.clone(),
            },
        )
    }
}

/// Deposit tokens into amm
pub fn handler(ctx: Context<DepositToAMM>, amount: u64) -> ProgramResult {
    require!(amount > 0, ErrorCode::NumericalOverflowError);

    // check if enough quote token from user
    let user_quote_token_vault_balance =
        token::accessor::amount(&ctx.accounts.user_quote_token_vault).unwrap();
    if user_quote_token_vault_balance < amount {
        return Err(ErrorCode::InsufficientFund.into());
    }

    // calculate the lp share by deposit amount
    let amm_quote_token_vault_balance =
        token::accessor::amount(&ctx.accounts.amm_quote_token_vault).unwrap();
    let lp_token_mint_supply = ctx.accounts.lp_token_mint.supply;
    // let quote_token_to_lp = lp_token_mint_supply as f64 / amm_quote_token_vault_balance as f64;
    let shares = amount as f64 / ((amount + amm_quote_token_vault_balance) as f64);

    // transfer token to amm liquidity pool
    token::transfer(ctx.accounts.transfer_context(), amount)?;
    msg!("Successfully transfered user's usdc to amm liquidity pool");
    msg!("shares: {}", shares);

    // mint lp tokens to the liquidity provider
    let optifi_exchange = &ctx.accounts.optifi_exchange;
    let (_pad, bump) = get_amm_liquidity_auth_pda(optifi_exchange.key, &ctx.program_id);
    let lp_amount = if lp_token_mint_supply == 0 {
        amount as f64
    } else {
        (shares * lp_token_mint_supply as f64) / (1f64 - shares)
    };
    msg!("lp_amount: {}", lp_amount);

    token::mint_to(
        ctx.accounts.mint_to_context().with_signer(&[&[
            PREFIX_AMM_LIQUIDITY_AUTH.as_bytes(),
            optifi_exchange.key().as_ref(),
            &[bump],
        ]]),
        floor!(lp_amount) as u64,
    )?;
    msg!("Successfully minted LP tokens to user");

    Ok(())
}
