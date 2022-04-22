use thiserror::Error;

#[derive(Error, Debug)]
pub enum SolanaError {
    #[error("Couldn't connect to Solana")]
    NetworkError,
}

#[derive(Error, Debug)]
pub enum DataError {
    #[error("Item at address should have existed")]
    AddressIntegrityError,
}
