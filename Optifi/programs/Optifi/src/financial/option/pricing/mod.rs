//! # option pricing
//! A Black Scholes option pricing library
mod erf;
// use serde::__private::de::IdentifierDeserializer;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
// use solana_sdk::process_instruction::InvokeContext;
use crate::constants::DELTA_LIMIT;
use anchor_lang::prelude::*;
use erf::erf;
use ndarray::{Array, Array2};
use solana_program::log::sol_log_compute_units;
use std::borrow::Borrow;
use std::f64::consts::SQRT_2;
use std::vec;

/// returns cumulative distribution functions values
pub fn cdf(x: f64) -> f64 {
    erf(x / SQRT_2) * 0.5 + 0.5
}

/// Returns result for a single record
///
pub fn d1_single(spot: f64, strike: f64, iv: f64, r: f64, q: f64, t: f64) -> f64 {
    ((spot / strike).ln() + (r - q + iv * iv * 0.5) * t) / (iv * t.sqrt())
}

/// Returns result for a single record
///
pub fn d2_single(spot: f64, strike: f64, iv: f64, r: f64, q: f64, t: f64) -> f64 {
    d1_single(spot, strike, iv, r, q, t) - iv * t.sqrt()
}

/// For constructing the spot input for fn d1() and fn d2()
/// It provids two options: one for single spot, one for array of spot
///
pub enum SpotInputOption {
    /// Accept a spot price record
    SingleSpot(f64),
    /// Accept multiple spot price record
    MultiSpots(Vec<Vec<f64>>),
}

/// d1 from Black Scholes pricing
pub fn d1(
    spots: SpotInputOption,
    strikes: Vec<f64>,
    iv: f64,
    r: f64,
    q: f64,
    t: &Vec<f64>,
) -> Vec<Vec<f64>> {
    if strikes.len() != t.len() {
        // Error
        println!("the lenght of stikes is not equal to length of t")
    }

    let mut spots_final: Vec<f64> = vec![];
    match spots {
        SpotInputOption::SingleSpot(spots) => (spots_final.push(spots)),
        SpotInputOption::MultiSpots(spots) => (spots_final = spots[0].to_vec()),
    }

    let mut result = vec![];
    for (i, &strike) in strikes.iter().enumerate() {
        let mut temp = vec![];
        for spot in &spots_final {
            temp.push(d1_single(*spot, strike, iv, r, q, t[i]))
        }
        result.push(temp)
    }
    result
}

/// d2 from Black Scholes pricing
pub fn d2(
    spots: SpotInputOption,
    strikes: Vec<f64>,
    iv: f64,
    r: f64,
    q: f64,
    t: &Vec<f64>,
) -> Vec<Vec<f64>> {
    if strikes.len() != t.len() {
        // Error
        println!("the lenght of stikes is not equal to length of t")
    }

    let mut res: Vec<Vec<f64>> = vec![];
    let d1_res = d1(spots, strikes, iv, r, q, t);

    for (i, e) in d1_res.iter().enumerate() {
        let mut temp: Vec<f64> = vec![];
        for n in e {
            temp.push(n - iv * t[i].sqrt())
        }
        res.push(temp)
    }
    return res;
}

/// black scholes pricing formula
/// # atm we calculate both puts and calls for each parameter set.
pub fn option_price(
    spots: &SpotInputOption,
    strikes: &Vec<f64>,
    iv: f64,
    r: f64,
    q: f64,
    t: &Vec<f64>,
    is_call: &Vec<u8>,
) -> Vec<Vec<f64>> {
    if strikes.len() != t.len() || strikes.len() != is_call.len() {
        // Error
        println!("the lenght of stikes is not equal to length of t and is_call")
    }

    let mut spots_final: Vec<f64> = vec![];
    match spots {
        SpotInputOption::SingleSpot(spots) => (spots_final.push(*spots)),
        SpotInputOption::MultiSpots(spots) => (spots_final = spots[0].to_vec()),
    }

    let mut result: Vec<Vec<f64>> = vec![];
    for (i, strike) in strikes.iter().enumerate() {
        msg!("Before loop");
        sol_log_compute_units();

        let mut temp = vec![];
        for spot in &spots_final {
            let d1 = d1_single(*spot, *strike, iv, r, q, t[i]);
            let d2 = d1 - iv * t[i].sqrt();
            if is_call[i] == 1 {
                let ert = (-q * t[i]).exp();
                let call = spot * ert * cdf(d1) - strike * ert * cdf(d2);
                temp.push(call);
            } else if is_call[i] == 0 {
                let ert = (-q * t[i]).exp();
                let put = strike * ert * cdf(-d2) - spot * ert * cdf(-d1);
                temp.push(put);
            } else {
                panic!("Neither call or put!");
            }
        }

        result.push(temp);
        msg!("After loop");
        sol_log_compute_units()
    }
    return result;
}

