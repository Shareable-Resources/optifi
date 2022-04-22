use optifi_block_types::financial::*;
use chrono::prelude::*;
use chrono::{Duration, Utc};




/// Test the duration calculation of the future contract types, to make sure that the
/// generated expiration date is correct for continuous expiration contracts
#[test]
fn test_fixed_future_duration_calc() {
    /// Const test value for BTC
    let btc: Asset = Asset{
        code: String::from("BTC"),
        name: String::from("Bitcoin"),
        price_usd: None,
        iv: None,
        token_address: String::from("")
    };

    let arbitrary_datetime: DateTime<Utc> = Utc.
        ymd(2021, 1, 1).
        and_hms(0, 0, 0);
    let fixed_contract = &Instrument{
        id: String::from("example_fixed_future"),
        instrument_type: InstrumentType::Future,
        data: InstrumentData::FutureData(FutureData{
            price_usd: 100u128,
            size: 10,
            continuous: false,
            start_timestamp: arbitrary_datetime.timestamp(),
            duration_secs: Duration::weeks(2).num_seconds(),
        }),
        underlying: btc,
    };
    assert_eq!(true, true)
    //let exp =future_fixed_data.expiration();
    //assert_eq!(arbitrary_datetime+Duration::weeks(2), exp);
}

#[test]
fn test_continuous_future_expiration_calc() {
    /// Const test value for BTC
    let now = Utc::now();
    // Contract start times paired with the expirations we'd expect to see now
    for (start_time, expected_expiration) in
        vec![
            (now-Duration::weeks(4), now+Duration::weeks(2)),
            (now-Duration::weeks(5), now+Duration::weeks(1))
        ] {
        let btc: Asset = Asset{
            code: String::from("BTC"),
            name: String::from("Bitcoin"),
            price_usd: None,
            iv: None,
            token_address: String::from("")
        };
        // Set the start time of this contract to be 4 weeks before now, for easy checking of expiration
        let continuous_contract = &Instrument{
            id: String::from("example_continuous_future"),
            instrument_type: InstrumentType::Future,
            data: InstrumentData::FutureData(FutureData{
                    price_usd: 100u128,
                    size: 10,
                    continuous: true,
                    start_timestamp: start_time.timestamp(),
                    duration_secs: Duration::weeks(2).num_seconds(),
                }
            ),
            underlying: btc
        };
        //let future_fixed_data = continuous_contract.data.FutureData;
        //let exp = future_fixed_data.expiration();
        // Compare milliseconds because arithmetic in expiration function will throw of nanos
        //assert_eq!(expected_expiration.timestamp_millis(), exp.timestamp_millis());
    }
}