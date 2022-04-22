use crate::constants::{
    BITCOIN_CODE, CALL_CODE, ETHEREUM_CODE, FUTURE_CODE, PERPETUAL_CODE, PUT_CODE, STANDARD_CODE,
    USDC_CODE,
};
use optifi::financial::instruments::{ExpiryType, InstrumentType};
use optifi::financial::Asset;

macro_rules! malformed_panic_msg {
    ($i: literal, $n: expr) => {
        format!("Malformed data on chain {} value {} did not correspond to an optifi {}, corrupted system data",
        $i, $n, $i).as_str()
    }
}

pub fn optifi_asset_to_asset_code(rel_asset: u8) -> &'static str {
    let asset = Asset::try_from(rel_asset).expect(malformed_panic_msg!("asset", rel_asset));
    match asset {
        Asset::Bitcoin => BITCOIN_CODE,
        Asset::Ethereum => ETHEREUM_CODE,
        Asset::USDC => USDC_CODE,
    }
}

pub fn optifi_instrument_type_to_instrument_type_code(
    rel_instrument_type: InstrumentType,
) -> &'static str {
    match rel_instrument_type {
        InstrumentType::Put => PUT_CODE,
        InstrumentType::Call => CALL_CODE,
        InstrumentType::Future => FUTURE_CODE,
    }
}

pub fn optifi_expiry_type_to_expiry_type_code(rel_expiry_type: ExpiryType) -> &'static str {
    match rel_expiry_type {
        ExpiryType::Standard => STANDARD_CODE,
        ExpiryType::Perpetual => PERPETUAL_CODE,
    }
}