// OPTIONS DELTA
pub fn delta_wrapper(
    spot_price: f64,
    strikes: Vec<f64>,
    iv: f64,
    dt: Vec<f64>,
    is_call: bool,
    clip: bool,
) -> Vec<Vec<f64>> {
    // this option delta calculation is used for convenient handling of orderbook calculations

    let spot = SpotInputOption::SingleSpot(spot_price);

    let is_call = if is_call {
        vec![1 as u8; dt.len()]
    } else {
        vec![0 as u8; dt.len()]
    };

    let mut delta = option_delta(&spot, &strikes, iv, 0.0, 0.0, &dt, &is_call);

    if clip {
        delta_clip(&mut delta);
    }

    // TODO: convert deltas into spot deltas needed because we can deposit only usdc.
    // let _delta_usd = delta
    //     .iter()
    //     .map(|v| v.iter().map(|&d| d * spot_price).collect::<Vec<f64>>())
    //     .collect::<Vec<Vec<f64>>>();

    delta
}

// clip
pub fn delta_clip(delta: &mut Vec<Vec<f64>>) {
    for v in delta {
        for d in v {
            if d.abs() < DELTA_LIMIT {
                *d = DELTA_LIMIT * d.signum();
            }
        }
    }
}

// OPTIONS price
pub fn price_wrapper(
    spot_price: f64,
    strikes: Vec<f64>,
    iv: f64,
    dt: Vec<f64>,
    is_call: bool,
) -> Vec<Vec<f64>> {
    // this option delta calculation is used for convenient handling of orderbook calculations

    let spot = SpotInputOption::SingleSpot(spot_price);

    let is_call = if is_call {
        vec![1 as u8; dt.len()]
    } else {
        vec![0 as u8; dt.len()]
    };
    // calculate call and put prices
    let price_usd = option_price(&spot, &strikes, iv, 0.0, 0.0, &dt, &is_call);

    let price = price_usd
        .iter()
        .map(|v| v.iter().map(|&d| d / spot_price).collect::<Vec<f64>>())
        .collect::<Vec<Vec<f64>>>();

    price
}

/// delta of a call
pub fn option_delta(
    spots: &SpotInputOption,
    strikes: &Vec<f64>,
    iv: f64,
    r: f64,
    q: f64,
    t: &Vec<f64>,
    is_call: &Vec<u8>,
) -> Vec<Vec<f64>> {
    let mut spots_final: Vec<f64> = vec![];
    match spots {
        SpotInputOption::SingleSpot(spots) => (spots_final.push(*spots)),
        SpotInputOption::MultiSpots(spots) => (spots_final = spots[0].to_vec()),
    }

    let mut result: Vec<Vec<f64>> = vec![];

    for (i, strike) in strikes.iter().enumerate() {
        let mut temp = vec![];
        for spot in &spots_final {
            let call = cdf(d1_single(*spot, *strike, iv, r, q, t[i]));
            let put = call - 1 as f64;
            let value = is_call[i] as f64 * call + (1 - is_call[i]) as f64 * put;
            temp.push(value)
        }
        result.push(temp);
    }
    result
}

///	calculates intrinsic value of an option
/// #.clip(0) is used as a function MAX[x,0]
pub fn option_intrinsic_value(
    spots: &SpotInputOption,
    strikes: &Vec<f64>,
    is_call: &Vec<u8>,
) -> Vec<Vec<f64>> {
    let mut spots_final: Vec<f64> = vec![];
    match spots {
        SpotInputOption::SingleSpot(spots) => (spots_final.push(*spots)),
        SpotInputOption::MultiSpots(spots) => (spots_final = spots[0].to_vec()),
    }
    let mut result: Vec<Vec<f64>> = vec![];

    for (i, strike) in strikes.iter().enumerate() {
        let mut temp = vec![];
        for spot in &spots_final {
            // call = (spot - strike).clip(0)
            // put = (strike - spot).clip(0)
            let call = if spot > strike { spot - strike } else { 0.0 };
            let put = if strike > spot { strike - spot } else { 0.0 };
            let value = is_call[i] as f64 * call + (1 - is_call[i]) as f64 * put;
            temp.push(value);
        }
        result.push(temp);
    }
    result
}

