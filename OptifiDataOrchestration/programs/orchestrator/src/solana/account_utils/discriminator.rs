use sha2::{Digest, Sha256};

pub fn get_account_discriminator(data: Box<Vec<u8>>) -> Option<[u8; 8]> {
    return if data.len() >= 8 {
        let mut data_slice: [u8; 8] = [0u8; 8];
        data_slice.clone_from_slice(&data[0..8]);
        Some(data_slice)
    } else {
        None
    };
}

pub fn has_discriminator(data: Box<Vec<u8>>, account: &str) -> bool {
    let mut hasher = Sha256::new();
    hasher.update(format!("account:{}", account).as_bytes());
    let mut hash_slice: [u8; 8] = [0u8; 8];
    let hash_finalize = hasher.finalize();
    let hash = hash_finalize.as_slice();
    if hash.len() >= 8 {
        hash_slice.copy_from_slice(&hash[0..8]);
    } else {
        hash_slice.copy_from_slice(&hash[0..]);
    }
    let discriminator = get_account_discriminator(data);
    match discriminator {
        Some(d) => d == hash_slice,
        None => false,
    }
}
