use crate::errors::ErrorCode;
use crate::state::user_account::UserAccount;
use crate::utils::PREFIX_USER_ACCOUNT;
use anchor_lang::prelude::*;
use anchor_lang::Key;

use anchor_spl::token::{self, Transfer};

use solana_program::program::invoke_signed;

#[derive(Accounts)]
// #[instruction(bump: u8)]
pub struct Withdraw<'info> {
    pub optifi_exchange: AccountInfo<'info>,

    /// user account - also the pda that controls the user's spl token accounts
    #[account(mut, constraint= user_account.owner == user.key() && user_account.user_margin_account_usdc == user_margin_account_usdc.key())]
    pub user_account: Account<'info, UserAccount>,

    /// user's margin account whose authority is user account(pda)
    #[account(mut)]
    pub user_margin_account_usdc: AccountInfo<'info>,

    /// The mint for usdc margin account
    #[account(mut)]
    pub deposit_token_mint: AccountInfo<'info>,

    /// The user that owns the margin deposits
    /// the user must sign the withdraw tx
    #[account(signer)]
    pub user: AccountInfo<'info>,

    /// the destination token account to which funds will be withdrawed
    #[account(mut, constraint= !withdraw_dest.data_is_empty() && withdraw_dest.lamports() > 0)]
    pub withdraw_dest: AccountInfo<'info>,

    #[account(address = token::ID)]
    pub token_program: AccountInfo<'info>,
}

impl<'info> Withdraw<'info> {
    fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        // self.vault_account
        CpiContext::new(
            self.token_program.clone(),
            Transfer {
                from: self.user_margin_account_usdc.clone(),
                to: self.withdraw_dest.clone(),
                authority: self.user_account.to_account_info(),
            },
            // &[&[&b"escrow"[..], &[bump_seed]]],
            // &[&[&PDAPREFIX.as_bytes(), &[bump_seed]]],
        )
    }
}

/// Withdraw tokens from a reserve
pub fn handler(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
    let user_account = &ctx.accounts.user_account;
    let user_margin_account_usdc = &mut ctx.accounts.user_margin_account_usdc;

    if user_account.owner != ctx.accounts.user.key() {
        return Err(ErrorCode::UnauthorizedAccount.into());
    };

    if user_account.user_margin_account_usdc.key() != user_margin_account_usdc.key() {
        return Err(ErrorCode::UnauthorizedTokenVault.into());
    }
    let optifi_exchange = &ctx.accounts.optifi_exchange;
    let user = &ctx.accounts.user;

    // ============================================================================================
    // no need for this validation since the transfer will fail
    // if the pda provided by user is not the authority of spl token account user_margin_account_usdc
    // ============================================================================================
    // if user_margin_account_usdc.owner != pda.key {
    //     return Err(ErrorCode::InvalidPDA.into());
    // }

    // let (_pda, bump_seed) = Pubkey::find_program_address(
    //     &[PDAPREFIX.as_bytes(), optifi_exchange.key().as_ref()],
    //     ctx.program_id,
    // );
    // let (_pda, bump_seed) = get_user_account_pda(optifi_exchange.key(), user.key(), ctx.program_id);

    // Method 1:
    token::transfer(
        ctx.accounts.transfer_context().with_signer(&[&[
            &PREFIX_USER_ACCOUNT.as_bytes(),
            optifi_exchange.key().as_ref(),
            user.key().as_ref(),
            &[user_account.bump],
        ]]),
        amount,
    )?;

    Ok(())
}

/// Withdraw tokens from a reserve
pub fn handler2(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
    let user_account = &ctx.accounts.user_account;
    let user_margin_account_usdc = &ctx.accounts.user_margin_account_usdc;

    msg!(" user_account.state: {:?}", user_account.state);
    msg!(" user_account.positions: {:?}", user_account.positions);
    msg!(" user_account.bump: {}", user_account.bump);

    msg!("{}", user_account.user_margin_account_usdc);
    msg!("{}", user_margin_account_usdc.key);
    msg!("{}", user_account.user_margin_account_usdc.key());
    msg!("{}", *user_margin_account_usdc.key);
    msg!("{}", user_margin_account_usdc.key());
    msg!("user_account.owner: {}", user_account.owner);
    msg!(
        "user_margin_account_usdc.owner: {}",
        user_margin_account_usdc.owner
    );

    if user_account.owner != ctx.accounts.user.key() {
        return Err(ErrorCode::UnauthorizedAccount.into());
    };

    if user_account.user_margin_account_usdc.key() != user_margin_account_usdc.key() {
        return Err(ErrorCode::UnauthorizedTokenVault.into());
    }

    // ============================================================================================
    // no need for this validation since the transfer will fail
    // if the pda provided by user is not the authority of spl token account user_margin_account_usdc
    // ============================================================================================
    // if user_margin_account_usdc.owner != pda.key {
    //     return Err(ErrorCode::InvalidPDA.into());
    // }

    // let (pda_pubkey, bump_seed) =
    //     Pubkey::find_program_address(&[PDAPREFIX.as_bytes()], ctx.program_id);

    // Method 2:
    let token_program = &ctx.accounts.token_program;
    let vault = &ctx.accounts.user_margin_account_usdc;
    let withdraw_dest = &ctx.accounts.withdraw_dest;
    // let reserve = &ctx.accounts.reserve;

    let optifi_exchange = &ctx.accounts.optifi_exchange;
    let user = &ctx.accounts.user;

    let transfer_to_taker_ix = spl_token::instruction::transfer(
        token_program.key,
        vault.key,
        withdraw_dest.key,
        &user_account.key(),
        &[&user_account.key()],
        amount,
    )?;

    msg!("Calling the token program to transfer tokens to the dest...");
    invoke_signed(
        &transfer_to_taker_ix,
        &[
            vault.clone(),
            withdraw_dest.clone(),
            user_account.to_account_info(),
            token_program.clone(),
        ],
        &[&[
            &PREFIX_USER_ACCOUNT.as_bytes(),
            optifi_exchange.key().as_ref(),
            user.key().as_ref(),
            &[user_account.bump],
        ]],
    )?;

    Ok(())
}