/// calculates reg-t margin for each option (EXCLUDING OPTION PRREMIU)
pub fn option_reg_t_margin(
    spots: &SpotInputOption,
    strikes: &Vec<f64>,
    stress: f64,
    is_call: &Vec<u8>,
) -> Vec<Vec<f64>> {
    let mut spots_final: Vec<f64> = vec![];
    match spots {
        SpotInputOption::SingleSpot(spots) => (spots_final.push(*spots)),
        SpotInputOption::MultiSpots(spots) => (spots_final = spots[0].to_vec()),
    }
    let mut result: Vec<Vec<f64>> = vec![];

    for (i, strike) in strikes.iter().enumerate() {
        let mut temp = vec![];
        for spot in &spots_final {
            // call = (spot - strike).clip(0)
            // put = (strike - spot).clip(0)
            let call = (stress * spot - (strike - spot).max(0.0)).max(stress * spot / 2.0);
            let put = (stress * spot - (spot - strike).max(0.0)).max(stress * spot / 2.0);

            let value = is_call[i] as f64 * call + (1 - is_call[i]) as f64 * put;
            temp.push(value);
        }
        result.push(temp);
    }
    result
}

/// calculates a list of stressed spot prices
pub fn generate_stress_spot(spot: f64, stress: f64, step: u8) -> Vec<Vec<f64>> {
    let mut result: Vec<Vec<f64>> = vec![];
    let mut temp = vec![];
    for i in 0..(step * 2 + 1) {
        let incr = stress / step as f64 * i as f64;
        temp.push(spot * (1 as f64 - stress + incr));
    }
    result.push(temp);

    result
}

/// stress function result
#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct StressFunctionResult {
    // 'Price': price,
    // 'Regulation T Margin': reg_t_margin,
    // 'Delta': delta,
    // 'Intrinsic Value': intrinsic,
    // 'Stress Price Delta': stress_price_change

    // #[serde(rename = "Price")]
    pub price: Vec<Vec<f64>>,

    // #[serde(rename = "Regulation T Margin")]
    pub reg_t_margin: Vec<Vec<f64>>,

    pub delta: Vec<Vec<f64>>,

    pub intrinsic_value: Vec<Vec<f64>>,

    pub stress_price_delta: Vec<Vec<f64>>,
}

/// margin function result
#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct MarginFunctionResult {
    net_qty: i8,
    notional_qty: i8,
    net: f64,
    notional: f64,
    stress_result: f64,
    net_intrinsic: f64,
    net_premium: f64,
    maturing_net_intrinsic: f64,
    maturing_premium: f64,
    maturing_liquidity: f64,
    total_margin: f64,
    net_leverage: f64,
    notional_leverage: f64,
}

/// stress_function
pub fn stress_function(
    spot: f64,
    strike: Vec<f64>,
    iv: f64,
    r: f64,
    q: f64,
    t: &Vec<f64>,
    stress: f64,
    is_call: Vec<u8>,
    step: u8,
) -> StressFunctionResult {
    // main values: prices, reg-t margins, delta, intrinsic values
    let spots = SpotInputOption::SingleSpot(spot);
    let price = option_price(spots.borrow(), strike.borrow(), iv, r, q, &t, &is_call);
    let reg_t_margin = option_reg_t_margin(spots.borrow(), &strike, stress, &is_call);
    let delta = option_delta(&spots, &strike, iv, r, q, &t, &is_call);
    let intrinsic = option_intrinsic_value(&spots, &strike, &is_call);

    // stresses
    let stress_spot = generate_stress_spot(spot, stress, step);
    let spots = SpotInputOption::MultiSpots(stress_spot);
    let stress_price = option_price(&spots, &strike, iv, r, q, &t, &is_call);

    let mut result: Vec<Vec<f64>> = vec![];
    for (i, stress_p_vec) in stress_price.iter().enumerate() {
        let mut temp = vec![];
        for stress_p in stress_p_vec {
            temp.push(stress_p - price[i][0]);
        }
        result.push(temp);
    }
    return StressFunctionResult {
        price,
        reg_t_margin,
        delta,
        intrinsic_value: intrinsic,
        stress_price_delta: result,
    };
}

