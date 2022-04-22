use crate::financial::option::*;
use crate::financial::*;
use crate::{ceil, constants::*};
use anchor_lang::prelude::*;
use ndarray::{Array2, Axis};
use solana_program::log::sol_log_compute_units;

// TOTAL AMM LIQUIDITY
pub fn total_amm_liquidity(
    spot_price: f64,
    strikes: Vec<f64>,
    iv: f64,
    dt: Vec<f64>,
    is_call: Vec<u8>,
    amm_position: Vec<f64>,
    futures_position: f64,
    usdc_balance: f64,
) -> (f64, f64) {
    assert_eq!(amm_position.len(), strikes.len());

    let spot = SpotInputOption::SingleSpot(spot_price);

    // this part of delta and price calculations is used for net option premium and value calcs
    // get base prices
    let delta = option_delta(&spot, &strikes, iv, 0.0, 0.0, &dt, &is_call);
    let price_usd = option_price(&spot, &strikes, iv, 0.0, 0.0, &dt, &is_call);

    // calculate amm option net premium and delta values
    let delta_matrix = Array2::from_shape_vec(
        (delta[0].len(), delta.len()),
        delta.into_iter().flatten().collect(),
    )
    .unwrap();
    let price_usd_matrix = Array2::from_shape_vec(
        (price_usd[0].len(), price_usd.len()),
        price_usd.into_iter().flatten().collect(),
    )
    .unwrap();

    let amm_position_matrix =
        Array2::from_shape_vec((1, amm_position.len()), amm_position).unwrap();

    let net_option_delta = (delta_matrix * &amm_position_matrix).sum();
    let net_option_premium = (price_usd_matrix * &amm_position_matrix).sum();

    // calculate AMM positions and deltas
    let net_futures_delta = futures_position;

    // Return
    let net_delta = net_option_delta + net_futures_delta;
    let amm_liquidity_usd = usdc_balance + net_option_premium;
    let amm_liquidity = amm_liquidity_usd / spot_price;

    // println!("net_delta {}", net_delta);
    // println!("amm_liquidity {}", amm_liquidity);
    (net_delta, amm_liquidity)
}

