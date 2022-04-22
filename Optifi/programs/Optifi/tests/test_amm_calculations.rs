#[cfg(test)]
mod test_amm_calculations {

    use optifi::financial::amm::*;
    use optifi::financial::*;

    #[test]
    fn test_options_delta() {
        let spot_price = *config::SPOT;

        // let asset = Asset::Bitcoin;

        let iv = *config::IV;

        let dt = config::TIME_TO_MATURITY.to_vec();

        // let strikes = options::get_strikes(spot_price, asset)
        //     .iter()
        //     .map(|&x| x as f64)
        //     .collect::<Vec<f64>>();

        let strikes = config::STRIKE.to_vec();

        // Aboves need to be inputs

        let call_delta = delta_wrapper(spot_price, strikes.clone(), iv, dt.clone(), true, true);
        let put_delta = delta_wrapper(spot_price, strikes.clone(), iv, dt.clone(), false, true);

        println!("call_delta {:?}", call_delta);
        println!("put_delta {:?}", put_delta);

        let call_price = price_wrapper(spot_price, strikes.clone(), iv, dt.clone(), true);
        let put_price = price_wrapper(spot_price, strikes, iv, dt, false);

        println!("call_price {:?}", call_price);
        println!("put_price {:?}", put_price);
    }

    #[test]
    fn test_total_amm_liquidity() {
        let spot_price = *config::SPOT;

        let iv = *config::IV;

        let dt = config::TIME_TO_MATURITY.to_vec();

        let is_call = config::IS_CALL.to_vec();

        let amm_position = config::USER_POSITION_1
            .to_vec()
            .iter()
            .map(|&p| p as f64)
            .collect();

        let strikes = config::STRIKE.to_vec();

        let futures_position = 40.0;

        let usdc_balance = 50000000.0;

        // Aboves need to be inputs

        let (net_delta, amm_liquidity) = total_amm_liquidity(
            spot_price,
            strikes,
            iv,
            dt,
            is_call,
            amm_position,
            futures_position,
            usdc_balance,
        );

        println!("net_delta {}", net_delta);

        println!("amm_liquidity {}", amm_liquidity);

        assert_eq!(amm_liquidity, 1032.9188104003);
    }

    #[test]
    fn test_calculate_amm_quote_price() {
        let spot_price = *config::SPOT;

        let iv = *config::IV;

        let dt = config::TIME_TO_MATURITY.to_vec();

        let is_call = config::IS_CALL.to_vec();

        let amm_position: Vec<f64> = config::USER_POSITION_1
            .to_vec()
            .iter()
            .map(|&p| p as f64)
            .collect();

        let strikes = config::STRIKE.to_vec();

        let futures_position = 40.0;

        let usdc_balance = 50000000.0;

        let quote_size = 0.01;

        // Aboves need to be inputs
        let (net_delta, amm_liquidity_btc) = total_amm_liquidity(
            spot_price,
            strikes.clone(),
            iv,
            dt.clone(),
            is_call.clone(),
            amm_position.clone(),
            futures_position,
            usdc_balance,
        );

        let (btc_delta_size_2ask, quote_price_2ask) = calculate_amm_quote_price(
            spot_price,
            OrderSide::Ask,
            net_delta,
            amm_liquidity_btc,
            quote_size,
        );

        println!("btc_delta_size_2ask {:?}", btc_delta_size_2ask);

        println!("quote_price_2ask {:?}", quote_price_2ask);

        let (btc_delta_size_2bid, quote_price_2bid) = calculate_amm_quote_price(
            spot_price,
            OrderSide::Bid,
            net_delta,
            amm_liquidity_btc,
            quote_size,
        );

        println!("btc_delta_size_2bid {:?}", btc_delta_size_2bid);

        println!("quote_price_2bid {:?}", quote_price_2bid);
    }