/// Margin function
pub fn margin_function(
    user: Vec<i8>,
    spot: f64,
    t: &Vec<f64>,
    price: Vec<Vec<f64>>,
    intrinsic: Vec<Vec<f64>>,
    stress_price_change: Vec<Vec<f64>>,
) -> MarginFunctionResult {
    // # calculates margin statistics for each user and his positions
    // # totals
    // # net contract position
    let net_qty: i8 = user.iter().sum();
    // #net notional contract position
    let notional_qty: i8 = user.iter().map(|f| f.abs()).sum();
    // # net notional position in USDT (assuming BTC/USDT or ETH/USDT spot price)
    let net = net_qty as f64 * spot;
    let notional = notional_qty as f64 * spot;

    let user_vec: Vec<f64> = user.iter().map(|f| *f as f64).collect();
    let user_matrix = Array::from_vec(user_vec.clone());

    let stress_price_change_vec = stress_price_change.clone().into_iter().flatten().collect();
    let stress_price_change_matrix = Array::from_shape_vec(
        (stress_price_change.len(), stress_price_change[0].len()),
        stress_price_change_vec,
    )
    .unwrap();

    let new_matrix = user_matrix.dot(&stress_price_change_matrix);
    let stress_result = new_matrix.iter().copied().fold(f64::NAN, f64::min);
    println!("{}", stress_result);

    let intrinsic_vec = intrinsic.clone().into_iter().flatten().collect();
    let intrinsic_matrix =
        Array::from_shape_vec((intrinsic.len(), intrinsic[0].len()), intrinsic_vec).unwrap();

    let net_intrinsic_matrix = user_matrix.dot(&intrinsic_matrix);
    let net_intrinsic = net_intrinsic_matrix[0];

    let price_vec = price.clone().into_iter().flatten().collect();
    let price_matrix = Array::from_shape_vec((price.len(), price[0].len()), price_vec).unwrap();

    let net_premium_matrix = user_matrix.dot(&price_matrix);
    let net_premium = net_premium_matrix[0];

    let mut min_t: Vec<f64> = vec![];
    let t_min = t.iter().copied().fold(f64::NAN, f64::min);

    for e in t {
        if *e == t_min {
            min_t.push(1.)
        } else {
            min_t.push(0.)
        }
    }

    let min_t_matrix = Array::from(min_t.clone());

    let mut res: Vec<f64> = vec![];
    for (i, e) in user_matrix.iter().enumerate() {
        res.push(e * min_t_matrix[i])
    }

    let user_matrix = Array2::from_shape_vec((user_vec.len(), 1), user_vec).unwrap();
    let min_t_matrix = Array2::from_shape_vec((min_t.len(), 1), min_t).unwrap();
    let matrix1_1 = &user_matrix * &min_t_matrix;
    let matrix1_1_1 = matrix1_1.t();

    let matrix2 = &intrinsic_matrix * &min_t_matrix;

    let maturing_net_intrinsic = matrix1_1_1.dot(&matrix2)[[0, 0]];

    let t_matrix = Array2::from_shape_vec((t.len(), 1), t.clone()).unwrap();
    let matrix1 = (2. / (365. * &t_matrix + 1.)) * &user_matrix * &min_t_matrix;

    let matrix2 = &price_matrix * &min_t_matrix;

    // #calculates net premium
    let maturing_premium = matrix1.t().dot(&matrix2)[[0, 0]];

    // #calcualtes liquidity add on
    let maturing_liquidity = matrix1.t().dot(&(&intrinsic_matrix * &min_t_matrix))[[0, 0]];

    // # 1st margin component is a sum of 1) change in value after stress, and a minimum of net_intrincic/net premium value)
    let margin_1 = vec![
        stress_result
            + vec![net_intrinsic, net_premium]
                .iter()
                .copied()
                .fold(f64::NAN, f64::min),
        0.,
    ]
    .iter()
    .copied()
    .fold(f64::NAN, f64::min);

    // # 2nd margin component is a liquidity add on for soon maturing options
    let margin_2 = if maturing_liquidity < net_intrinsic && maturing_liquidity < 0. {
        maturing_liquidity - net_intrinsic
    } else {
        0.
    };

    // # 3rd add on is premium add on for soon maturing options
    let margin_3 = if maturing_premium < 0. {
        maturing_premium
    } else {
        0.
    };

    // # total margin
    let total_margin = margin_1 + margin_2 + margin_3;
    let net_leverage = net / total_margin;
    let notional_leverage = notional / total_margin;

    return MarginFunctionResult {
        net_qty,
        notional_qty,
        net,
        notional,
        stress_result,
        net_intrinsic,
        net_premium,
        maturing_net_intrinsic,
        maturing_premium,
        maturing_liquidity,
        total_margin,
        net_leverage,
        notional_leverage,
    };
}
