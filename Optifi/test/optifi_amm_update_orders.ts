import * as anchor from "@project-serum/anchor";
import Config from "./config.json";
import { PublicKey, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAmmAccount, getAmmLiquidityAuth } from "./utils/pda";
import optifiMarkets from "./assets/optifi_markets.json";
import amm from "./assets/amm.json";
import serumOrderbooks from "./assets/serum_orderbooks.json";
import {
  getVaultOwnerAndNonce2,
  get_optifi_market_mint_auth_pda,
  getSerumMarketAuthority
} from "./utils/pda";
import {AMM_INDEX} from "./constants"

// Address of the deployed OptiFi program.
const programId = new anchor.web3.PublicKey(Config.OptiFi_ProgramId);
const serumDexProgramId = new PublicKey(Config.Serum_Dex_ProgramId); // serum dex program id on devnet

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
  it("should update the Amm orders", async function () {
    let [AmmAccount, bump] = await getAmmAccount(
      new PublicKey(Config.OptiFi_Exchange_Id),
      amm_idx
    );
    let [ammLiquidityAuth, bump2] = await getAmmLiquidityAuth();
    let [serumMarketAuthority, _bump3] = await getSerumMarketAuthority();

    optifiMarkets.forEach(async (optifiMarket, i) => {
      let serumOrderbook = serumOrderbooks[optifiMarket.optifiMarketId];
      let [vaultOwner, _bump4] = await getVaultOwnerAndNonce2(
        new PublicKey(optifiMarket.serumMarket)
      );
      let [mintAuthority, _bump5] = await get_optifi_market_mint_auth_pda(
        new PublicKey(Config.OptiFi_Exchange_Id)
      );

      // { name: "orderLimit"; type: "u16" },
      // { name: "instrumentIndex"; type: "u16" },
      // { name: "ammAuthorityBump"; type: "u8" }

      try {
        const ammUpdateOrdersTx = await program.rpc.ammUpdateOrders(
          5, // orderLimit
          i, // instrumentIndex
          bump2, // ammAuthorityBump
          {
            accounts: {
              optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
              amm: AmmAccount,
              ammUsdcVault: new PublicKey(Config.Created_Amm.Usdc_Vault),
              ammAuthority: ammLiquidityAuth,
              ammInstrumentLongTokenVault: new PublicKey(
                amm[amm_idx - 1][optifiMarket.optifiMarketId].longSplVault
              ),
              ammInstrumentShortTokenVault: new PublicKey(
                amm[amm_idx - 1][optifiMarket.optifiMarketId].shortSplVault
              ),
              optifiMarket: new PublicKey(optifiMarket.optifiMarket),
              serumMarket: new PublicKey(optifiMarket.serumMarket),
              openOrders:
                amm[amm_idx - 1][optifiMarket.optifiMarketId].openOrdersAccount,
              requestQueue: serumOrderbook.reqQ,
              eventQueue: serumOrderbook.eventQ,
              bids: serumOrderbook.bids,
              asks: serumOrderbook.asks,
              coinMint: serumOrderbook.coinMint,
              coinVault: serumOrderbook.coinVault,
              pcVault: serumOrderbook.pcVault,
              vaultSigner: vaultOwner,
              // orderPayerBaseTokenAccount: , // the (coin or price currency) account paying for the order
              // orderPayerPcTokenAccount: 
              instrumentTokenMintAuthorityPda: mintAuthority,
              instrumentShortSplTokenMint: new PublicKey(
                optifiMarket.shortSplTokenMint
              ),
              pruneAuthority:serumMarketAuthority,
              serumDexProgramId,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
        );
        console.log("update the Amm orders tx: ", ammUpdateOrdersTx);
      } catch (e) {
        console.log(e);
      }
    });
  });
});
