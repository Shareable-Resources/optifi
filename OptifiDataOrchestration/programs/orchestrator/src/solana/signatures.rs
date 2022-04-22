use crate::constants::SOLANA_SIGNATURES_LIMIT;
use crate::solana::{get_client, Network};
use anchor_client::solana_client::rpc_client::GetConfirmedSignaturesForAddress2Config;
use async_stream::stream;
use solana_client::rpc_response::RpcConfirmedTransactionStatusWithSignature;
use solana_sdk::commitment_config::{CommitmentConfig, CommitmentLevel};
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Signature;
use tokio_stream::Stream;

fn parse_signature(partial: &RpcConfirmedTransactionStatusWithSignature) -> Option<Signature> {
    match partial.signature.parse() {
        Ok(s) => Some(s),
        Err(e) => {
            log::error!(
                "Couldn't deserialize signature, {}, {:?}",
                partial.signature,
                e
            );
            None
        }
    }
}

pub fn stream_signatures(network: Network, account: Pubkey) -> impl Stream<Item = Signature> {
    stream! {
         log::debug!(
         "Starting to stream signatures for account {}",
         account
     );

     let mut signatures_found = 0;
     let mut before: Option<Signature> = None;
     log::debug!("Getting client lock");
     let client = get_client(network);
     log::debug!("Outside of get signatures loop");
     loop {
         let sigs_res = client.get_signatures_for_address_with_config(
             &account,
             GetConfirmedSignaturesForAddress2Config {
                 before,
                 until: None,
                 limit: Some(SOLANA_SIGNATURES_LIMIT),
                 commitment: Some(CommitmentConfig {
                     // We only want confirmed signatures since
                     // we'll be searching for the relevant transaction immediately awfter
                     // receiving it
                     commitment: CommitmentLevel::Confirmed,
                 }),
             },
         );
         match sigs_res {
             Ok(sigs) => {
                 let sigs_len = sigs.len();
                 signatures_found += sigs_len;
                 for signature_meta in &sigs {
                        let sig_parse = parse_signature(signature_meta);
                         if let Some(parsed_sig) = sig_parse {
                            // We don't know how many of these are going to fail, so we just want
                             // to keep track of "what's the last valid signature we saw?"
                             // to use for the before parameter
                             before = sig_parse;
                             yield parsed_sig;
                        }

                 }
                 if sigs_len < SOLANA_SIGNATURES_LIMIT {
                     break;
                 } else {
                     parse_signature(sigs.last().unwrap()).and_then(|s| {
                         before = Some(s);
                         before
                     });
                 }
             }
             Err(e) => {
                 log::error!("Couldn't retrieve signatures {:?}", e);
                 break;
             }
         }
     }

     log::debug!(
         "Finished streaming signatures for {}, found {}",
         account,
         signatures_found
     );
    }
}
