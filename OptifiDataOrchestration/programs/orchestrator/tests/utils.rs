use flexi_logger::{
    colored_with_thread, AdaptiveFormat, Cleanup, Criterion, Duplicate, FileSpec, FormatFunction,
    Logger, Naming,
};

pub fn initialize_test_logging() {
    Logger::try_with_env_or_str("debug")
        .expect("Couldn't initialize logger object")
        .log_to_file(FileSpec::default().directory("log").suppress_timestamp())
        .rotate(
            // Keep 10 MB log files
            Criterion::Size(10u64 * (1000 * 1000)),
            Naming::Timestamps,
            Cleanup::KeepLogFiles(20),
        )
        .adaptive_format_for_stderr(AdaptiveFormat::WithThread)
        .append()
        .duplicate_to_stderr(Duplicate::Debug)
        .start()
        .expect("Couldn't start initialized logger");
}