// AMM TRADING CAPACITY CALCULATIONS
pub fn calculate_amm_quote_price(
    spot_price: f64,
    side: OrderSide,
    net_delta: f64,
    amm_liquidity_btc: f64,
    quote_size: f64,
) -> (Vec<f64>, Vec<f64>) {
    // bid and ask btc liquidity based on total AMM value and Trade capacity parameters

    let liq_2ask = match side {
        OrderSide::Ask => {
            amm_liquidity_btc
                + net_delta
                    .min(0.0)
                    .max(-1.0 * amm_liquidity_btc * TRADE_CAPACITY)
        }
        OrderSide::Bid => {
            amm_liquidity_btc
                + net_delta
                    .max(0.0)
                    .min(1.0 * amm_liquidity_btc * TRADE_CAPACITY)
        }
    };

    // initialize bid and ask pricing steps
    let rng_2ask: Vec<i64> = match side {
        OrderSide::Ask => (-1 * NQUOTES..0).collect(),
        OrderSide::Bid => (1..=NQUOTES).collect(),
    };

    let quote_inc =
        ceil!((amm_liquidity_btc * TRADE_CAPACITY / NSTEP as f64) / quote_size) * quote_size;

    // initialize residual btc balances at each bid and ask pricing step
    let mut btc_2ask =
        rng_2ask
            .iter()
            .map(|&n| match side {
                OrderSide::Ask => (liq_2ask + n as f64 * quote_inc)
                    .max(amm_liquidity_btc * (1.0 - TRADE_CAPACITY)),
                OrderSide::Bid => (liq_2ask + n as f64 * quote_inc)
                    .min(amm_liquidity_btc * (1.0 + TRADE_CAPACITY)),
            })
            .collect::<Vec<f64>>();

    // calculate sqrt prices
    // let liq_chng_2ask = btc_2ask
    //     .iter()
    //     .map(|&x| (amm_liquidity_btc.powi(2) * spot_price / x).sqrt())
    //     .collect::<Vec<f64>>();
    // // calculate bid and ask prices
    // let usdtbtc_price_2ask = liq_chng_2ask
    //     .iter()
    //     .map(|&x| x.powi(2) / amm_liquidity_btc)
    //     .collect::<Vec<f64>>();

    let usdtbtc_price_2ask = btc_2ask
        .iter()
        .map(|&x| amm_liquidity_btc * spot_price / x)
        .collect::<Vec<f64>>();

    // calculate dollar liquidity at each point
    // assert_eq!(btc_2ask.len(), usdtbtc_price_2ask.len());

    // let amm_liquidity = amm_liquidity_btc * spot_price;

    // let _liq_usdt_2ask = btc_2ask
    //     .iter()
    //     .zip(usdtbtc_price_2ask.iter())
    //     .into_iter()
    //     .map(|(btc_2ask, usdtbtc_price_2ask)| {
    //         (amm_liquidity_btc - btc_2ask) * usdtbtc_price_2ask + amm_liquidity
    //     })
    //     .collect::<Vec<f64>>();

    // calculate calculate change in liquidities at each price point
    let chng_in_pos_2ask = btc_2ask
        .iter()
        .map(|&x| (x - liq_2ask).abs())
        .collect::<Vec<f64>>();

    // TOTAL ORDERBOOK CAPACITY
    match side {
        OrderSide::Ask => btc_2ask.push(liq_2ask),

        OrderSide::Bid => {
            // btc_2ask.reverse();
            // btc_2ask.push(liq_2ask);
            // btc_2ask.reverse();

            btc_2ask.insert(0, liq_2ask);
        }
    };

    let btc_delta_size_2ask = btc_2ask
        .windows(2)
        .map(|s| s[1] - s[0])
        .collect::<Vec<f64>>();

    // if bid here, is in reverse

    //  total liquidity at offer

    // let _btc_total_2ask = btc_delta_size_2ask
    //     .iter()
    //     .scan(0.0, |acc, x| {
    //         *acc += x;
    //         Some(*acc)
    //     })
    //     .collect::<Vec<f64>>();

    let mut usdtbtc_price_2ask_chng_in_pos_2ask = usdtbtc_price_2ask
        .iter()
        .zip(chng_in_pos_2ask.iter())
        .map(|(a, b)| (a * b).abs())
        .collect::<Vec<f64>>();

    match side {
        OrderSide::Ask => {
            usdtbtc_price_2ask_chng_in_pos_2ask.push(0.0);

            usdtbtc_price_2ask_chng_in_pos_2ask = usdtbtc_price_2ask_chng_in_pos_2ask
                .windows(2)
                .map(|s| s[0] - s[1])
                .collect::<Vec<f64>>();
        }
        OrderSide::Bid => {
            // usdtbtc_price_2ask_chng_in_pos_2ask.reverse();
            // usdtbtc_price_2ask_chng_in_pos_2ask.push(0.0);
            // usdtbtc_price_2ask_chng_in_pos_2ask.reverse();

            usdtbtc_price_2ask_chng_in_pos_2ask.insert(0, 0.0);

            usdtbtc_price_2ask_chng_in_pos_2ask = usdtbtc_price_2ask_chng_in_pos_2ask
                .windows(2)
                .map(|s| s[1] - s[0])
                .collect::<Vec<f64>>();
        }
    };

    let quote_price_2ask = usdtbtc_price_2ask_chng_in_pos_2ask
        .iter()
        .zip(btc_delta_size_2ask.iter())
        .map(|(a, b)| a / b)
        .collect::<Vec<f64>>();

    (btc_delta_size_2ask, quote_price_2ask)
}

/// Clip the vector of orders with zero size
/// `prices` should be sorted from big to small if asks , or from small to big if bids
pub fn clip_order_levels(sizes: &mut Vec<f64>, prices: &mut Vec<f64>) {
    assert_eq!(sizes.len(), prices.len());
    if let Some(clip_idx) = sizes.iter().position(|&x| x == 0.0) {
        sizes.truncate(clip_idx);
        prices.truncate(clip_idx);
    }

    sizes.reverse();
    sizes.truncate(ORDER_LEVELS);
    sizes.reverse();

    prices.reverse();
    prices.truncate(ORDER_LEVELS);
    prices.reverse();
}

