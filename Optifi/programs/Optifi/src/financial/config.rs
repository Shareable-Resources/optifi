//! # Mock data

use lazy_static::*;

lazy_static! {
    /// SPOT
    pub static ref  SPOT: f64 = 48400 as f64;
    /// SPOT_STRESS
    pub static ref  SPOT_STRESS: f64 = 0.3;
    /// IV
    pub static ref  IV: f64 = 1.0;
    /// RATE
    pub static ref  RATE: f64 = 0.0;
    /// DVD_YLD
    pub static ref  DVD_YLD: f64 = 0.0;
    /// STRIKE
    pub static ref STRIKE: Vec<f64> = [
            39000, 42000, 45000, 48000, 53000, 58000, 75000, 39000, 42000, 45000, 48000, 53000, 58000,
            75000, 39000, 42000, 45000, 48000, 53000, 58000, 75000, 39000, 42000, 45000, 48000, 53000,
            58000, 75000,
        ]
        .to_vec()
        .iter()
        .map(|e| *e as f64)
        .collect();
    /// TIME_TO_MATURITY
    pub static ref TIME_TO_MATURITY: Vec<f64> = [
            0.0254814, 0.0254814, 0.0254814, 0.0254814, 0.0254814, 0.0254814, 0.0254814, 0.0254814,
            0.0254814, 0.0254814, 0.0254814, 0.0254814, 0.0254814, 0.0254814, 0.0446594, 0.0446594,
            0.0446594, 0.0446594, 0.0446594, 0.0446594, 0.0446594, 0.0446594, 0.0446594, 0.0446594,
            0.0446594, 0.0446594, 0.0446594, 0.0446594,
        ]
        .to_vec();
    /// IS_CALL
    pub static ref IS_CALL: Vec<u8> = [
            0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1,
        ].to_vec();

    /// USER_POSITION_1
    pub static ref USER_POSITION_1: Vec<i8> = [
        0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]
    .to_vec();
    /// USER_POSITION_2
    pub static ref USER_POSITION_2: Vec<i8> = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0,
    ]
    .to_vec();

    /// USER_POSITION_3
    pub static ref USER_POSITION_3: Vec<i8> = [
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1,
    ]
    .to_vec();

}
