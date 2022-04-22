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
import { get_optifi_market_mint_auth_pda, getOptifiMarket } from "./utils/pda";
import {
  appendCreatedOptifiMarketToFile,
  getCreatedSerumOrderbookFromFile,
} from "./utils/saveCreatedAssetsToFile";
import instrumets from "./assets/instruments.json"

const USDC_TOKEN_MINT = new PublicKey(Config.USDC_TOKEN_MINT);

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
  const serumDexProgramId = new PublicKey(Config.Serum_Dex_ProgramId); // serum dex program id on devnet

  describe("test1", function () {
    before(async function () {
      try {
        const optifiExchangeInfo = await program.account.exchange.fetch(
          Config.OptiFi_Exchange_Id
        );
        console.log(optifiExchangeInfo);
        let id = optifiExchangeInfo.markets.length + 1;

        console.log(id);

        let [optifiMarket, bump] = await getOptifiMarket(
          new PublicKey(Config.OptiFi_Exchange_Id),
          id
        );
        this.optifiMarket = optifiMarket;

        // let instrument = new PublicKey(Config.Created_Instrumnet_Pubkey); // the instrument created in previous instrument creation step
        let instrument =  new PublicKey(instrumets[id-1])
        this.instrument = instrument;

        const accountInfo = await program.account.chain.fetch(instrument);
        console.log("instrument account info: ", accountInfo);
        console.log(
          "instrument account info: ",
          accountInfo.expiryDate.toNumber()
        );

        const shortSplTokenMintWallet = anchor.web3.Keypair.generate();
        const shortSplTokenMintPk = shortSplTokenMintWallet.publicKey;
        console.log("shortSplTokenMintPk: ", shortSplTokenMintPk.toString());

        // use the optifi_market_mint_auth pda as the authority of instrument spl mint
        let [instrumentSplTokenMintAuthority, _bump] =
          await get_optifi_market_mint_auth_pda();
        console.log(
          "instrumentSplTokenMintAuthority: ",
          instrumentSplTokenMintAuthority.toString()
        );
        let serumMarketInfo = await getCreatedSerumOrderbookFromFile(id);
        let serumMarket = new PublicKey(serumMarketInfo.market);
        const longSplTokenMint = new PublicKey(serumMarketInfo.coinMint);
        const tx1 = await program.rpc.createOptifiMarket(bump, {
          accounts: {
            optifiMarket,
            exchange: new PublicKey(Config.OptiFi_Exchange_Id),
            serumMarket: serumMarket,
            instrument,
            longSplTokenMint,
            shortSplTokenMint: new PublicKey(shortSplTokenMintPk),
            payer: myWallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          },
          signers: [shortSplTokenMintWallet],
          instructions: [
            // these two instructions initializes the short spl token mint
            SystemProgram.createAccount({
              fromPubkey: myWallet.publicKey,
              newAccountPubkey: shortSplTokenMintPk,
              lamports: await connection.getMinimumBalanceForRentExemption(
                MintLayout.span
              ),
              space: MintLayout.span,
              programId: TOKEN_PROGRAM_ID,
            }),
            Token.createInitMintInstruction(
              TOKEN_PROGRAM_ID,
              shortSplTokenMintPk,
              0,
              instrumentSplTokenMintAuthority,
              instrumentSplTokenMintAuthority
            ),
          ],
        });
        console.log("createOptifiMarket tx: ", tx1);
        await appendCreatedOptifiMarketToFile(
          optifiMarket.toString(),
          id,
          serumMarket.toString(),
          instrument.toString(),
          false,
          longSplTokenMint.toString(),
          shortSplTokenMintPk.toString(),
          tx1
        );
      } catch (e) {
        console.log(e);
        // throw e;
      }
    });
    it("checks if the optifi market is created", async function () {
      const optifiMarket = await program.account.optifiMarket.fetch(
        this.optifiMarket
        // new PublicKey("3zJoZsL3dYsdGm1QNBw1Rnis2mmvRpqHLXXsoq26qBgE")
      );
      console.log("optifiMarket account info: ", optifiMarket);

      const accountInfo = await program.account.chain.fetch(
        optifiMarket.instrument
      );
      console.log("instrument account info: ", accountInfo);
    });
  });
});
