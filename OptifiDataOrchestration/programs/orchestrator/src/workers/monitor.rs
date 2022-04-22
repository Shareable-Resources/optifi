use crate::db::connection::establish_connection;
use crate::db::programs::dsl::*;
use crate::db::Program;
use crate::workers::program::monitor_program;
use diesel::prelude::*;
use log::info;
use std::collections::HashSet;
use std::time::Duration;
use tokio::spawn;
use tokio::time::interval;

fn poll_programs() -> Vec<Program> {
    // Query the optifi programs table, for each network
    let connection = establish_connection();
    programs
        .load::<Program>(&connection)
        .expect("Error loading programs")
}

/// Launch threads to monitor the Optifi program on all of the networks that it's running on
pub async fn monitor() {
    info!("Starting monitoring");
    let mut programs_monitored: HashSet<i32> = HashSet::new();
    // Check the programs database every 10 minutes
    let mut interval = interval(Duration::from_secs(60 * 10));
    loop {
        interval.tick().await;
        let program_ids = poll_programs();
        info!("Got {} program ids", program_ids.len());
        for program_info in program_ids {
            let rel_program_id: i32 = program_info.id.clone();
            if !programs_monitored.contains(&rel_program_id) {
                spawn(async move {
                    monitor_program(program_info).await;
                });
                programs_monitored.insert(rel_program_id);
            }
        }
    }
}