    #[test]
    fn test_calculate_amm_price() {
        let spot_price = *config::SPOT;

        let iv = *config::IV;

        let dt = config::TIME_TO_MATURITY.to_vec();

        let is_call = config::IS_CALL.to_vec();

        let amm_position: Vec<f64> = config::USER_POSITION_1
            .to_vec()
            .iter()
            .map(|&p| p as f64)
            .collect();

        let strikes = config::STRIKE.to_vec();

        let futures_position = 40.0;

        let usdc_balance = 50000000.0;

        let quote_size = 0.01;

        // Aboves need to be inputs
        let (net_delta, amm_liquidity_btc) = total_amm_liquidity(
            spot_price,
            strikes.clone(),
            iv,
            dt.clone(),
            is_call.clone(),
            amm_position.clone(),
            futures_position,
            usdc_balance,
        );

        let cdelta_btc_raw =
            delta_wrapper(spot_price, strikes.clone(), iv, dt.clone(), true, false);
        let pdelta_btc_raw =
            delta_wrapper(spot_price, strikes.clone(), iv, dt.clone(), false, false);

        let (btc_delta_size_2ask, quote_price_2ask) = calculate_amm_quote_price(
            spot_price,
            OrderSide::Ask,
            net_delta,
            amm_liquidity_btc,
            quote_size,
        );

        let (mut btc_delta_size_2bid, quote_price_2bid) = calculate_amm_quote_price(
            spot_price,
            OrderSide::Bid,
            net_delta,
            amm_liquidity_btc,
            quote_size,
        );

        let cprice_btc_2ask = calculate_amm_price(
            true,
            &quote_price_2ask,
            &cdelta_btc_raw,
            &strikes,
            iv,
            &dt,
            spot_price,
        );

        let cprice_btc_2ask_0 = cprice_btc_2ask[0].clone();

        println!("btc_delta_size_2ask {:?}", btc_delta_size_2ask);
        println!("cprice_btc_2ask[0] {:?}", cprice_btc_2ask_0);

        let cprice_btc_2bid = calculate_amm_price(
            true,
            &quote_price_2bid,
            &cdelta_btc_raw,
            &strikes,
            iv,
            &dt,
            spot_price,
        );

        let mut cprice_btc_2bid_0 = cprice_btc_2bid[0].clone();

        btc_delta_size_2bid.reverse();
        cprice_btc_2bid_0.reverse();

        println!("btc_delta_size_2bid {:?}", btc_delta_size_2bid);
        println!("cprice_btc_2bid[0] {:?}", cprice_btc_2bid_0);

        // PUT OPTION

        let (mut btc_delta_size_2ask, quote_price_2ask) = calculate_amm_quote_price(
            spot_price,
            OrderSide::Ask,
            net_delta,
            amm_liquidity_btc,
            quote_size,
        );

        let (mut btc_delta_size_2bid, quote_price_2bid) = calculate_amm_quote_price(
            spot_price,
            OrderSide::Bid,
            net_delta,
            amm_liquidity_btc,
            quote_size,
        );

        // the size should be reversed
        btc_delta_size_2ask.reverse();
        btc_delta_size_2bid.reverse();

        let pprice_btc_2ask = calculate_amm_price(
            false,
            &quote_price_2bid,
            &pdelta_btc_raw,
            &strikes,
            iv,
            &dt,
            spot_price,
        );

        let pprice_btc_2ask_0 = pprice_btc_2ask[0].clone();

        println!("btc_delta_size_2bid {:?}", btc_delta_size_2bid);
        println!("pprice_btc_2ask[0] {:?}", pprice_btc_2ask_0);

        let pprice_btc_2bid = calculate_amm_price(
            false,
            &quote_price_2ask,
            &pdelta_btc_raw,
            &strikes,
            iv,
            &dt,
            spot_price,
        );

        let mut pprice_btc_2bid_0 = pprice_btc_2bid[0].clone();

        btc_delta_size_2ask.reverse();
        pprice_btc_2bid_0.reverse();

        println!("btc_delta_size_2ask {:?}", btc_delta_size_2ask);
        println!("pprice_btc_2bid[0] {:?}", pprice_btc_2bid_0);

        println!(
            "btc_delta_size_2ask.len() {:?} pprice_btc_2bid.len() {:?} pprice_btc_2bid[0].len() {:?}",
            btc_delta_size_2ask.len(),
            pprice_btc_2bid.len(),
            pprice_btc_2bid[0].len()
        );
    }

    #[test]
    fn test_calculate_amm_size() {
        let spot_price = *config::SPOT;

        let iv = *config::IV;

        let dt = config::TIME_TO_MATURITY.to_vec();

        let is_call = config::IS_CALL.to_vec();

        let amm_position: Vec<f64> = config::USER_POSITION_1
            .to_vec()
            .iter()
            .map(|&p| p as f64)
            .collect();

        let strikes = config::STRIKE.to_vec();

        let futures_position = 40.0;

        let usdc_balance = 50000000.0;

        let quote_size = 0.01;

        // Aboves need to be inputs
        let (net_delta, amm_liquidity_btc) = total_amm_liquidity(
            spot_price,
            strikes.clone(),
            iv,
            dt.clone(),
            is_call.clone(),
            amm_position.clone(),
            futures_position,
            usdc_balance,
        );

        let cdelta_btc_raw =
            delta_wrapper(spot_price, strikes.clone(), iv, dt.clone(), true, false);
        let pdelta_btc_raw =
            delta_wrapper(spot_price, strikes.clone(), iv, dt.clone(), false, false);

        let (btc_delta_size_2ask, _quote_price_2ask) = calculate_amm_quote_price(
            spot_price,
            OrderSide::Ask,
            net_delta,
            amm_liquidity_btc,
            quote_size,
        );

        let (btc_delta_size_2bid, _quote_price_2bid) = calculate_amm_quote_price(
            spot_price,
            OrderSide::Bid,
            net_delta,
            amm_liquidity_btc,
            quote_size,
        );

        // println!("{:?}", cdelta_btc_raw);

        let call_size_2ask =
            calculate_amm_size(true, &btc_delta_size_2ask, &cdelta_btc_raw, quote_size);

        println!("call_size_2ask {:?}", call_size_2ask);

        let mut call_size_2bid =
            calculate_amm_size(true, &btc_delta_size_2bid, &cdelta_btc_raw, quote_size);

        // call_size_2bid.reverse();

        println!("call_size_2bid {:?}", call_size_2bid);

        // PUT OPTION

        let (mut btc_delta_size_2ask, _quote_price_2ask) = calculate_amm_quote_price(
            spot_price,
            OrderSide::Ask,
            net_delta,
            amm_liquidity_btc,
            quote_size,
        );

        let (mut btc_delta_size_2bid, _quote_price_2bid) = calculate_amm_quote_price(
            spot_price,
            OrderSide::Bid,
            net_delta,
            amm_liquidity_btc,
            quote_size,
        );

        // the size should be reversed
        btc_delta_size_2ask.reverse();
        btc_delta_size_2bid.reverse();

        let put_size_2ask =
            calculate_amm_size(false, &btc_delta_size_2bid, &pdelta_btc_raw, quote_size);

        println!("put_size_2ask {:?}", put_size_2ask);

        let mut put_size_2bid =
            calculate_amm_size(false, &btc_delta_size_2ask, &pdelta_btc_raw, quote_size);

        put_size_2bid.reverse();

        println!("put_size_2bid {:?}", put_size_2bid);

        println!(
            " put_size_2bid.len() {:?} put_size_2bid[0].len() {:?}",
            put_size_2bid.len(),
            put_size_2bid[0].len()
        );
    }
}
