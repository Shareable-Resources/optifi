use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use anchor_spl::token::accessor::amount;
use solana_program::{program_error::ProgramError, program_pack::IsInitialized, pubkey::Pubkey};
use std::{cmp::min, fmt::Debug};

#[account]
pub struct UserAccount {
    /// optifi exchange which the user account belongs to
    pub optifi_exchange: Pubkey, // 32 bytes

    /// The owner of this account.
    pub owner: Pubkey,

    /// The margin account which user deposits usdc token into
    /// it's a spl token account
    pub user_margin_account_usdc: Pubkey,

    /// temp PnL record for fund settlment purpose
    pub temp_pnl: TempPnL,

    // /// The total amount of tokens the user deposited into this account.
    // pub reserve: u64,
    /// The account's state
    pub state: AccountState,

    // a list of instruments Pubkey corresponded to positions
    pub instruments: Vec<Pubkey>,
    /// user's position
    pub positions: Vec<i32>,

    pub is_in_liquidation: bool,

    // pub positions: [Position; 16],
    /// the bump seed to get the address of this user account
    pub bump: u8,
}
impl UserAccount {
    // pub fn initialize_account() -> Result<Self, ProgramError> {
    //     Ok(self)
    // }

    /// Checks if account is frozen
    fn is_frozen(&self) -> bool {
        self.state == AccountState::Frozen
    }
    /// returns the available margin amount of the user
    /// if the user has negative temp pnl, should get take the loss into account
    pub fn get_available_margin(&self, user_margin_account: &AccountInfo) -> u64 {
        let margin_balance = amount(user_margin_account).unwrap();
        min(
            (margin_balance as i64 + self.temp_pnl.amount) as u64,
            margin_balance,
        )
    }
}

impl IsInitialized for UserAccount {
    fn is_initialized(&self) -> bool {
        self.state != AccountState::Uninitialized
    }
}

/// Account state.
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum AccountState {
    /// Account is not yet initialized
    Uninitialized,
    /// Account is initialized; the account owner and/or delegate may perform permitted operations
    /// on this account
    Initialized,
    /// Account has been frozen by the mint freeze authority. Neither the account owner nor
    /// the delegate are able to perform operations on this account.
    Frozen,
}

impl Default for AccountState {
    fn default() -> Self {
        AccountState::Uninitialized
    }
}

#[derive(Default, Clone, Copy, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub struct TempPnL {
    pub amount: i64,
    pub epoch: u64,
}
