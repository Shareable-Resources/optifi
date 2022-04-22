use crate::constants::{RATE_SLOT_LEN, SOLANA_MAXIMUM_REQUESTS_PER_RATE_SLOT};
use crate::solana::Network;
use lazy_static::lazy_static;
use solana_client::rpc_client::RpcClient;
use std::collections::HashMap;
use std::ops::Deref;
use std::sync::{Arc, Mutex, Once, RwLock};
use std::time::SystemTime;

lazy_static! {
    static ref CLIENTS_INIT: HashMap<Network, Once> = HashMap::from([
        (Network::Mainnet, Once::new()),
        (Network::Devnet, Once::new())
    ]);
    static ref CLIENTS: RwLock<HashMap<Network, Arc<CompliantClient>>> =
        RwLock::new(HashMap::new());
}

/// Using the Once initializer, get a shared client object
pub fn get_client(network: Network) -> Arc<CompliantClient> {
    CLIENTS_INIT[&network].call_once(|| {
        let mut clients = CLIENTS.write().unwrap();
        clients.insert(network, Arc::new(CompliantClient::new(network)));
    });
    CLIENTS.read().unwrap()[&network].clone()
}

/**
A module that exposes a version of Solana's RpcClient that
respects the rate limits, using locks across all threads
**/
pub struct CompliantClient {
    client: Box<RpcClient>,
    request_slots: Mutex<[Option<SystemTime>; SOLANA_MAXIMUM_REQUESTS_PER_RATE_SLOT]>,
}

impl CompliantClient {
    pub fn new(network: Network) -> Self {
        CompliantClient {
            client: Box::new(RpcClient::new(network.as_str().to_string())),
            request_slots: Mutex::new([None; SOLANA_MAXIMUM_REQUESTS_PER_RATE_SLOT]),
        }
    }

    /// Make sure that we have a valid wait limit slot
    fn get_request_slot(&self) {
        'outer: loop {
            // Check if we can find a slot that was less than the rate limit ago,
            // or which is none
            let now = SystemTime::now();
            let cutoff = now - RATE_SLOT_LEN;
            let mut request_slots_lock = self.request_slots.lock().unwrap();
            for slot_idx in 0..SOLANA_MAXIMUM_REQUESTS_PER_RATE_SLOT {
                let slot = request_slots_lock[slot_idx];
                match slot {
                    Some(s) if s > cutoff => {} // If this slot is still in use, ignore
                    _ => {
                        // Otherwise, use the slot
                        request_slots_lock[slot_idx] = Some(now);
                        break 'outer;
                    }
                }
            }
        }
    }
}

impl Deref for CompliantClient {
    type Target = RpcClient;

    fn deref(&self) -> &Self::Target {
        self.get_request_slot();
        &self.client
    }
}
