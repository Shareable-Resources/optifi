import * as anchor from "@project-serum/anchor";
import Config from "../config.json";
import {
  AccountLayout,
  MintLayout,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  Keypair,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

const programId = new PublicKey(Config.OptiFi_ProgramId);
const serumDexProgramId = new PublicKey(Config.Serum_Dex_ProgramId); // serum dex program id on devnet

// ==================================================================
// For Optifi Exchange use
// ==================================================================
export const getOptiFiExchange = async (uuid: String) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("optifi_exchange"), Buffer.from(uuid)],
    programId
  );
};
/// PDA is the account which controls all user's usdc vaults
export const getPDA = async (optifi_exchange: PublicKey) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("user_token_account_pda"), optifi_exchange.toBuffer()],
    programId
  );
};

export const getCentralUsdcPoolAuth = async (
  optifi_exchange_id: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("central_usdc_pool_auth"), optifi_exchange_id.toBuffer()],
    programId
  );
};

// ==================================================================
// For User Account use
// ==================================================================

// user account(pda) controls all spl token vaults of the user
export const getUserAccount = async (
  optifi_exchange_id: PublicKey,
  wallet: PublicKey
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("user_account"),
      optifi_exchange_id.toBuffer(),
      wallet.toBuffer(),
    ],
    programId
  );
};

// ==================================================================
// For Serum Orderbook use
// ==================================================================
const getVaultOwnerAndNonce = async (
  marketPublicKey: PublicKey,
  dexProgramId = serumDexProgramId
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [marketPublicKey.toBuffer()],
    dexProgramId
  );
};

export const getVaultOwnerAndNonce2 = async (
  marketPublicKey: PublicKey,
  dexProgramId = serumDexProgramId
): Promise<[anchor.web3.PublicKey, anchor.BN]> => {
  const nonce = new anchor.BN(0);
  while (nonce.toNumber() < 255) {
    try {
      const vaultOwner = await PublicKey.createProgramAddress(
        [marketPublicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
        dexProgramId
      );
      return [vaultOwner, nonce];
    } catch (e) {
      nonce.iaddn(1);
    }
  }
  throw new Error("Unable to find nonce");
};

// optifi_market_mint_auth pda is the account which can mint instrument spl tokens to user
export const get_optifi_market_mint_auth_pda = async (
  optifi_exchange: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("optifi_market_mint_auth"), optifi_exchange.toBuffer()],
    programId
  );
};

// optifi_market_auth pda is the account which can has the authority over the creating serum market
export const getSerumMarketAuthority = async (
  optifi_exchange: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("serum_market_auth"), optifi_exchange.toBuffer()],
    programId
  );
};

// optifi_prune_auth pda is the account which can has the prune authority
// over the open orders accounts on the creating serum market
export const getSerumPruneAuthority = async (
  optifi_exchange: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("serum_prune_auth"), optifi_exchange.toBuffer()],
    programId
  );
};

// ==================================================================
// For Optifi Market use
// ==================================================================
export const getOptifiMarket = async (
  exchangePk: PublicKey,
  marketId: number
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("optifi_market"),
      exchangePk.toBuffer(),
      // Uint8Array.of(id),
      new anchor.BN(marketId).toArrayLike(Buffer, "be", 8),
    ],
    programId
  );
};

export const getDexOpenOrders = async (
  optifi_exchange_id: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id),
  serumMarketId: PublicKey = new PublicKey(
    Config.Created_Serum_Orderbook.market
  ),
  user_account: PublicKey
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("serum_open_orders"),
      optifi_exchange_id.toBuffer(),
      serumMarketId.toBuffer(),
      user_account.toBuffer(),
    ],
    programId
  );
};

// ==================================================================
// For AMM use
// ==================================================================

// amm account(pda) controls spl tokens execept usdc vaults of the Amm
export const getAmmAccount = async (
  optifi_exchange_id: PublicKey,
  amm_idx: number
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("amm"),
      optifi_exchange_id.toBuffer(),
      // Buffer.from([amm_idx])
      Uint8Array.of(amm_idx),
    ],
    programId
  );
};

// amm usdc vault auth(pda) controls the usdc vault of ALL AMMs
export const getAmmLiquidityAuth = async (
  optifi_exchange_id: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("amm_liquidity_auth"), optifi_exchange_id.toBuffer()],
    programId
  );
};
