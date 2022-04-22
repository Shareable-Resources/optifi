import * as anchor from "@project-serum/anchor";
import Config from "./config.json";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  Token,
  AccountLayout,
  MintLayout,
} from "@solana/spl-token";
import { Asset } from "./optifi-exchange-types";
import { getAmmAccount, getAmmLiquidityAuth } from "./utils/pda";
import {AMM_INDEX} from "./constants";

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
  it("should initialize the usdc vault for the amm", async function () {
    let amm_usdc_token_vault = Keypair.generate();
    let [ammLiquidityAuth, _bump] = await getAmmLiquidityAuth();

    const tx1 = new Transaction();
    tx1.add(
      SystemProgram.createAccount({
        fromPubkey: myWallet.publicKey,
        newAccountPubkey: amm_usdc_token_vault.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(
          AccountLayout.span
        ),
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      }),

      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        new PublicKey(Config.USDC_TOKEN_MINT), // usdc mint address
        amm_usdc_token_vault.publicKey,
        ammLiquidityAuth
      )
    );
    let tx1_res = await provider.send(tx1, [amm_usdc_token_vault]);
    console.log("initialize amm usdc vault tx: ", tx1_res);
    this.amm_usdc_token_vault = amm_usdc_token_vault.publicKey;
  });

  it("should initialize an lp token mint", async function () {
    let lp_token_mint_wallet = Keypair.generate();
    let lp_token_mint = lp_token_mint_wallet.publicKey;

    // let [ammAccount, bump] = await getAmmAccount(
    //   new PublicKey(Config.OptiFi_Exchange_Id),
    //   amm_idx
    // );
    let [ammLiquidityAuth, _bump] = await getAmmLiquidityAuth();
    const tx1 = new Transaction();
    tx1.add(
      SystemProgram.createAccount({
        fromPubkey: myWallet.publicKey,
        newAccountPubkey: lp_token_mint,
        lamports: await connection.getMinimumBalanceForRentExemption(
          MintLayout.span
        ),
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      }),
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        lp_token_mint,
        0,
        ammLiquidityAuth,
        ammLiquidityAuth
      )
    );
    let tx1_res = await provider.send(tx1, [lp_token_mint_wallet]);
    console.log("initialize lp token mint tx: ", tx1_res);
    this.lp_token_mint = lp_token_mint;
  });

  it("should initialize the Amm", async function () {
    let [AmmAccount, bump] = await getAmmAccount(
      new PublicKey(Config.OptiFi_Exchange_Id),
      amm_idx
    );

    try {
      const TRADE_CAPACITY = 25;
      const NUM_INSTRUMENTS = 54;

      const asset = Asset.Bitcoin;
      const initializeAmmTx = await program.rpc.initializeAmm(
        bump,
        {
          ammIdx: amm_idx,
          ammCapacity: new anchor.BN(TRADE_CAPACITY),
          bump: bump,
          asset: asset,
          numInstruments: NUM_INSTRUMENTS, // currently not used
        },
        {
          accounts: {
            optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
            amm: AmmAccount,
            usdcTokenVault: this.amm_usdc_token_vault,
            lpTokenMint: this.lp_token_mint,
            payer: myWallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );
      console.log("initialize the Amm tx: ", initializeAmmTx);

      console.log("AmmAccount: ", AmmAccount.toString());
      console.log("Usdc_Vault: ", this.amm_usdc_token_vault.toString());
      console.log("LP_Token_Mint: ", this.lp_token_mint.toString());
    } catch (e) {
      console.log(e);
    }
  });

  it("checks if the amm with given index is initialized", async function () {
    let [ammAccount, bump] = await getAmmAccount(
      new PublicKey(Config.OptiFi_Exchange_Id),
      amm_idx
    );
    console.log("ammAccount: ", ammAccount.toString());
    const ammAccountInfo = await program.account.amm.fetch(ammAccount);

    console.log("amm account info: ", ammAccountInfo);
    this.ammAccountInfo = ammAccountInfo;
  });

  it("should deposit funds into the Amm", async function () {
    let [AmmAccount, bump] = await getAmmAccount(
      new PublicKey(Config.OptiFi_Exchange_Id),
      amm_idx
    );
    let [ammLiquidityAuth, bump2] = await getAmmLiquidityAuth(
      new PublicKey(Config.OptiFi_Exchange_Id)
    );
    let user_lp_token_vault_wallet = Keypair.generate();
    let user_lp_token_vault = user_lp_token_vault_wallet.publicKey;
    this.user_lp_token_vault_wallet = user_lp_token_vault_wallet;
    try {
      let amount = 10000;

      const depositAmmTx = await program.rpc.ammDeposit(
        new anchor.BN(amount), // amout deposit
        {
          accounts: {
            optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
            amm: AmmAccount,
            userAccount: new PublicKey(user.User_Account),
            ammQuoteTokenMint: new PublicKey(Config.USDC_TOKEN_MINT),
            ammQuoteTokenVault: new PublicKey(Config.Created_Amm.Usdc_Vault),
            userQuoteTokenVault: new PublicKey(user.User_USDC_Token_Account),
            lpTokenMint: new PublicKey(Config.Created_Amm.LP_Token_Mint),
            ammLiquidityAuth: ammLiquidityAuth,
            userLpTokenVault: user_lp_token_vault,
            user: myWallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          signers: [user_lp_token_vault_wallet],
          instructions: [
            SystemProgram.createAccount({
              fromPubkey: myWallet.publicKey,
              newAccountPubkey: user_lp_token_vault,
              lamports: await connection.getMinimumBalanceForRentExemption(
                AccountLayout.span
              ),
              space: AccountLayout.span,
              programId: TOKEN_PROGRAM_ID,
            }),

            Token.createInitAccountInstruction(
              TOKEN_PROGRAM_ID,
              new PublicKey(Config.Created_Amm.LP_Token_Mint),
              user_lp_token_vault,
              myWallet.publicKey
            ),
          ],
        }
      );
      console.log("deposit funds into the Amm tx: ", depositAmmTx);
    } catch (e) {
      console.log(e);
    }
  });

  it("should withdraw from the Amm", async function () {
    let [AmmAccount, bump] = await getAmmAccount(
      new PublicKey(Config.OptiFi_Exchange_Id),
      amm_idx
    );
    let [ammLiquidityAuth, bump2] = await getAmmLiquidityAuth(
      new PublicKey(Config.OptiFi_Exchange_Id)
    );

    try {
      let amount = 100;

      const withdrawFromAmmTx = await program.rpc.ammWithdraw(
        new anchor.BN(amount), // amout withdrawFrom
        {
          accounts: {
            optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
            amm: AmmAccount,
            userAccount: new PublicKey(user.User_Account),
            ammQuoteTokenMint: new PublicKey(Config.USDC_TOKEN_MINT),
            ammQuoteTokenVault: new PublicKey(Config.Created_Amm.Usdc_Vault),
            userQuoteTokenVault: new PublicKey(user.User_USDC_Token_Account),
            lpTokenMint: new PublicKey(Config.Created_Amm.LP_Token_Mint),
            ammLiquidityAuth: ammLiquidityAuth,
            userLpTokenVault: this.user_lp_token_vault_wallet.publicKey,
            user: myWallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        }
      );
      console.log("withdraw from the Amm tx: ", withdrawFromAmmTx);
    } catch (e) {
      console.log(e);
    }
  });
});
