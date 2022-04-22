use borsh::{BorshSerialize, BorshDeserialize};

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum ErrorCode {
    IncorrectInstruction,
    ComputeBudgetReached,
    RuntimeError
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct Error {
    pub code: ErrorCode,
    pub msg: String,
}