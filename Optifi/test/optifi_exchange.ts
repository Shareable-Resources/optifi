import * as anchor from "@project-serum/anchor";
import Config from "./config.json";
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
import { getOptiFiExchange, getCentralUsdcPoolAuth } from "./utils/pda";

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
  const programId = new anchor.web3.PublicKey(Config.OptiFi_ProgramId);

  const walletWrapper = new anchor.Wallet(myWallet);
  const provider = new anchor.Provider(connection, walletWrapper, {
    preflightCommitment: "recent",
  });
  const program = new anchor.Program(idl, programId, provider);

  describe("test1", function () {
    // prepare accounts
    before(async function () {
      try {
        // generate a new optifi exchange account
        let uuid = Keypair.generate().publicKey.toBase58().slice(0, 6);
        let [optifiExchange, bump] = await getOptiFiExchange(uuid);
        this.optifiExchange = optifiExchange;
        this.bump = bump;
        this.uuid = uuid;
        console.log(
          `optifiExchange pubkey: ${optifiExchange.toString()}, uuid: ${uuid}, bump: ${bump}`
        );

        // genreate a usdc central pool account
        const usdcCentralPoolWallet = Keypair.generate();
        const usdcCentralPoolPk = usdcCentralPoolWallet.publicKey;
        const [centralUsdcPoolAuth, _bump] = await getCentralUsdcPoolAuth(
          optifiExchange
        );

        const tx1 = new Transaction();
        tx1.add(
          SystemProgram.createAccount({
            fromPubkey: myWallet.publicKey,
            newAccountPubkey: usdcCentralPoolPk,
            lamports: await connection.getMinimumBalanceForRentExemption(
              AccountLayout.span
            ),
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
          }),

          Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            new PublicKey(Config.USDC_TOKEN_MINT), // usdc mint address
            usdcCentralPoolPk,
            centralUsdcPoolAuth // give the central pool authority to pda
          )
        );
        let tx1_res = await provider.send(tx1, [usdcCentralPoolWallet]);
        console.log("initialize usdc central pool tx: ", tx1_res);
        this.usdcCentralPoolPk = usdcCentralPoolPk;
        console.log("usdc central pool pubkey: ", usdcCentralPoolPk.toString());
        console.log(
          "usdc central pool auth pda: ",
          centralUsdcPoolAuth.toString()
        );
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it("should initialize the OptiFi Exchange", async function () {
      try {
        const tx = await program.rpc.initialize(
          this.bump,
          {
            uuid: this.uuid,
            version: 1,
            exchangeAuthority: myWallet.publicKey,
            owner: myWallet.publicKey,
            usdcMint: new PublicKey(Config.USDC_TOKEN_MINT),
            btcSpotOracle: new PublicKey(Config.oracles.oracleBtcSpot),
            ethSpotOracle: new PublicKey(Config.oracles.oracleEthSpot),
            usdcSpotOracle: new PublicKey(Config.oracles.oracleUsdcSpot),
            btcIvOracle: new PublicKey(Config.oracles.oracleBtcIv),
            ethIvOracle: new PublicKey(Config.oracles.oracleEthIv),
          },
          {
            accounts: {
              optifiExchange: this.optifiExchange,
              authority: myWallet.publicKey,
              usdcCentralPool: this.usdcCentralPoolPk,
              payer: myWallet.publicKey,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
            signers: [myWallet],
          }
        );
        console.log("tx: ", tx);
      } catch (e) {
        console.log(e);
        // throw e;
      }
    });

    it("should check if the OptiFi exchange is initialized", async function () {
      const accountInfo = await program.account.exchange.fetch(
        this.optifiExchange
      );
      console.log("instrument account info: ", accountInfo);
    });
  });
});
