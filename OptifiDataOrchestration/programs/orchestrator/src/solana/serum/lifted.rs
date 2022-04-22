use crate::constants::FAKE_OWNER;
/**
These functions are repurposed and extended from the Serum dex repo
 **/
use crate::solana::CompliantClient;
use anyhow::{format_err, Error, Result};
use arrayref::mut_array_refs;
use borsh::BorshSerialize;
use bytemuck::{cast_slice, cast_slice_mut, try_cast_slice_mut, try_from_bytes_mut, Pod, Zeroable};
use enumflags2::BitFlags;
use safe_transmute::{
    transmute_many, transmute_many_pedantic, transmute_one_pedantic, transmute_one_to_bytes,
    transmute_to_bytes, SingleManyGuard,
};
use serum_dex::critbit::Slab;
use serum_dex::error::DexResult;
use serum_dex::state::{
    gen_vault_signer_key, AccountFlag, Event, EventQueueHeader, Market, MarketState, MarketStateV2,
    QueueHeader, Request, RequestQueueHeader, ACCOUNT_HEAD_PADDING, ACCOUNT_TAIL_PADDING,
};
use sha2::digest::generic_array::typenum::Zero;
use solana_sdk::account_info::AccountInfo;
use solana_sdk::clock::Epoch;
use solana_sdk::pubkey::Pubkey;
use std::borrow::Cow;
use std::cell::{RefCell, RefMut};
use std::convert::identity;
use std::mem::size_of;
use std::rc::Rc;
use std::str::FromStr;

#[derive(Debug)]
pub struct MarketPubkeys {
    pub market: Box<Pubkey>,
    pub req_q: Box<Pubkey>,
    pub event_q: Box<Pubkey>,
    pub bids: Box<Pubkey>,
    pub asks: Box<Pubkey>,
    pub coin_vault: Box<Pubkey>,
    pub pc_vault: Box<Pubkey>,
    pub vault_signer_key: Box<Pubkey>,
}

#[inline]
fn remove_slop<T: Pod>(bytes: &[u8]) -> &[T] {
    let slop = bytes.len() % size_of::<T>();
    let new_len = bytes.len() - slop;
    cast_slice(&bytes[..new_len])
}

#[inline]
fn remove_slop_mut<T: Pod>(bytes: &mut [u8]) -> &mut [T] {
    let slop = bytes.len() % size_of::<T>();
    let new_len = bytes.len() - slop;
    cast_slice_mut(&mut bytes[..new_len])
}

fn init_account_padding(data: &mut [u8]) -> DexResult<&mut [[u8; 8]]> {
    assert!(data.len() >= 12);
    let (head, data, tail) = mut_array_refs![data, 5; ..; 7];
    *head = *ACCOUNT_HEAD_PADDING;
    *tail = *ACCOUNT_TAIL_PADDING;
    Ok(try_cast_slice_mut(data).unwrap())
}

fn check_account_padding(data: &mut [u8]) -> DexResult<&mut [[u8; 8]]> {
    assert!(data.len() >= 12);
    let (head, data, tail) = mut_array_refs![data, 5; ..; 7];
    assert_eq!(head, ACCOUNT_HEAD_PADDING);
    assert_eq!(tail, ACCOUNT_TAIL_PADDING);
    Ok(try_cast_slice_mut(data).unwrap())
}

pub fn strip_account_padding(
    padded_data: &mut [u8],
    init_allowed: bool,
) -> DexResult<&mut [[u8; 8]]> {
    if init_allowed {
        init_account_padding(padded_data)
    } else {
        check_account_padding(padded_data)
    }
}

