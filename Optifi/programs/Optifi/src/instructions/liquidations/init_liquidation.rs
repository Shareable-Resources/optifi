use crate::errors::ErrorCode;
use crate::state::{LiquidationState, LiquidationStatus, UserAccount};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeLiquidation<'info> {
    #[account(constraint = user_account.is_in_liquidation)]
    pub user_account: ProgramAccount<'info, UserAccount>,

    #[account(constraint = liquidation_state.user_account == user_account.key())]
    pub liquidation_state: ProgramAccount<'info, LiquidationState>,
}

pub fn handler(ctx: Context<InitializeLiquidation>) -> ProgramResult {
    msg!("Initializing liquidation for user");
    // Set the users associated liquidation state account as being in Liqudation
    let liquidation_state = &mut ctx.accounts.liquidation_state;
    if liquidation_state.status != LiquidationStatus::Dormant {
        return Err(ErrorCode::UserAlreadyInLiquidation.into());
    }
    liquidation_state.status = LiquidationStatus::Liquidating;
    Ok(())
}
