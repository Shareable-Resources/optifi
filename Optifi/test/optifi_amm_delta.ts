import * as anchor from "@project-serum/anchor";
import Config from "./config.json";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Asset } from "./optifi-exchange-types";
import { getAmmAccount } from "./utils/pda";
import { getOracleFeed } from "./utils/utils";
import {AMM_INDEX} from "./constants"

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
  it("should calculate the Amm delta", async function () {
    try {
      let [AmmAccount, bump] = await getAmmAccount(
        new PublicKey(Config.OptiFi_Exchange_Id),
        amm_idx
      );
      const calculateAmmDeltaTx = await program.rpc.ammCalculateDelta({
        accounts: {
          optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
          amm: AmmAccount,
          quoteTokenVault: new PublicKey(Config.Created_Amm.Usdc_Vault),
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          assetFeed: getOracleFeed(Asset.Bitcoin, true),
          usdcFeed: getOracleFeed(Asset.USDC, true),
          ivFeed: getOracleFeed(Asset.Bitcoin, false),
        },
      });
      console.log("calculate the Amm delta tx: ", calculateAmmDeltaTx);
    } catch (e) {
      console.log(e);
    }
  });
});