pub fn strip_header<'a, H: Pod, D: Pod>(
    account: &'a AccountInfo,
    init_allowed: bool,
) -> DexResult<(RefMut<'a, H>, RefMut<'a, [D]>)> {
    let mut result = Ok(());
    let (header, inner): (RefMut<'a, [H]>, RefMut<'a, [D]>) =
        RefMut::map_split(account.try_borrow_mut_data()?, |padded_data| {
            let dummy_value: (&mut [H], &mut [D]) = (&mut [], &mut []);
            let padded_data: &mut [u8] = *padded_data;
            let u64_data = match strip_account_padding(padded_data, init_allowed) {
                Ok(u64_data) => u64_data,
                Err(e) => {
                    result = Err(e);
                    return dummy_value;
                }
            };

            let data: &mut [u8] = cast_slice_mut(u64_data);
            let (header_bytes, inner_bytes) = data.split_at_mut(size_of::<H>());
            let header: &mut H;
            let inner: &mut [D];

            header = match try_from_bytes_mut(header_bytes) {
                Ok(h) => h,
                Err(_e) => {
                    panic!("{}", _e);
                }
            };
            inner = remove_slop_mut(inner_bytes);

            (std::slice::from_mut(header), inner)
        });
    result?;
    let header = RefMut::map(header, |s| s.first_mut().unwrap_or_else(|| unreachable!()));
    Ok((header, inner))
}

#[derive(Copy, Clone)]
#[repr(packed)]
pub struct OrderBookStateHeader {
    account_flags: u64, // Initialized, (Bids or Asks)
}
unsafe impl Zeroable for OrderBookStateHeader {}
unsafe impl Pod for OrderBookStateHeader {}

pub fn parse_event_queue(data_words: &[u64]) -> Result<(EventQueueHeader, &[Event], &[Event])> {
    let (header_words, event_words) = data_words.split_at(size_of::<EventQueueHeader>() >> 3);
    let header: EventQueueHeader =
        transmute_one_pedantic(transmute_to_bytes(header_words)).map_err(|e| e.without_src())?;
    let events: &[Event] = transmute_many::<_, SingleManyGuard>(transmute_to_bytes(event_words))
        .map_err(|e| e.without_src())?;
    let (tail_seg, head_seg) = events.split_at(header.head() as usize);
    let head_len = head_seg.len().min(header.count() as usize);
    let tail_len = header.count() as usize - head_len;
    Ok((header, &head_seg[..head_len], &tail_seg[..tail_len]))
}

pub fn parse_orderbook(data_words: &[u64]) -> Result<Vec<u8>> {
    let (_, order_book_words) = data_words.split_at(size_of::<OrderBookStateHeader>() >> 3);
    let orders: &[u8] = transmute_many::<_, SingleManyGuard>(transmute_to_bytes(order_book_words))
        .map_err(|e| e.without_src())?;
    Ok(orders.try_to_vec()?)
}

pub fn parse_req_queue(data_words: &[u64]) -> Result<(RequestQueueHeader, &[Request], &[Request])> {
    let (header_words, request_words) = data_words.split_at(size_of::<RequestQueueHeader>() >> 3);
    let header: RequestQueueHeader =
        transmute_one_pedantic(transmute_to_bytes(header_words)).map_err(|e| e.without_src())?;
    let request: &[Request] =
        transmute_many::<_, SingleManyGuard>(transmute_to_bytes(request_words))
            .map_err(|e| e.without_src())?;
    let (tail_seg, head_seg) = request.split_at(header.head() as usize);
    let head_len = head_seg.len().min(header.count() as usize);
    let tail_len = header.count() as usize - head_len;
    Ok((header, &head_seg[..head_len], &tail_seg[..tail_len]))
}

pub fn read_event_queue(client: &CompliantClient, market_keys: MarketPubkeys) -> Result<()> {
    let event_q_data = client.get_account_data(&market_keys.event_q)?;
    let inner: Cow<[u64]> = remove_dex_account_padding(&event_q_data)?;
    let (header, events_seg0, events_seg1) = parse_event_queue(&inner)?;
    println!("here!");
    Ok(())
}

pub fn load_asks_mut<'a>(asks: &'a AccountInfo) -> DexResult<RefMut<'a, Slab>> {
    let (header, buf) = strip_header::<OrderBookStateHeader, u8>(asks, false)?;
    let flags = BitFlags::from_bits(header.account_flags).unwrap();
    assert_eq!(&flags, &(AccountFlag::Initialized | AccountFlag::Asks));
    Ok(RefMut::map(buf, Slab::new))
}

