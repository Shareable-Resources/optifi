use crate::{f_to_u_repr, u_to_f_repr};
use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

#[derive(Clone, Copy, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
pub enum LiquidationStatus {
    Liquidating,
    Dormant,
}

impl Default for LiquidationStatus {
    fn default() -> Self {
        LiquidationStatus::Dormant
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq)]
pub struct PositionSizeContainer {
    pub size: u64,
    pub address: Pubkey,
}

#[account]
#[derive(Default)]
pub struct LiquidationState {
    pub user_account: Pubkey,
    pub status: LiquidationStatus,
    pub registered_positions: Vec<Pubkey>,
    pub collected_positions: Vec<PositionSizeContainer>,
}

impl LiquidationState {
    /// Get the largest position currently in the liquidation state -
    /// this will always be the next position to be liquidated
    pub fn pop_largest_position(&mut self) -> (f64, Pubkey) {
        let positions_ref = &self.collected_positions.clone();
        let mut largest_position: (u64, Pubkey, usize) =
            (positions_ref[0].size, positions_ref[0].address, 0);
        for i in 0..positions_ref.len() {
            let pos = positions_ref[i];
            if pos.size > largest_position.0 {
                largest_position = (pos.size, pos.address, i);
            }
        }
        self.collected_positions.remove(largest_position.2);
        (u_to_f_repr!(largest_position.0), largest_position.1)
    }

    pub fn add_position(&mut self, price: f64, address: Pubkey) {
        self.registered_positions.push(address);
        // We're only interested in liquidating the users negative positions - if it's positive,
        // don't add it to collected
        if price > 0f64 {
            return;
        }
        self.collected_positions.push(PositionSizeContainer {
            size: f_to_u_repr!(price),
            address,
        });
    }

    /// Reset the liquidation state for the user after liquidations are finished
    pub fn liquidation_complete(&mut self) {
        self.status = LiquidationStatus::Dormant;
        self.registered_positions = Vec::new();
        self.collected_positions = Vec::new();
    }
}
