import assert from "assert";
import * as anchor from "@project-serum/anchor";
import {
  AccountLayout,
  MintLayout,
  TOKEN_PROGRAM_ID,
  Token,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import Config from "./config.json";
import {
  getDexOpenOrders,
  getUserAccount,
  getSerumMarketAuthority,
} from "./utils/pda";

describe("optifi", function () {
  // Configure the client to use the local cluster.
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
  const serumDexProgramId = new PublicKey(Config.Serum_Dex_ProgramId); // serum dex program id on devnet

  describe("test1", function () {
    before(async function () {
      try {
      } catch (e) {
        console.log(e);
        // throw e;
      }
    });
    it("checks if the optifi market is created", async function () {
      const optifiMarket = await program.account.optifiMarket.fetch(
        Config.Created_OptiFi_Market.optifiMarket
      );
      console.log("optifiMarket account info: ", optifiMarket);

      const accountInfo = await program.account.chain.fetch(
        optifiMarket.instrument
      );
      console.log("instrument account info: ", accountInfo);
    });

    it("should initialize open orders for a user to place order on the optifi market", async function () {
      try {
        let [userAccount, _bump] = await getUserAccount(
          new PublicKey(Config.OptiFi_Exchange_Id),
          myWallet.publicKey
        );
        let [dexOpenOrders, bump2] = await getDexOpenOrders(
          new PublicKey(Config.OptiFi_Exchange_Id),
          new PublicKey(Config.Created_Serum_Orderbook.market),
          userAccount
        );
        console.log("user dexOpenOrders: ", dexOpenOrders);
        let [serumMarketAuthority, _bump3] = await getSerumMarketAuthority();
        const tx1 = await program.rpc.initUserOnOptifiMarket(bump2, {
          accounts: {
            optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
            user: myWallet.publicKey,
            userAccount: userAccount,
            serumOpenOrders: dexOpenOrders,
            optifiMarket:
              // this.optifiMarket ,
              new PublicKey(Config.Created_OptiFi_Market.optifiMarket),
            serumMarketAuthority,
            serumMarket: new PublicKey(Config.Created_Serum_Orderbook.market),
            serumDexProgramId: serumDexProgramId,
            payer: myWallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
          // signers: [],
          instructions: [],
        });
        console.log("initUserOnOptifiMarket tx: ", tx1);
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it("should initialize instrument long and short spl token vaults for the user", async function () {
      const userLongSplVaultWallet = anchor.web3.Keypair.generate();
      const userLongSplVaultPk = userLongSplVaultWallet.publicKey;

      const userShortSplVaultWallet = anchor.web3.Keypair.generate();
      const userShortSplVaultPk = userShortSplVaultWallet.publicKey;
      console.log("userLongSplVaultPk: ", userLongSplVaultPk);
      console.log("userShortSplVaultPk: ", userShortSplVaultPk);

      try {
        let [userAccount, _bump] = await getUserAccount(
          new PublicKey(Config.OptiFi_Exchange_Id),
          myWallet.publicKey
        );
        const tx1 = new Transaction();
        tx1.add(
          // long spl token vault
          SystemProgram.createAccount({
            fromPubkey: myWallet.publicKey,
            newAccountPubkey: userLongSplVaultPk,
            lamports: await connection.getMinimumBalanceForRentExemption(
              AccountLayout.span
            ),
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
          }),

          Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            new PublicKey(Config.Created_Serum_Orderbook.coinMintPk), // coin currency mint address
            userLongSplVaultPk,
            userAccount // give the instrument spl token account authority to pda, the pda also has mint authority
          ),

          // short spl token vault
          SystemProgram.createAccount({
            fromPubkey: myWallet.publicKey,
            newAccountPubkey: userShortSplVaultPk,
            lamports: await connection.getMinimumBalanceForRentExemption(
              AccountLayout.span
            ),
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
          }),

          Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            new PublicKey(Config.Created_OptiFi_Market.shortSplTokenMint), // coin currency mint address
            userShortSplVaultPk,
            userAccount // give the instrument spl token account authority to pda, the pda also has mint authority
          )
        );
        let tx1_res = await provider.send(tx1, [
          userLongSplVaultWallet,
          userShortSplVaultWallet,
        ]);
        console.log(
          "initialize instrument long and short spl token accounts: ",
          tx1_res
        );
      } catch (e) {
        console.log(e);
      }
    });
  });
});