pub fn load_bids_mut<'a>(bids: &'a AccountInfo) -> DexResult<RefMut<'a, Slab>> {
    let (header, buf) = strip_header::<OrderBookStateHeader, u8>(bids, false)?;
    let flags = BitFlags::from_bits(header.account_flags).unwrap();
    assert_eq!(&flags, &(AccountFlag::Initialized | AccountFlag::Bids));
    Ok(RefMut::map(buf, Slab::new))
}

pub enum OrderbookDataType {
    Bids,
    Asks,
}

#[macro_export]
macro_rules! gen_account_info {
    ($key: expr, $lamports: expr, $data: expr, $owner: expr) => {
        AccountInfo::new(
            &$key,
            true,
            true,
            $lamports.as_mut(),
            $data.as_mut_slice(),
            &$owner,
            true,
            Epoch::from(1000u64),
        )
    };
}

pub fn remove_dex_account_padding<'a>(data: &'a [u8]) -> Result<Cow<'a, [u64]>> {
    use serum_dex::state::{ACCOUNT_HEAD_PADDING, ACCOUNT_TAIL_PADDING};
    let head = &data[..ACCOUNT_HEAD_PADDING.len()];
    if data.len() < ACCOUNT_HEAD_PADDING.len() + ACCOUNT_TAIL_PADDING.len() {
        return Err(format_err!(
            "dex account length {} is too small to contain valid padding",
            data.len()
        ));
    }
    if head != ACCOUNT_HEAD_PADDING {
        return Err(format_err!("dex account head padding mismatch"));
    }
    let tail = &data[data.len() - ACCOUNT_TAIL_PADDING.len()..];
    if tail != ACCOUNT_TAIL_PADDING {
        return Err(format_err!("dex account tail padding mismatch"));
    }
    let inner_data_range = ACCOUNT_HEAD_PADDING.len()..(data.len() - ACCOUNT_TAIL_PADDING.len());
    let inner: &'a [u8] = &data[inner_data_range];
    let words: Cow<'a, [u64]> = match transmute_many_pedantic::<u64>(inner) {
        Ok(word_slice) => Cow::Borrowed(word_slice),
        Err(transmute_error) => {
            let word_vec = transmute_error.copy().map_err(|e| e.without_src())?;
            Cow::Owned(word_vec)
        }
    };
    Ok(words)
}

pub fn get_keys_for_market<'a>(
    client: &'a CompliantClient,
    program_id: &'a Pubkey,
    market: &'a Pubkey,
) -> Result<(MarketPubkeys, MarketState)> {
    let account_data: Vec<u8> = client.get_account_data(&market)?;
    let words: Cow<[u64]> = remove_dex_account_padding(&account_data)?;
    let market_state: MarketState = {
        let account_flags = Market::account_flags(&account_data)?;
        if account_flags.intersects(AccountFlag::Permissioned) {
            let state = transmute_one_pedantic::<MarketStateV2>(transmute_to_bytes(&words))
                .map_err(|e| e.without_src())?;
            state.check_flags()?;
            state.inner
        } else {
            let state = transmute_one_pedantic::<MarketState>(transmute_to_bytes(&words))
                .map_err(|e| e.without_src())?;
            state.check_flags()?;
            state
        }
    };
    let vault_signer_key =
        gen_vault_signer_key(market_state.vault_signer_nonce, market, program_id)?;
    assert_eq!(
        transmute_to_bytes(&identity(market_state.own_address)),
        market.as_ref()
    );
    Ok((
        MarketPubkeys {
            market: Box::new(*market),
            req_q: Box::new(Pubkey::new(transmute_one_to_bytes(&identity(
                market_state.req_q,
            )))),
            event_q: Box::new(Pubkey::new(transmute_one_to_bytes(&identity(
                market_state.event_q,
            )))),
            bids: Box::new(Pubkey::new(transmute_one_to_bytes(&identity(
                market_state.bids,
            )))),
            asks: Box::new(Pubkey::new(transmute_one_to_bytes(&identity(
                market_state.asks,
            )))),
            coin_vault: Box::new(Pubkey::new(transmute_one_to_bytes(&identity(
                market_state.coin_vault,
            )))),
            pc_vault: Box::new(Pubkey::new(transmute_one_to_bytes(&identity(
                market_state.pc_vault,
            )))),
            vault_signer_key: Box::new(vault_signer_key),
        },
        market_state,
    ))
}
