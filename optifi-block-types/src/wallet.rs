use std::collections::HashMap;
use crate::financial::{Asset, OrderData};
use borsh::{BorshSerialize, BorshDeserialize};
use crate::entity::Entity;

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum WalletInstructionType {
    Deposit,
    Withdrawl,
    MarginCall,
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct WalletInstruction {
    pub instruction_type: WalletInstructionType,
    pub asset: Asset,
    pub amount: u128,
    pub external_wallet: String,
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct PositionBlockType {
    pub asset: Asset,
    pub entity: Entity,
    pub total: u128,
    pub margin_requirement: u128,
    pub free: u128,
    pub orders: HashMap<String, OrderData>,
}
