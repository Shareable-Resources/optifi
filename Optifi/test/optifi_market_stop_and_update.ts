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

  const getOptifiMarket = async (exchangePk: PublicKey, marketId: number) => {
    return await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("optifi_market"),
        exchangePk.toBuffer(),
        // Uint8Array.of(id),
        new anchor.BN(marketId).toArrayLike(Buffer, "be", 8),
      ],
      programId
    );
  };

  describe("test1", function () {
    beforeEach(async function () {
      try {
        // let's stop optifi market No.4
        let id = 4;
        let [optifiMarket, _bump] = await getOptifiMarket(
          new PublicKey(Config.OptiFi_Exchange_Id),
          id
        );
        this.optifiMarket = optifiMarket;
        const optifiMarketAccountInfo =
          await program.account.optifiMarket.fetch(optifiMarket);
        this.instrument = optifiMarketAccountInfo.instrument;
        this.serumMarket = optifiMarketAccountInfo.serumMarket;

        console.log(this.instrument.toString())

        const instrumentAccountInfo = await program.account.chain.fetch(this.instrument);
        console.log("instrument account info: ", instrumentAccountInfo);

        console.log(instrumentAccountInfo.expiryDate.toNumber(),  Math.floor(Date.now() / 1000))
        assert.ok(
          instrumentAccountInfo.expiryDate.toNumber() <= Math.floor(Date.now() / 1000),
          "the market is not exipred yet!"
        );
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
    it("should stop the optifi market", async function () {
      try {
        const tx1 = await program.rpc.settleFundForExpiredMarket({
          accounts: {
            optifiMarket: this.optifiMarket,
            serumMarket: this.serumMarket,
            instrument: this.instrument,
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          },
        });
        console.log("settleFundForExpiredMarket tx: ", tx1);

        const optifiMarket = await program.account.optifiMarket.fetch(
          this.optifiMarket
        );
        assert.equal(optifiMarket.isStopped, true);
      } catch (e) {
        console.log(e);
      }
    });

    it("should update the stopped optifi market with a new instrument", async function () {
      let newInstrument = new PublicKey(
        "8ctEicnZtz7jfzcC2Vj1SvkJfY1B9BwXg4mqxUiUQcEk"
      );
      try {
        const tx1 = await program.rpc.updateOptifiMarket({
          accounts: {
            optifiMarket: this.optifiMarket,
            serumMarket: this.serumMarket,
            instrument: newInstrument,
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          },
        });
        console.log("updateOptifiMarket tx: ", tx1);

        const optifiMarket = await program.account.optifiMarket.fetch(
          this.optifiMarket
        );
        assert.equal(optifiMarket.isStopped, false);
        assert.equal(
          optifiMarket.instrument.toString(),
          newInstrument.toString()
        );
      } catch (e) {
        console.log(e);
      }
    });

    it("queries the optifi market account info", async function () {
      const optifiMarket = await program.account.optifiMarket.fetch(
        this.optifiMarket
      );
      console.log("optifiMarket account info: ", optifiMarket);

      const accountInfo = await program.account.chain.fetch(this.instrument);
      console.log("instrument account info: ", accountInfo);
    });
  });
});
