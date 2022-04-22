import assert from "assert";
import * as anchor from "@project-serum/anchor";
import {
  AccountLayout,
  MintLayout,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import Config from "./config.json";
import {
  OpenOrders,
  OpenOrdersPda,
  Logger,
  ReferralFees,
  MarketProxyBuilder,
  Market,
  Orderbook,
} from "@project-serum/serum";

const USDC_TOKEN_MINT = new PublicKey(Config.USDC_TOKEN_MINT);
const marketAddress = new PublicKey(Config.Created_Serum_Orderbook.market);
const user = Config.user_profiles.user1;

describe("optifi", function () {
  // Configure the client to use the local cluster.
  const idl = JSON.parse(
    require("fs").readFileSync("./target/idl/optifi_exchange.json", "utf8")
  );

  const myWallet = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(
        require("fs").readFileSync(
          process.env.MY_WALLET || Config.WALLET_PATH,
          "utf8"
        )
      )
    )
  );

  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com/",
    "recent"
  );

  // Address of the deployed OptiFi program.
  const programId = new anchor.web3.PublicKey(
    Config.OptiFi_ProgramId // optifi on devnet
  );

  const walletWrapper = new anchor.Wallet(myWallet);
  const provider = new anchor.Provider(connection, walletWrapper, {
    preflightCommitment: "recent",
  });
  const program = new anchor.Program(idl, programId, provider);

  const getCentralUsdcPoolAuth = async (
    optifi_exchange_id: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
  ) => {
    return await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("central_usdc_pool_auth"), optifi_exchange_id.toBuffer()],
      programId
    );
  };

  // user account(pda) controls all spl token vaults of the user
  const getUserAccount = async (
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

  describe("test1", function () {
    before(async function () {
      try {
        const centralUsdcPoolAuth = await getCentralUsdcPoolAuth();
        console.log("centralUsdcPoolAuth: ", centralUsdcPoolAuth.toString());
      } catch (e) {
        console.log(e);
        // throw e;
      }
    });
    it("checks the optifi market account info", async function () {
      const optifiMarket = await program.account.optifiMarket.fetch(
        Config.Created_OptiFi_Market.optifiMarket
      );
      console.log("optifiMarket account info: ", optifiMarket);

      const accountInfo = await program.account.chain.fetch(
        optifiMarket.instrument
      );
      console.log("instrument account info: ", accountInfo);
      console.log("instrument strike price: ", accountInfo.strike.toNumber());
      console.log(
        "instrument expiry date: ",
        new Date(accountInfo.expiryDate * 1000)
      );
      this.optifiMarketAccountInfo = optifiMarket;
    });

    it("should query the user account info", async function () {
      let [userAccount, _bump] = await getUserAccount(
        new PublicKey(Config.OptiFi_Exchange_Id),
        new PublicKey(user.Wallet_PubKey)
      );
      let userAccountInfo = await program.account.userAccount.fetch(
        userAccount
      );
      console.log("userAccount account info: ", userAccountInfo);
      this.userAccount = userAccount;
    });

    it("should settle fund for a user on all optifi markets with same expiry date", async function () {
      try {
        // {
        //   name: "settleFundForOneUser";
        //   accounts: [
        //     { name: "optifiExchange"; isMut: false; isSigner: false },
        //     { name: "userAccount"; isMut: true; isSigner: false },
        //     { name: "userMarginAccountUsdc"; isMut: true; isSigner: false },
        //     { name: "centralUsdcPool"; isMut: true; isSigner: false },
        //     { name: "centralUsdcPoolAuth"; isMut: false; isSigner: false },
        //     { name: "usdcMint"; isMut: false; isSigner: false },
        //     { name: "tokenProgram"; isMut: false; isSigner: false }
        //   ];
        //   args: [];
        // }

        const [centralUsdcPoolAuth, _bump2] = await getCentralUsdcPoolAuth();
        const tx1 = await program.rpc.settleFundForOneUser({
          accounts: {
            optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
            userAccount: this.userAccount,
            userMarginAccountUsdc: new PublicKey(user.User_Margin_Account_USDC),
            centralUsdcPool: new PublicKey(Config.USDC_CENTRAL_POOL),
            centralUsdcPoolAuth: centralUsdcPoolAuth,
            usdcMint: new PublicKey(Config.USDC_TOKEN_MINT),
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          // signers: [],
          instructions: [],
        });
        console.log("settleFundForOneUser: ", tx1);
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });
});
