use borsh::{BorshSerialize, BorshDeserialize};
use crate::financial::*;

#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum MasterInstructionType {
    PlaceOrder,
    UpdateOrder,
    CancelOrder,
    PropagateData,
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct PlaceOrderData {
    pub instrument_code: String,
    pub side: OrderSide,
    pub size: i64,
    pub ba: u128,
    pub order_type: OrderType,
    pub limit: Option<u128>,
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct UpdateOrderData {
    pub order_id: String,
    pub ba: u128,
    pub size: i64,
    pub limit: Option<u128>
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct CancelOrderData {
    pub order_id: String,
}

#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct PropagateOrderData{}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum MasterInstructionData {
    PlaceOrder(PlaceOrderData),
    UpdateOrder(UpdateOrderData),
    CancelOrder(CancelOrderData),
    PropagateOrder(PropagateOrderData)
}


#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct MasterInstruction {
    pub instruction_type: MasterInstructionType,
    pub instruction_data: MasterInstructionData
}