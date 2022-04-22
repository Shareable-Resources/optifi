use crate::conf::initialize_loging;
use dotenv::dotenv;
use log;
use orchestrator;
pub mod conf;

fn main() {
    dotenv().ok();
    initialize_loging();
    log::info!("Running Optifi data orchestration system");
    orchestrator::main();
    log::info!("Shutting down Optifi data orchestration system")
}
