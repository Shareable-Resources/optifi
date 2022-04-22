import * as anchor from "@project-serum/anchor";
import Config from "./config.json";
import { PublicKey } from "@solana/web3.js";
import { getAmmLiquidityAuth, getAmmAccount } from "./utils/pda";
import optifiMarkets from "./assets/optifi_markets.json";
import amm from "./assets/amm.json";
import {AMM_INDEX} from "./constants"

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
  it("should synchronize the Amm position", async function () {
    optifiMarkets.forEach(async (optifiMarket, i) => {
      try {
        let instrument_index = i;
        let [AmmAccount, bump] = await getAmmAccount(
          new PublicKey(Config.OptiFi_Exchange_Id),
          amm_idx
        );
        let [ammLiquidityAuth, _bump] = await getAmmLiquidityAuth();

        const syncAmmPositionsTx = await program.rpc.ammSyncPositions(
          new anchor.BN(instrument_index),
          {
            accounts: {
              amm: AmmAccount,
              optifiMarket: new PublicKey(optifiMarket.optifiMarket),
              longTokenVault: new PublicKey(
                amm[amm_idx - 1][optifiMarket.optifiMarketId].longSplVault
              ),
              shortTokenVault: new PublicKey(
                amm[amm_idx - 1][optifiMarket.optifiMarketId].shortSplVault
              ),
              serumMarket: new PublicKey(optifiMarket.serumMarket),
              openOrdersAccount: new PublicKey(
                amm[amm_idx - 1][optifiMarket.optifiMarketId].openOrdersAccount
              ),
              openOrdersOwner: ammLiquidityAuth,
            },
          }
        );
        console.log("synchronize the Amm positiontx: ", syncAmmPositionsTx);
      } catch (e) {
        console.log(e);
      }
    });
  });

  // it("should update the Amm orders", async function () {
  //   let [AmmAccount, bump] = await getAmmAccount(
  //     new PublicKey(Config.OptiFi_Exchange_Id),
  //     amm_idx
  //   );

  //   try {
  //     const ammUpdateOrdersTx = await program.rpc.ammUpdateOrders(
  //       {
  //         accounts: {
  //           optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
  //           amm: AmmAccount,
  //           quoteTokenVault: new PublicKey(Config.Created_Amm.Usdc_Vault),
  //           ammUsdcVault,
  //           ammInstrumentLongTokenVault: new PublicKey(
  //             user.User_Instrument_Long_SPL_Token_Account
  //           ),
  //           ammInstrumentShortTokenVault: new PublicKey(
  //             user.User_Instrument_Short_SPL_Token_Account
  //           ),
  //           optifiMarket: new PublicKey(Config.Created_OptiFi_Market.optifiMarket),
  //           serumMarket: new PublicKey(Config.Created_Serum_Orderbook.market),
  //           openOrders,
  //           requestQueue: this.marketAccountInfo.decoded.requestQueue,
  //           eventQueue: this.marketAccountInfo.decoded.eventQueue,
  //           bids: this.marketAccountInfo.decoded.bids,
  //           asks: this.marketAccountInfo.decoded.asks,
  //           coinMint: this.marketAccountInfo.decoded.baseMint,
  //           coinVault: this.marketAccountInfo.decoded.baseVault,
  //           pcVault: this.marketAccountInfo.decoded.quoteVault,
  //           vaultSigner,
  //           orderPayerTokenAccount, // the (coin or price currency) account paying for the order
  //           instrumentTokenMintAuthorityPda,
  //           instrumentShortSplTokenMint: new PublicKey(
  //             Config.Created_OptiFi_Market.shortSplTokenMint
  //           ),
  //           PruneAuthority,
  //           serumDexProgramId,
  //           tokenProgram: TOKEN_PROGRAM_ID,
  //           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //         },
  //       }
  //     );
  //     console.log("calculate the Amm Proposal tx: ", ammUpdateOrdersTx);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });

  // it("should add instrument for Amm", async function () {
  //   let [AmmAccount, bump] = await getAmmAccount(
  //     new PublicKey(Config.OptiFi_Exchange_Id),
  //     amm_idx
  //   );

  //   try {
  //     const ammAddInstrumentlTx = await program.rpc.ammAddInstrument(
  //       {
  //         accounts: {
  //           optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
  //           amm: AmmAccount,
  //           optifiMarket: new PublicKey(Config.Created_OptiFi_Market.optifiMarket),
  //           instrument,
  //           ammLongTokenVault,
  //           ammShortTokenVault,
  //           clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
  //         },
  //       }
  //     );
  //     console.log("add instrument tx: ", ammAddInstrumentlTx);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });

  // it("should remove instrument for Amm", async function () {
  //   let [AmmAccount, bump] = await getAmmAccount(
  //     new PublicKey(Config.OptiFi_Exchange_Id),
  //     amm_idx
  //   );

  //   try {
  //     const ammRemoveInstrumentTx = await program.rpc.ammRemoveInstrument(
  //       {
  //         accounts: {
  //           optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
  //           amm: AmmAccount,
  //           optifiMarket: new PublicKey(Config.Created_OptiFi_Market.optifiMarket),
  //           instrument,
  //           clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,

  //         },
  //       }
  //     );
  //     console.log("remove instrument tx: ", ammRemoveInstrumentTx);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });
});
