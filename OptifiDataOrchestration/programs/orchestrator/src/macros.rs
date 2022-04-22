/// Macro which acts as a timer, running the block of code
/// in `x` every `seconds` seconds, until the condition in `until` is met
#[macro_export]
macro_rules! every {
    ($seconds: expr, $b: expr, $until: block) => {
        ::std::thread::spawn(|| loop {
            if ($until) {
                $b;
                ::std::thread::sleep(::std::time::Duration::from_secs($seconds));
            }
        });
    };
}
