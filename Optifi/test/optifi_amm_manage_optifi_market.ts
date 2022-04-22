import * as anchor from "@project-serum/anchor";
import Config from "./config.json";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  OpenOrders,
  OpenOrdersPda,
  Logger,
  ReferralFees,
  MarketProxyBuilder,
  Market,
  Orderbook,
} from "@project-serum/serum";
import {
  TOKEN_PROGRAM_ID,
  Token,
  AccountLayout,
  MintLayout,
} from "@solana/spl-token";
import { Asset } from "./optifi-exchange-types";
import {
  getDexOpenOrders,
  getUserAccount,
  getSerumMarketAuthority,
  getAmmLiquidityAuth,
  getAmmAccount,
} from "./utils/pda";
import optifiMarkets from "./assets/optifi_markets.json";
import amm from "./assets/amm.json";
import { AMM_INDEX } from "./constants";

const serumDexProgramId = new PublicKey(
  Config.Serum_Dex_ProgramId // serum dex program id on devnet
);
// Address of the deployed OptiFi program.
const programId = new anchor.web3.PublicKey(Config.OptiFi_ProgramId);

const connection = new anchor.web3.Connection(
  "https://api.devnet.solana.com/",
  "recent"
);
const idl = JSON.parse(
  require("fs").readFileSync("./target/idl/optifi_exchange.json", "utf8")
);

// ====================================================
// switch users here
// ====================================================
let user = Config.user_profiles.user1;
const myWallet = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(
    JSON.parse(
      require("fs").readFileSync(
        user.WALLET_PATH || process.env.MY_WALLET,
        "utf8"
      )
    )
  )
);
const walletWrapper = new anchor.Wallet(myWallet);
const provider = new anchor.Provider(connection, walletWrapper, {
  preflightCommitment: "recent",
});
const program = new anchor.Program(idl, programId, provider);

let amm_idx = AMM_INDEX; // need to query the number of amm in exchange

describe("optifi", () => {
  // it("should initialize open orders for amm to place order on the optifi market", async function () {
  //   try {
  //     let [ammLiquidityAuth, _bump] = await getAmmLiquidityAuth();
  //     console.log("ammLiquidityAuth: ", ammLiquidityAuth.toString());

  //     optifiMarkets.forEach(async (optifiMarket) => {
  //       let [dexOpenOrders, bump2] = await getDexOpenOrders(
  //         new PublicKey(Config.OptiFi_Exchange_Id),
  //         new PublicKey(optifiMarket.serumMarket),
  //         ammLiquidityAuth
  //       );

  //       console.log("user dexOpenOrders: ", dexOpenOrders.toString());

  //       let [serumMarketAuthority, _bump3] = await getSerumMarketAuthority();
  //       const tx1 = await program.rpc.initAmmOnOptifiMarket(bump2, {
  //         accounts: {
  //           optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
  //           ammAuthority: ammLiquidityAuth,
  //           serumOpenOrders: dexOpenOrders,
  //           optifiMarket: new PublicKey(optifiMarket.optifiMarket),
  //           serumMarketAuthority,
  //           serumMarket: new PublicKey(optifiMarket.serumMarket),
  //           serumDexProgramId: serumDexProgramId,
  //           payer: myWallet.publicKey,
  //           systemProgram: SystemProgram.programId,
  //           rent: SYSVAR_RENT_PUBKEY,
  //         },
  //         // signers: [],
  //         instructions: [],
  //       });
  //       console.log("initUserOnOptifiMarket tx: ", tx1);
  //     });
  //   } catch (e) {
  //     console.log(e);
  //     throw e;
  //   }
  // });

  // it("should initialize instrument long and short spl token vaults for the amm", async function () {
  //   try {
  //     let [ammLiquidityAuth, _bump] = await getAmmLiquidityAuth();
  //     optifiMarkets.forEach(async (optifiMarket) => {
  //       console.log(
  //         "init instrument tokens for market : ",
  //         optifiMarket.optifiMarketId
  //       );
  //       const userLongSplVaultWallet = anchor.web3.Keypair.generate();
  //       const userLongSplVaultPk = userLongSplVaultWallet.publicKey;
  //       const userShortSplVaultWallet = anchor.web3.Keypair.generate();
  //       const userShortSplVaultPk = userShortSplVaultWallet.publicKey;
  //       const tx1 = new Transaction();
  //       tx1.add(
  //         // long spl token vault
  //         SystemProgram.createAccount({
  //           fromPubkey: myWallet.publicKey,
  //           newAccountPubkey: userLongSplVaultPk,
  //           lamports: await connection.getMinimumBalanceForRentExemption(
  //             AccountLayout.span
  //           ),
  //           space: AccountLayout.span,
  //           programId: TOKEN_PROGRAM_ID,
  //         }),

  //         Token.createInitAccountInstruction(
  //           TOKEN_PROGRAM_ID,
  //           new PublicKey(optifiMarket.longSplTokenMint),
  //           userLongSplVaultPk,
  //           ammLiquidityAuth
  //         ),

  //         // short spl token vault
  //         SystemProgram.createAccount({
  //           fromPubkey: myWallet.publicKey,
  //           newAccountPubkey: userShortSplVaultPk,
  //           lamports: await connection.getMinimumBalanceForRentExemption(
  //             AccountLayout.span
  //           ),
  //           space: AccountLayout.span,
  //           programId: TOKEN_PROGRAM_ID,
  //         }),

  //         Token.createInitAccountInstruction(
  //           TOKEN_PROGRAM_ID,
  //           new PublicKey(optifiMarket.shortSplTokenMint),
  //           userShortSplVaultPk,
  //           ammLiquidityAuth
  //         )
  //       );
  //       let tx1_res = await provider.send(tx1, [
  //         userLongSplVaultWallet,
  //         userShortSplVaultWallet,
  //       ]);
  //       console.log("txid: ", tx1_res);
  //       console.log("userLongSplVaultPk: ", userLongSplVaultPk.toString());
  //       console.log("userShortSplVaultPk: ", userShortSplVaultPk.toString());
  //     });
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });

  it("should add the optifi market for AMM", async function () {
    optifiMarkets.forEach(async (optifiMarket) => {
      try {
        let [AmmAccount, bump] = await getAmmAccount(
          new PublicKey(Config.OptiFi_Exchange_Id),
          amm_idx
        );
        console.log("AmmAccount: ", AmmAccount.toString());

        console.log("optifiMarket.instrument: ", optifiMarket.instrument);
        const ammAddInstrumentTx = await program.rpc.ammAddInstrument({
          accounts: {
            optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
            amm: AmmAccount,
            optifiMarket: new PublicKey(optifiMarket.optifiMarket),
            instrument: new PublicKey(optifiMarket.instrument),
            ammLongTokenVault: new PublicKey(
              amm[amm_idx - 1][optifiMarket.optifiMarketId].longSplVault
            ),
            ammShortTokenVault: new PublicKey(
              amm[amm_idx - 1][optifiMarket.optifiMarketId].shortSplVault
            ),
            clock: SYSVAR_CLOCK_PUBKEY,
          },
        });
        console.log("ammAddInstrument txid: ", ammAddInstrumentTx);
      } catch (e) {
        console.log(e);
      }
    });
  });
});
