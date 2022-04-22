use std::collections::HashMap;
use borsh::{BorshSerialize, BorshDeserialize};
use crate::financial::Instrument;

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct OrderTree {

}

impl OrderTree {

}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct OrderbookBlockType {
    pub instrument: Instrument,
    pub orders: OrderTree,
    pub volume: i64,
}