// ORDERBOOK
// transpose of python ver.
pub fn calculate_amm_price(
    is_call: bool,
    quote_price_2ask: &Vec<f64>,
    cdelta_btc_raw: &Vec<Vec<f64>>,
    strikes: &Vec<f64>,
    iv: f64,
    dt: &Vec<f64>,
    spot_price: f64,
) -> Vec<Vec<f64>> {
    let cdelta_btc_raw = cdelta_btc_raw.iter().flatten().collect::<Vec<&f64>>();

    let quote_price_2ask: Vec<f64> = if is_call == false {
        let mut temp = quote_price_2ask.clone();
        temp.reverse();
        temp
    } else {
        quote_price_2ask.to_vec()
    };

    // let quote_price_2ask = SpotInputOption::MultiSpots(vec![quote_price_2ask]);

    let is_call = if is_call {
        vec![1 as u8; dt.len()]
    } else {
        vec![0 as u8; dt.len()]
    };
    // calculate call and put prices

    msg!("Before calculate_amm_price_and_size - for pprice_btc_2ask");
    sol_log_compute_units();

    let cprice_usd_2ask_spot = option_price(
        &SpotInputOption::SingleSpot(spot_price),
        &strikes,
        iv,
        0.0,
        0.0,
        &dt,
        &is_call,
    );

    msg!("After calculate_amm_price_and_size - for pprice_btc_2ask");
    sol_log_compute_units();

    let cprice_usd_2ask: Vec<Vec<f64>> = cdelta_btc_raw
        .iter()
        .zip(cprice_usd_2ask_spot.iter())
        .map(|(&delta, p_vec)| {
            quote_price_2ask
                .iter()
                .map(|&p| (p_vec[0] + (p - spot_price) * delta).max(0.0))
                .collect::<Vec<f64>>()
        })
        .collect();

    // println!(
    //     "cprice_usd_2ask.len()  {:?},cprice_usd_2ask[0].len()   {:?}",
    //     cprice_usd_2ask.len(),    // 28, according to dt
    //     cprice_usd_2ask[0].len()  // 100, according to spots (NSTEP)
    // );

    // calculate btc prices if required (now we will function in USDC not in BTC - so probably not required)
    // let cprice_btc_2ask = cprice_usd_2ask
    //     .iter()
    //     .map(|v| {
    //         v.iter()
    //             .map(|&d| {
    //                 let mut temp = d / spot_price;
    //                 if temp.is_nan() {
    //                     temp = 0.0;
    //                 }
    //                 temp
    //             })
    //             .collect::<Vec<f64>>()
    //     })
    //     .collect::<Vec<Vec<f64>>>();

    cprice_usd_2ask
}

pub fn calculate_amm_size(
    is_call: bool,
    btc_delta_size_2ask: &Vec<f64>,
    cdelta_btc_raw: &Vec<Vec<f64>>,
    quote_size: f64,
) -> Vec<Vec<f64>> {
    // set individual option bid ask sizes
    let shape = (btc_delta_size_2ask.len(), 1); // (5,1)
    let mut btc_delta_size_2ask =
        Array2::from_shape_vec(shape, btc_delta_size_2ask.to_vec()).unwrap();

    if is_call == false {
        btc_delta_size_2ask.invert_axis(Axis(1));
    }

    let shape = (1, cdelta_btc_raw.len()); // (1,28)
    let mut cdelta_btc = cdelta_btc_raw.clone();
    delta_clip(&mut cdelta_btc);

    let cdelta_btc = cdelta_btc
        .iter()
        .flatten()
        .map(|x| x.abs())
        .collect::<Vec<f64>>();

    let cdelta_btc = Array2::from_shape_vec(shape, cdelta_btc).unwrap();

    let call_btc_delta_size_2ask = btc_delta_size_2ask / cdelta_btc;

    // remove NaNs
    let mut call_btc_delta_size_2ask =
        call_btc_delta_size_2ask.map(|&x| if x.is_nan() { 0.0 } else { x });

    call_btc_delta_size_2ask = call_btc_delta_size_2ask.map(|&d| {
        // clip max orderbook order size to MAX_ORDERBOOK_SIZE parameter
        let size = if d > MAX_ORDERBOOK_SIZE {
            MAX_ORDERBOOK_SIZE
        } else {
            d
        };
        // ADDED ROUNDING TO MIN QUOTE SIZE

        ceil!(size / quote_size) * quote_size
    });

    let call_btc_delta_size_2ask = call_btc_delta_size_2ask.t();

    // println!(
    //     "call_btc_delta_size_2ask.shape() {:?}",
    //     call_btc_delta_size_2ask.shape()
    // );

    let mut result = vec![];

    for n in 0..call_btc_delta_size_2ask.shape()[0] {
        result.push(call_btc_delta_size_2ask.row(n).to_vec());
    }

    result
}
