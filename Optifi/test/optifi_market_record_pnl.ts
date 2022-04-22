import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { Asset, Chain } from "./optifi-exchange-types";
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
import {
  getUserAccount,
  getDexOpenOrders,
  getVaultOwnerAndNonce2,
  getSerumMarketAuthority,
} from "./utils/pda";

const USDC_TOKEN_MINT = new PublicKey(Config.USDC_TOKEN_MINT);
const marketAddress = new PublicKey(Config.Created_Serum_Orderbook.market);

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

  // const getOptifiMarket = async (exchangePk: PublicKey, marketId: number) => {
  //   return await anchor.web3.PublicKey.findProgramAddress(
  //     [
  //       Buffer.from("optifi_market"),
  //       exchangePk.toBuffer(),
  //       // Uint8Array.of(id),
  //       new anchor.BN(marketId).toArrayLike(Buffer, "be", 8),
  //     ],
  //     programId
  //   );
  // };

  // // user account(pda) controls all spl token vaults of the user
  // const getUserAccount = async (
  //   optifi_exchange_id: PublicKey,
  //   wallet: PublicKey
  // ) => {
  //   return await anchor.web3.PublicKey.findProgramAddress(
  //     [
  //       Buffer.from("user_account"),
  //       optifi_exchange_id.toBuffer(),
  //       wallet.toBuffer(),
  //     ],
  //     programId
  //   );
  // };

  // // optifi_market_mint_auth pda is the account which can mint instrument spl tokens to user
  // const get_optifi_market_mint_auth_pda = async (
  //   optifi_exchange: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
  // ) => {
  //   return await anchor.web3.PublicKey.findProgramAddress(
  //     [Buffer.from("optifi_market_mint_auth"), optifi_exchange.toBuffer()],
  //     programId
  //   );
  // };

  // // optifi_market_auth pda is the account which can has the authority over the creating serum market
  // const getSerumMarketAuthority = async (
  //   optifi_exchange: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
  // ) => {
  //   return await anchor.web3.PublicKey.findProgramAddress(
  //     [Buffer.from("serum_market_auth"), optifi_exchange.toBuffer()],
  //     programId
  //   );
  // };
  // const getVaultOwnerAndNonce2 = async (
  //   marketPublicKey: PublicKey,
  //   dexProgramId = serumDexProgramId
  // ): Promise<[anchor.web3.PublicKey, anchor.BN]> => {
  //   const nonce = new anchor.BN(0);
  //   while (nonce.toNumber() < 255) {
  //     try {
  //       const vaultOwner = await PublicKey.createProgramAddress(
  //         [marketPublicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
  //         dexProgramId
  //       );
  //       return [vaultOwner, nonce];
  //     } catch (e) {
  //       nonce.iaddn(1);
  //     }
  //   }
  //   throw new Error("Unable to find nonce");
  // };

  // const getDexOpenOrders = async (
  //   optifi_exchange_id: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id),
  //   serumMarketId: PublicKey = new PublicKey(
  //     Config.Created_Serum_Orderbook.market
  //   ),
  //   user_account: PublicKey
  // ) => {
  //   return await anchor.web3.PublicKey.findProgramAddress(
  //     [
  //       Buffer.from("serum_open_orders"),
  //       optifi_exchange_id.toBuffer(),
  //       serumMarketId.toBuffer(),
  //       user_account.toBuffer(),
  //     ],
  //     programId
  //   );
  // };

  const getOracleFeed = (asset: Asset, is_spot: boolean): PublicKey => {
    switch (asset) {
      case Asset.Bitcoin:
        return new PublicKey(
          is_spot ? Config.oracles.oracleBtcSpot : Config.oracles.oracleBtcIv
        );
      case Asset.Ethereum:
        return new PublicKey(
          is_spot ? Config.oracles.oracleEthSpot : Config.oracles.oracleEthIv
        );
      case Asset.USDC:
        return new PublicKey(is_spot ? Config.oracles.oracleUsdcSpot : "");
    }
  };

  describe("test1", function () {
    // before(async function () {
    //   try {
    //     const optifiExchangeInfo = await program.account.exchange.fetch(
    //       Config.OptiFi_Exchange_Id
    //     );
    //     console.log(optifiExchangeInfo);
    //     let id = optifiExchangeInfo.markets.length + 1;

    //     console.log(id);

    //     let [optifiMarket, bump] = await getOptifiMarket(
    //       new PublicKey(Config.OptiFi_Exchange_Id),
    //       id
    //     );
    //     this.optifiMarket = optifiMarket;
    //     let instrument = new PublicKey(Config.Created_Instrumnet_Pubkey); // the instrument created in previous instrument creation step
    //     this.instrument = instrument;

    //     const accountInfo = await program.account.chain.fetch(instrument);
    //     console.log("instrument account info: ", accountInfo);
    //     console.log(
    //       "instrument account info: ",
    //       accountInfo.expiryDate.toNumber()
    //     );

    //     const shortSplTokenMintWallet = anchor.web3.Keypair.generate();
    //     const shortSplTokenMintPk = shortSplTokenMintWallet.publicKey;
    //     console.log("shortSplTokenMintPk: ", shortSplTokenMintPk.toString());

    //     // use the optifi_market_mint_auth pda as the authority of instrument spl mint
    //     let [instrumentSplTokenMintAuthority, _bump] =
    //       await get_optifi_market_mint_auth_pda();
    //     console.log(
    //       "instrumentSplTokenMintAuthority: ",
    //       instrumentSplTokenMintAuthority.toString()
    //     );

    //     const tx1 = await program.rpc.createOptifiMarket(bump, {
    //       accounts: {
    //         optifiMarket,
    //         exchange: new PublicKey(Config.OptiFi_Exchange_Id),
    //         serumMarket: new PublicKey(Config.Created_Serum_Orderbook.market),
    //         instrument,
    //         longSplTokenMint: new PublicKey(
    //           Config.Created_Serum_Orderbook.coinMintPk
    //         ),
    //         shortSplTokenMint: new PublicKey(shortSplTokenMintPk),
    //         payer: myWallet.publicKey,
    //         systemProgram: anchor.web3.SystemProgram.programId,
    //         clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
    //       },
    //       signers: [shortSplTokenMintWallet],
    //       instructions: [
    //         // these two instructions initializes the short spl token mint
    //         SystemProgram.createAccount({
    //           fromPubkey: myWallet.publicKey,
    //           newAccountPubkey: shortSplTokenMintPk,
    //           lamports: await connection.getMinimumBalanceForRentExemption(
    //             MintLayout.span
    //           ),
    //           space: MintLayout.span,
    //           programId: TOKEN_PROGRAM_ID,
    //         }),
    //         Token.createInitMintInstruction(
    //           TOKEN_PROGRAM_ID,
    //           shortSplTokenMintPk,
    //           0,
    //           instrumentSplTokenMintAuthority,
    //           instrumentSplTokenMintAuthority
    //         ),
    //       ],
    //     });
    //     console.log("createOptifiMarket tx: ", tx1);
    //   } catch (e) {
    //     console.log(e);
    //     // throw e;
    //   }
    // });
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
      this.instrument = accountInfo;
    });

    it("should query the serum market account info", async function () {
      let marketAccountInfo = await Market.load(
        connection,
        marketAddress,
        undefined,
        serumDexProgramId
      );
      console.log("marketAccountInfo: ", marketAccountInfo);
      this.serumMarketAccountInfo = marketAccountInfo;
    });

    // {
    //   name: "recordPnlForOneUser";
    //   accounts: [
    //     { name: "optifiExchange"; isMut: true; isSigner: false },
    //     { name: "userAccount"; isMut: false; isSigner: false },
    //     { name: "optifiMarket"; isMut: true; isSigner: false },
    //     { name: "serumMarket"; isMut: true; isSigner: false },
    //     { name: "userSerumOpenOrders"; isMut: true; isSigner: false },
    //     { name: "instrument"; isMut: false; isSigner: false },
    //     { name: "bids"; isMut: true; isSigner: false },
    //     { name: "asks"; isMut: true; isSigner: false },
    //     { name: "eventQueue"; isMut: true; isSigner: false },
    //     { name: "coinVault"; isMut: true; isSigner: false },
    //     { name: "pcVault"; isMut: true; isSigner: false },
    //     { name: "vaultSigner"; isMut: true; isSigner: false },
    //     { name: "userMarginAccount"; isMut: true; isSigner: false },
    //     { name: "instrumentLongSplTokenMint"; isMut: true; isSigner: false },
    //     { name: "instrumentShortSplTokenMint"; isMut: true; isSigner: false },
    //     { name: "userInstrumentLongTokenVault"; isMut: true; isSigner: false },
    //     { name: "userInstrumentShortTokenVault"; isMut: true; isSigner: false },
    //     { name: "pruneAuthority"; isMut: false; isSigner: false },
    //     { name: "serumDexProgramId"; isMut: false; isSigner: false },
    //     { name: "tokenProgram"; isMut: false; isSigner: false },
    //     { name: "clock"; isMut: false; isSigner: false },
    //     { name: "oracleFeed"; isMut: false; isSigner: false }
    //   ];

    it("should record PnL for a user on an optifi market", async function () {
      try {
        let user = Config.user_profiles.user1;
        let [userAccount, _bump] = await getUserAccount(
          new PublicKey(Config.OptiFi_Exchange_Id),
          new PublicKey(user.Wallet_PubKey)
        );
        let [dexOpenOrders, _bump2] = await getDexOpenOrders(
          new PublicKey(Config.OptiFi_Exchange_Id),
          new PublicKey(Config.Created_Serum_Orderbook.market),
          userAccount
        );
        let [serumMarketAuthority, _bump3] = await getSerumMarketAuthority();
        let [vaultOwner, _bump4] = await getVaultOwnerAndNonce2(marketAddress);
        const tx1 = await program.rpc.recordPnlForOneUser({
          accounts: {
            optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
            userAccount: userAccount,
            serumOpenOrders: dexOpenOrders,
            optifiMarket: new PublicKey(
              Config.Created_OptiFi_Market.optifiMarket
            ),
            serumMarket: new PublicKey(Config.Created_Serum_Orderbook.market),
            userSerumOpenOrders: new PublicKey(user.User_Open_Orders_Account),
            instrument: this.optifiMarketAccountInfo.instrument,
            requestQueue: this.serumMarketAccountInfo.decoded.requestQueue,
            eventQueue: this.serumMarketAccountInfo.decoded.eventQueue,
            bids: this.serumMarketAccountInfo.decoded.bids,
            asks: this.serumMarketAccountInfo.decoded.asks,
            coinVault: this.serumMarketAccountInfo.decoded.baseVault,
            pcVault: this.serumMarketAccountInfo.decoded.quoteVault,
            vaultSigner: vaultOwner,
            userMarginAccount: new PublicKey(user.User_Margin_Account_USDC),
            instrumentLongSplTokenMint:
              this.optifiMarketAccountInfo.instrumentLongSplToken,
            instrumentShortSplTokenMint:
              this.optifiMarketAccountInfo.instrumentShortSplToken,
            userInstrumentLongTokenVault: new PublicKey(
              user.User_Instrument_Long_SPL_Token_Account
            ),
            userInstrumentShortTokenVault: new PublicKey(
              user.User_Instrument_Short_SPL_Token_Account
            ),
            pruneAuthority: serumMarketAuthority,
            serumDexProgramId: serumDexProgramId,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY,
            assetSpotPriceOracleFeed: getOracleFeed(
              this.instrument.asset,
              true
            ),
            usdcSpotPriceOracleFeed: getOracleFeed(Asset.USDC, true),
          },
          // signers: [],
          instructions: [],
        });
        console.log("recordPnlForOneUser: ", tx1);
      } catch (e) {
        console.log(e);
        throw e;
      }
    });
  });
});
