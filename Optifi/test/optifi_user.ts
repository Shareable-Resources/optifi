import * as anchor from "@project-serum/anchor";
import { AccountLayout, Token } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import assert from "assert";

import Config from "./config.json";

const TOKEN_PROGRAM_ID = new PublicKey(Config.TOKEN_PROGRAM_ID);
const USDC_TOKEN_MINT = new PublicKey(Config.USDC_TOKEN_MINT);

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

  // /// PDA is the account which controls all user's usdc vaults
  // const getPDA = async (
  //   optifi_exchange: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
  // ) => {
  //   return await anchor.web3.PublicKey.findProgramAddress(
  //     [Buffer.from("user_token_account_pda"), optifi_exchange.toBuffer()],
  //     programId
  //   );
  // };

  describe("test1", function () {
    beforeEach(async function () {
      try {
      } catch (e) {}
    });

    it("should initialize user account for the user wallet", async function () {
      try {
        let optifiExchange = new PublicKey(Config.OptiFi_Exchange_Id);
        let [userAccount, bump2] = await getUserAccount(
            optifiExchange,
            myWallet.publicKey
        );
        let user_margin_account_usdc = anchor.web3.Keypair.generate();
        this.userAccount = userAccount;
        // this.userVaultOwnedByPda = user_margin_account_usdc.publicKey;

        const tx1 = await program.rpc.initUserAccount(bump2, {
          accounts: {
            optifiExchange: optifiExchange,
            userAccount: userAccount,
            userMarginAccountUsdc: user_margin_account_usdc.publicKey,
            owner: myWallet.publicKey,
            payer: myWallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
          signers: [myWallet, user_margin_account_usdc],
          instructions: [
            anchor.web3.SystemProgram.createAccount({
              fromPubkey: myWallet.publicKey,
              newAccountPubkey: user_margin_account_usdc.publicKey, //margin account - usdc vault
              space: AccountLayout.span,
              lamports:
                  await provider.connection.getMinimumBalanceForRentExemption(
                      AccountLayout.span
                  ),
              programId: TOKEN_PROGRAM_ID,
            }),
            Token.createInitAccountInstruction(
                TOKEN_PROGRAM_ID,
                USDC_TOKEN_MINT,
                user_margin_account_usdc.publicKey,
                myWallet.publicKey
            ), // to receive usdc token
          ],
        });
        console.log("initUserAccount tx: ", tx1);
      } catch (e) {
        console.log(e);
        // throw e;
      }
    });
    it("checks if user account is initialized", async function () {
      const userAccount = await program.account.userAccount.fetch(
          this.userAccount
      );
      assert.equal(userAccount.owner.toString(), myWallet.publicKey.toString());
      console.log("user account info: ", userAccount);
      console.log("user account pubkey: ", this.userAccount.toString());
      console.log("user account owner: ", userAccount.owner.toString());
      console.log(
          "user account userMarginAccountUsdc: ",
          userAccount.userMarginAccountUsdc.toString()
      );
    });

    it("should deposit 101 USDC tokens into user's vault owned by pda", async function () {
      const userAccount = await program.account.userAccount.fetch(
          this.userAccount
      );
      const user_usdc_token_account = new PublicKey(
          user.User_USDC_Token_Account
      );
      const tx = await program.rpc.deposit(new anchor.BN(10100), {
        accounts: {
          userAccount: this.userAccount,
          depositTokenMint: USDC_TOKEN_MINT, // USDC token mint address
          depositSource: user_usdc_token_account, // from
          userMarginAccountUsdc: userAccount.userMarginAccountUsdc.toString(), // to
          user: myWallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [myWallet],
        instructions: [],
      });
      console.log("deposit tx: ", tx);
    });

    it("should withdraw 1 USDC tokens from user's vault owned by pda", async function () {
      const userAccount = await program.account.userAccount.fetch(
          this.userAccount
      );
      const user_usdc_token_account = new PublicKey(
          user.User_USDC_Token_Account
      );

      let optifiExchange = new PublicKey(Config.OptiFi_Exchange_Id);

      const tx = await program.rpc.withdraw(new anchor.BN(100), {
        accounts: {
          optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
          userAccount: this.userAccount,
          depositTokenMint: USDC_TOKEN_MINT, // USDC token mint address
          userMarginAccountUsdc: userAccount.userMarginAccountUsdc.toString(), // from
          withdrawDest: user_usdc_token_account, // to
          user: myWallet.publicKey,
          // pda: pda,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [myWallet],
        instructions: [],
      });
      console.log("withdraw tx: ", tx);
    });
  });
});
