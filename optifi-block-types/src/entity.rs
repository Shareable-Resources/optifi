use borsh::{BorshSerialize, BorshDeserialize};


#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct Entity {
    // Identifier component of the DID
    pub identifier: String
}

#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub struct UserSummary {
    pub entity: Entity,
    pub position_addresses: Vec<String>
}