// Useful macro rules

/// Find the closet multiple of m to n
/// ```rust
/// use optifi::nearest_multiple;
/// assert_eq!(nearest_multiple!(4900, 500), 5000);
/// ```
#[macro_export]
macro_rules! nearest_multiple {
    ($n: expr, $m: expr) => {{
        let a = ($n / $m) * $m;
        let b = (a + $m);
        if ($n - a) > (b - $n) {
            b
        } else {
            a
        }
    }};
}

/// Small helper macro to round a float to an i32
///
/// # Examples
/// ```rust
/// use optifi::round_as_int;
/// assert_eq!(round_as_int!((5.1f64 + 3.0f64)), 8i32)
/// ```
#[macro_export]
macro_rules! round_as_int {
    ($n: expr) => {
        (($n).round() as i32)
    };
}

/// Turn an unsigned int type that we were using for anchor representation into a
/// float by dividing it by 1000
///
/// # Examples
/// ```rust
/// use optifi::u_to_f_repr;
/// assert_eq!(u_to_f_repr!(25u64), 0.0025f64)
/// ```
#[macro_export]
macro_rules! u_to_f_repr {
    ($n: expr) => {
        (($n as f64) / 10000f64)
    };
}

/// Turn a float type that we were using for anchor representation into an unsigned int
/// by multiplying it by 1000
///
/// # Examples
/// ```rust
/// use optifi::f_to_u_repr;
/// assert_eq!(f_to_u_repr!(0.0025f64), 25u64)
/// ```
#[macro_export]
macro_rules! f_to_u_repr {
    ($n: expr) => {
        (($n * 10000f64) as u64)
    };
}

/// Turn an int type that we were using for anchor representation into a
/// float by dividing it by 1000
///
/// # Examples
/// ```rust
/// use optifi::i_to_f_repr;
/// assert_eq!(i_to_f_repr!(25i64), 0.0025f64)
/// ```
#[macro_export]
macro_rules! i_to_f_repr {
    ($n: expr) => {
        (($n as f64) / 10000f64)
    };
}

/// Turn a float type that we were using for anchor representation into an int
/// by multiplying it by 1000
///
/// # Examples
/// ```rust
/// use optifi::f_to_i_repr;
/// assert_eq!(f_to_i_repr!(0.0025f64), 25i64)
/// ```
#[macro_export]
macro_rules! f_to_i_repr {
    ($n: expr) => {
        (($n * 10000f64) as i64)
    };
}

/// Helper function for f_to_u_repr on a vec
///
/// # Examples
/// ```rust
/// use optifi::{fvec_to_uvec_repr, f_to_u_repr};
/// let repr: Vec<u64> = fvec_to_uvec_repr!(vec![0.0025f64]);
/// assert_eq!(repr, vec![25u64]);
/// ```
#[macro_export]
macro_rules! fvec_to_uvec_repr {
    ($v: expr) => {
        $v.iter().map(|y| f_to_u_repr!(*y)).collect()
    };
}

/// Helper function for u_to_f_repr on a vec
///
/// # Examples
/// ```rust
/// use optifi::{uvec_to_fvec_repr, u_to_f_repr};
/// let repr: Vec<f64> = uvec_to_fvec_repr!(vec![25u64]);
/// assert_eq!(repr, vec![0.0025f64]);
/// ```
#[macro_export]
macro_rules! uvec_to_fvec_repr {
    ($v: expr) => {
        $v.iter().map(|y| u_to_f_repr!(*y)).collect()
    };
}

/// Alternative floor() implementation, since it seems that the native floor isn't compatible
/// with BPF
///
/// ```rust
/// use optifi::{floor};
/// assert_eq!(floor!(5.8f64), 5.0f64);
/// ```
#[macro_export]
macro_rules! floor {
    ($n: expr) => {
        $n - ($n % 1f64)
    };
}

/// ```rust
/// use optifi::{ceil};
/// assert_eq!(ceil!(5.8f64), 6.0f64);
/// ```
#[macro_export]
macro_rules! ceil {
    ($n: expr) => {
        $n - ($n % 1f64) + 1f64
    };
}
