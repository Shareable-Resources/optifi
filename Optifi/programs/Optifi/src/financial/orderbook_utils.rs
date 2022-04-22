use serum_dex::state::Market;

pub fn max_bid(serum_market: &Market) -> f64 {
    *serum_market.bids.iter().max().expect("Bids empty") as f64
}

pub fn min_ask(serum_market: &Market) -> f64 {
    *serum_market.asks.iter().min().expect("Asks empty") as f64
}

pub fn get_serum_spot_price(serum_market: &Market) -> f64 {
    let max_bid = max_bid(serum_market);
    let min_ask = min_ask(serum_market);

    let mut diff: f64 = min_ask - max_bid;
    if diff < 0f64 {
        diff = 0f64;
    }

    diff /= 2f64;

    max_bid + diff
}
