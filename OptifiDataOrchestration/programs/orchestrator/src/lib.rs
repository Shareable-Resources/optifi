#[macro_use]
extern crate diesel;
extern crate dotenv;

pub mod constants;
pub mod db;
pub mod errors;
pub mod macros;
pub mod optifi;
pub mod solana;
pub mod utils;
pub mod workers;

use crate::db::fixtures::write_fixtures;
use crate::workers::serum_markets::serum_entrypoint::monitor_serum_markets;
pub use anchor_spl::associated_token::ID;
use futures::executor::block_on;
use log;
use solana::monitor;
use tokio::runtime::Builder;
use tokio::select;

pub fn main() {
    write_fixtures();

    let runtime = Builder::new_multi_thread()
        .thread_name("optifi")
        .enable_all()
        .build()
        .unwrap();

    let end_fut = runtime.spawn(async move {
        select! {
            _ = monitor() => {
                log::info!("Monitoring thread ended, stopping...");
            }
            _ = monitor_serum_markets() => {
                log::info!("Serum thread ended, stopping...");
            }
        }
    });

    block_on(end_fut).unwrap();

    log::info!("Optifi Data Orchestration exiting");
}
