use crate::constants::{SOLANA_DEVNET_URL, SOLANA_MAINNET_URL};
use crate::solana::Network::{Devnet, Mainnet};
use reqwest::{get, StatusCode};
use std::fmt::{Display, Formatter};

#[derive(Eq, PartialEq, Hash, Clone, Copy)]
pub enum Network {
    Mainnet,
    Devnet,
}

impl Network {
    pub(crate) fn as_str(&self) -> &'static str {
        match self {
            Network::Mainnet => SOLANA_MAINNET_URL,
            Network::Devnet => SOLANA_DEVNET_URL,
        }
    }

    async fn online(&self) -> bool {
        let resp = get(self.as_str()).await;
        match resp {
            Ok(r) if r.status() == StatusCode::OK => true,
            _ => false,
        }
    }
}

impl From<i32> for Network {
    fn from(i: i32) -> Self {
        match i {
            0 => Mainnet,
            1 => Devnet,
            x => {
                log::warn!("Trying to convert network from {}", x);
                Devnet
            }
        }
    }
}

impl Into<i32> for Network {
    fn into(self) -> i32 {
        match self {
            Mainnet => 0,
            Devnet => 1,
        }
    }
}

impl Display for Network {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}
