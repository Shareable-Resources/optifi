use crate::constants::{FAKE_LAMPORTS, FAKE_OWNER, SERUM_DEVNET_ID, SERUM_MAINNET_ID};
use crate::gen_account_info;
use crate::solana::serum::lifted::{
    get_keys_for_market, load_asks_mut, load_bids_mut, parse_orderbook, read_event_queue,
    MarketPubkeys, OrderbookDataType,
};
use crate::solana::{get_client, CompliantClient, Network};
use anchor_lang::prelude::Pubkey;
use optifi::u_to_f_repr;
use serum_dex::critbit::{Slab, SlabView};
use serum_dex::matching::OrderBookState;
use serum_dex::state::{AccountFlag, MarketState};
use solana_sdk::account_info::AccountInfo;
use solana_sdk::clock::Epoch;
use std::str::FromStr;

pub struct BidsAsksContext {
    pub bid_size: f64,
    pub ask_size: f64,
    pub bid: f64,
    pub ask: f64,
    pub mark: f64,
}

pub fn get_bids_asks(
    client: &CompliantClient,
    market_state: &mut (MarketPubkeys, MarketState),
) -> BidsAsksContext {
    // I'm sure there's a better way to do this, but the way the AccountInfo struct works,
    // it's really hard to have it constructed in any callable or loopable way without
    // running into memory problems.
    let owner_key = Pubkey::from_str(FAKE_OWNER).unwrap();
    let mut bids_data = client.get_account_data(&market_state.0.bids).unwrap();
    let mut asks_data = client.get_account_data(&market_state.0.asks).unwrap();
    let mut bids_lamports: Box<u64> = Box::new(FAKE_LAMPORTS.clone());
    let mut asks_lamports: Box<u64> = Box::new(FAKE_LAMPORTS.clone());

    let bids_acct_info =
        gen_account_info!(&market_state.0.bids, bids_lamports, bids_data, owner_key);
    let asks_acct_info =
        gen_account_info!(&market_state.0.asks, asks_lamports, asks_data, owner_key);

    let mut bids_slab = load_bids_mut(&bids_acct_info).expect(
        format!(
            "Couldn't load bids for market {}",
            &market_state.0.market.to_string()
        )
        .as_str(),
    );
    let mut asks_slab = load_asks_mut(&asks_acct_info).expect(
        format!(
            "Couldn't load asks for market {}",
            &market_state.0.market.to_string()
        )
        .as_str(),
    );
    let orderbook_state = OrderBookState {
        bids: &mut bids_slab,
        asks: &mut asks_slab,
        market_state: &mut market_state.1,
    };
    // Use find_by to count bids and asks since we don't have internals

    let mut max_bid_price: f64 = 0.0;
    let mut max_bid_qty: f64 = 0.0;

    if let Some(max_bid) = orderbook_state.bids.find_max() {
        let max_bid_ref = orderbook_state
            .bids
            .get_mut(max_bid)
            .unwrap()
            .as_leaf_mut()
            .unwrap();
        let max_bid_price = u_to_f_repr!(max_bid_ref.price().get());
        let max_bid_qty = max_bid_ref.quantity() as f64;
    }

    let mut min_ask_price: f64 = 0.0;
    let mut min_ask_qty: f64 = 0.0;

    if let Some(min_ask) = orderbook_state.asks.find_min() {
        let min_ask_ref = orderbook_state
            .asks
            .get_mut(min_ask)
            .unwrap()
            .as_leaf_mut()
            .unwrap();

        min_ask_price = u_to_f_repr!(min_ask_ref.price().get());
        min_ask_qty = min_ask_ref.quantity() as f64;
    }

    let mut diff: f64 = min_ask_price - max_bid_price;
    if diff < 0f64 {
        diff = 0f64;
    }

    diff /= 2f64;

    let mark = max_bid_price + diff;

    log::info!(
        "Got price of ${} for serum market at address {}",
        mark,
        &market_state.0.market.to_string()
    );

    BidsAsksContext {
        bid_size: max_bid_qty,
        ask_size: min_ask_qty,
        bid: max_bid_price,
        ask: min_ask_price,
        mark,
    }
}

pub fn load_serum_market(
    client: &CompliantClient,
    market_address: &Pubkey,
    network: Network,
) -> (MarketPubkeys, MarketState) {
    let serum_program_id = Pubkey::from_str(match network {
        Network::Mainnet => SERUM_MAINNET_ID,
        Network::Devnet => SERUM_DEVNET_ID,
    })
    .unwrap();
    get_keys_for_market(&client, &serum_program_id, market_address).expect(
        format!(
            "Couldn't load serum market at {}",
            market_address.to_string()
        )
        .as_str(),
    )
}
