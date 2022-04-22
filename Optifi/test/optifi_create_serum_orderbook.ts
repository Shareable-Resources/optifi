import * as anchor from "@project-serum/anchor";

import assert from "assert";

import {
  AccountLayout,
  Token,
  MintLayout,
  // TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import Config from "./config.json";
import {
  DexInstructions,
  TokenInstructions,
  OpenOrdersPda,
  MARKET_STATE_LAYOUT_V3,
  Market,
} from "@project-serum/serum";
import { rpc } from "@project-serum/anchor/dist/cjs/utils";
import { appendCreatedSerumOrderbookToFile } from "./utils/saveCreatedAssetsToFile";
import {
  getVaultOwnerAndNonce2,
  getSerumMarketAuthority,
  get_optifi_market_mint_auth_pda,
} from "./utils/pda";

const TOKEN_PROGRAM_ID = new PublicKey(Config.TOKEN_PROGRAM_ID);
const serumDexProgramId = new PublicKey(Config.Serum_Dex_ProgramId); // serum dex program id on devnet

describe("optifi", function () {
  // Configure the client to use the local cluster.
  const idl = JSON.parse(
    require("fs").readFileSync("./target/idl/optifi_exchange.json", "utf8")
  );

  const myWallet = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(require("fs").readFileSync(process.env.MY_WALLET, "utf8"))
    )
  );

  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com/",
    "recent"
  );

  // Address of the deployed OptiFi program.
  const programId = new PublicKey(Config.OptiFi_ProgramId);

  const walletWrapper = new anchor.Wallet(myWallet);
  const provider = new anchor.Provider(connection, walletWrapper, {
    preflightCommitment: "recent",
  });
  const program = new anchor.Program(idl, programId, provider);

  let coinMintWallet = anchor.web3.Keypair.generate(); // create a new spl token which stands for an instrument
  let coinMintPk = coinMintWallet.publicKey;
  console.log("coinMintPk: ", coinMintPk.toString());
  // let coinMintPk = new PublicKey(
  //   "9tENJ6NENWfqffq1j81vpWT5w79q7EfUVwZHv1jMhByZ"
  // ); // test spl token 1

  let pcMintPk = new PublicKey(Config.USDC_TOKEN_MINT); // test usdc token (quote token)
  console.log("pcMintPk: ", pcMintPk.toString());

  let coinVaultWallet = anchor.web3.Keypair.generate();
  let coinVaultPk = coinVaultWallet.publicKey;
  console.log("coinVaultPk: ", coinVaultPk.toString());

  let pcVaultWallet = anchor.web3.Keypair.generate();
  let pcVaultPk = pcVaultWallet.publicKey;
  console.log("pcVaultPk: ", pcVaultPk.toString());

  let marketWallet = anchor.web3.Keypair.generate();
  let market = marketWallet.publicKey;
  console.log("marketWallet.publicKey: ", marketWallet.publicKey.toString());

  let bidsWallet = anchor.web3.Keypair.generate();
  let bidsPk = bidsWallet.publicKey;
  console.log("bidsWallet.publicKey: ", bidsWallet.publicKey.toString());

  let asksWallet = anchor.web3.Keypair.generate();
  let asksPk = asksWallet.publicKey;
  console.log("asksWallet.publicKey: ", asksWallet.publicKey.toString());

  let reqQWallet = anchor.web3.Keypair.generate();
  let reqQPk = reqQWallet.publicKey;
  console.log("reqQWallet.publicKey: ", reqQWallet.publicKey.toString());

  let eventQWallet = anchor.web3.Keypair.generate();
  let eventQPk = eventQWallet.publicKey;
  console.log("eventQWallet.publicKey: ", eventQWallet.publicKey.toString());

  describe("test1", function () {
    beforeEach(async function () {
      // === sometimes getVaultOwnerAndNonce() will fail, so don't use it ==============
      // let [vaultOwner, b1] = await getVaultOwnerAndNonce(marketWallet.publicKey)

      let [vaultOwner, b2] = await getVaultOwnerAndNonce2(
        marketWallet.publicKey
      );

      // use the optifi_market_mint_auth pda as the authority of coin mint
      let [coinMintAuthority, _bump] = await get_optifi_market_mint_auth_pda();
      console.log("coinMintAuthority: ", coinMintAuthority.toString());
      // console.log(a1.toString(), b1)
      console.log(vaultOwner.toString(), b2);
      // console.log(MARKET_STATE_LAYOUT_V3);

      //=================================================
      /// try to create part of the neccessary accounts first due to limitation on data size for one tx
      try {
        const tx1 = new Transaction();
        tx1.add(
          SystemProgram.createAccount({
            fromPubkey: myWallet.publicKey,
            newAccountPubkey: market,
            space: MARKET_STATE_LAYOUT_V3.span,
            lamports:
              await provider.connection.getMinimumBalanceForRentExemption(
                MARKET_STATE_LAYOUT_V3.span
              ),
            programId: serumDexProgramId,
          }),

          SystemProgram.createAccount({
            fromPubkey: myWallet.publicKey,
            newAccountPubkey: coinVaultPk,
            lamports: await connection.getMinimumBalanceForRentExemption(165),
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
          }),
          SystemProgram.createAccount({
            fromPubkey: myWallet.publicKey,
            newAccountPubkey: pcVaultPk,
            lamports: await connection.getMinimumBalanceForRentExemption(165),
            space: AccountLayout.span,
            programId: TOKEN_PROGRAM_ID,
          }),

          SystemProgram.createAccount({
            fromPubkey: myWallet.publicKey,
            newAccountPubkey: coinMintPk,
            lamports: await connection.getMinimumBalanceForRentExemption(
              MintLayout.span
            ),
            space: MintLayout.span,
            programId: TOKEN_PROGRAM_ID,
          }),
          Token.createInitMintInstruction(
            TOKEN_PROGRAM_ID,
            coinMintPk,
            0,
            coinMintAuthority, // it should be replaced by optifi exchange pda
            coinMintAuthority // it should be replaced by optifi exchange pda
          ),

          Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            coinMintPk,
            coinVaultPk,
            new PublicKey(vaultOwner.toString())
          ),
          Token.createInitAccountInstruction(
            TOKEN_PROGRAM_ID,
            pcMintPk,
            pcVaultPk,
            new PublicKey(vaultOwner.toString())
          )
        );
        let tx1_res = await provider.send(tx1, [
          coinMintWallet,
          coinVaultWallet,
          pcVaultWallet,
          marketWallet,
        ]);
        console.log("tx1 - prepare required accounts: ", tx1_res);
      } catch (e) {
        console.log(e);
      }

      try {
        let authorityPk = myWallet.publicKey;
        let pruneAuthorityPk = myWallet.publicKey;
        let coinLotSize = new anchor.BN(1); // let's set 1 as one instrument spl token represents 1 contract
        let pcLotSize = new anchor.BN(1);
        let vaultSignerNonce = new anchor.BN(b2);
        let pcDustThreshold = new anchor.BN(2);

        let [serumMarketAuthority, _bump] = await getSerumMarketAuthority();
        console.log(
          "serumMarketAuthority, bump: ",
          serumMarketAuthority,
          _bump
        );
        const tx2 = await program.rpc.initializeSerumOrderbook(
          authorityPk,
          pruneAuthorityPk,
          coinLotSize,
          pcLotSize,
          vaultSignerNonce,
          pcDustThreshold,
          {
            accounts: {
              optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
              market,
              coinMintPk,
              pcMintPk,
              coinVaultPk,
              pcVaultPk,
              bidsPk,
              asksPk,
              reqQPk,
              eventQPk,
              serumMarketAuthority: serumMarketAuthority,
              systemProgram: anchor.web3.SystemProgram.programId,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
              serumDexProgram: serumDexProgramId,
            },
            signers: [
              myWallet,
              reqQWallet,
              eventQWallet,
              asksWallet,
              bidsWallet,
            ],
            instructions: [
              /// try to create remaining required accounts
              SystemProgram.createAccount({
                fromPubkey: myWallet.publicKey,
                newAccountPubkey: reqQPk,
                space: 5132,
                lamports:
                  await provider.connection.getMinimumBalanceForRentExemption(
                    5132
                  ),
                programId: serumDexProgramId,
              }),
              SystemProgram.createAccount({
                fromPubkey: myWallet.publicKey,
                newAccountPubkey: eventQPk,
                space: 262156,
                lamports:
                  await provider.connection.getMinimumBalanceForRentExemption(
                    262156
                  ),
                programId: serumDexProgramId,
              }),

              SystemProgram.createAccount({
                fromPubkey: myWallet.publicKey,
                newAccountPubkey: bidsPk,
                space: 65548,
                lamports:
                  await provider.connection.getMinimumBalanceForRentExemption(
                    65548
                  ),
                programId: serumDexProgramId,
              }),
              SystemProgram.createAccount({
                fromPubkey: myWallet.publicKey,
                newAccountPubkey: asksPk,
                space: 65548,
                lamports:
                  await provider.connection.getMinimumBalanceForRentExemption(
                    65548
                  ),
                programId: serumDexProgramId,
              }),
            ],
          }
        );
        console.log("tx2 - initialize serum market: ", tx2);
        await appendCreatedSerumOrderbookToFile(
          market.toString(),
          coinMintPk.toString(),
          pcMintPk.toString(),
          coinVaultPk.toString(),
          pcVaultPk.toString(),
          bidsPk.toString(),
          asksPk.toString(),
          reqQPk.toString(),
          eventQPk.toString(),
          vaultOwner.toString(),
          b2.toNumber(),
          coinMintAuthority.toString(),
          serumMarketAuthority.toString(),
          _bump,
          tx2
        );
      } catch (e) {
        console.log(e);
        throw e;
      }
    });

    it("Is initialized!", async function () {
      let marketAccountInfo = await Market.load(
        connection,
        // new PublicKey("6v31C5vyjvX1ECVWKTiwwPWVj7c6BGSPv7gvNcwb5axP"),
        market,
        undefined,
        serumDexProgramId
      );
      console.log(marketAccountInfo);
      console.log(
        "serum market baseMint: ",
        marketAccountInfo.decoded.baseMint.toString()
      );
    });
  });
});
