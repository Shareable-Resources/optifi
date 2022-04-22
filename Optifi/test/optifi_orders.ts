import * as anchor from "@project-serum/anchor";
import Config from "./config.json";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  OpenOrders,
  OpenOrdersPda,
  Logger,
  ReferralFees,
  MarketProxyBuilder,
  Market,
  Orderbook,
} from "@project-serum/serum";
import { TOKEN_PROGRAM_ID, Token, AccountLayout } from "@solana/spl-token";
import { OrderSide } from "./optifi-exchange-types";

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

const marketAddress = new PublicKey(Config.Created_Serum_Orderbook.market);
const openOrdersAccount = new PublicKey(user.User_Open_Orders_Account);

// user's instrument spl token account
// need to initialize with the test "initialize instrument spl token account"  in optifi_market.ts
const userInstrumentLongTokenVault = new PublicKey(
  user.User_Instrument_Long_SPL_Token_Account
);
const userInstrumentShortTokenVault = new PublicKey(
  user.User_Instrument_Short_SPL_Token_Account
);
const userPcTokenAccount = new PublicKey(user.User_Margin_Account_USDC);

const userCoinVaultWallet = anchor.web3.Keypair.generate();
const userCoinVaultPk = userCoinVaultWallet.publicKey;

// const getCoinMintAuthority = async () => {
//   return await anchor.web3.PublicKey.findProgramAddress(
//     [Buffer.from("instrument_spl_mint_authority")],
//     programId
//   );
// };

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

// optifi_market_mint_auth pda is the account which can mint instrument spl tokens to user
const get_optifi_market_mint_auth_pda = async (
  optifi_exchange: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("optifi_market_mint_auth"), optifi_exchange.toBuffer()],
    programId
  );
};

const getDexOpenOrders = async (
  optifi_exchange_id: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id),
  serumMarketId: PublicKey = new PublicKey(Config.Created_Serum_Orderbook),
  user_account: PublicKey
) => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("serum_open_orders"),
      optifi_exchange_id.toBuffer(),
      serumMarketId.toBuffer(),
      user_account.toBuffer(),
    ],
    programId
  );
};

const getVaultOwnerAndNonce2 = async (
  marketPublicKey: PublicKey,
  dexProgramId = serumDexProgramId
): Promise<[anchor.web3.PublicKey, anchor.BN]> => {
  const nonce = new anchor.BN(0);
  while (nonce.toNumber() < 255) {
    try {
      const vaultOwner = await PublicKey.createProgramAddress(
        [marketPublicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
        dexProgramId
      );
      return [vaultOwner, nonce];
    } catch (e) {
      nonce.iaddn(1);
    }
  }
  throw new Error("Unable to find nonce");
};

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

describe("optifi", () => {
  beforeEach(async function () {
    // try {
    //   const optifiExchangeInfo = await program.account.exchange.fetch(
    //     Config.OptiFi_Exchange_Id
    //   );
    //   console.log(optifiExchangeInfo);
    //   let id = optifiExchangeInfo.markets.length + 1;
    //   console.log(id);
    //   let [optifiMarket, bump] = await getOptifiMarket(
    //     new PublicKey(Config.OptiFi_Exchange_Id),
    //     id
    //   );
    //   this.optifiMarket = optifiMarket;
    // } catch (e) {
    //   console.log(e);
    // }
  });
  it("should query the serum market account info", async function () {
    let marketAccountInfo = await Market.load(
      connection,
      marketAddress,
      undefined,
      serumDexProgramId
    );
    console.log("marketAccountInfo: ", marketAccountInfo);
    this.marketAccountInfo = marketAccountInfo;
  });

  it("should qeury open orders", async function () {
    // let openOrdersAccount = await OpenOrders.findForMarketAndOwner(
    //   connection,
    //   marketAddress,
    //   myWallet.publicKey,
    //   serumDexProgramId
    // );
    //  openOrdersAccount = await OpenOrders.findForOwner(
    //     connection,
    //     myWallet.publicKey,
    //     serumDexProgramId
    //   );
    // console.log("OpenOrders.findForMarketAndOwner: ", openOrdersAccount);

    let [userAccount, _bump] = await getUserAccount(
      new PublicKey(Config.OptiFi_Exchange_Id),
      myWallet.publicKey
    );

    let [dexOpenOrders, _bump2] = await getDexOpenOrders(
      new PublicKey(Config.OptiFi_Exchange_Id),
      new PublicKey(Config.Created_Serum_Orderbook.market),
      userAccount
    );
    let openOrdersAccount2 = await OpenOrders.load(
      connection,
      dexOpenOrders,
      serumDexProgramId
    );
    console.log("OpenOrders.load: ", openOrdersAccount2);
    console.log("order id: ", openOrdersAccount2.orders[0].toString());
    // the order id to cancel
    this.orderId = openOrdersAccount2.orders[2];
    // the order id to be updated
    this.orderId2 = openOrdersAccount2.orders[3];
  });

  it("should place an ask order to orderbook", async function () {
    try {
      let [userAccount, _bump] = await getUserAccount(
        new PublicKey(Config.OptiFi_Exchange_Id),
        myWallet.publicKey
      );
      let [mintAuthority, _bump2] = await get_optifi_market_mint_auth_pda(
        new PublicKey(Config.OptiFi_Exchange_Id)
      );
      let [vaultOwner, _bump3] = await getVaultOwnerAndNonce2(marketAddress);
      const placeOrderTx = await program.rpc.placeOrder(
        OrderSide.Ask, // sell
        new anchor.BN(7), // limit price
        new anchor.BN(5), // max amount of coins currency to sell = 8 * coinLotSize, coinLotSize is defined when serum market is created
        new anchor.BN(35), // max amount of price currency to recieve??  = 4 * pcLotSize, while pcLotSize is defined when serum market is created
        {
          accounts: {
            exchange: new PublicKey(Config.OptiFi_Exchange_Id),
            user: myWallet.publicKey,
            userAccount: userAccount,
            userMarginAccount: new PublicKey(user.User_Margin_Account_USDC),
            userInstrumentLongTokenVault,
            userInstrumentShortTokenVault,
            optifiMarket: new PublicKey(
              Config.Created_OptiFi_Market.optifiMarket
            ),
            serumMarket: marketAddress,
            openOrders: openOrdersAccount,
            openOrdersOwner: userAccount,
            requestQueue: this.marketAccountInfo.decoded.requestQueue,
            eventQueue: this.marketAccountInfo.decoded.eventQueue,
            bids: this.marketAccountInfo.decoded.bids,
            asks: this.marketAccountInfo.decoded.asks,
            coinMint: this.marketAccountInfo.decoded.baseMint,
            coinVault: this.marketAccountInfo.decoded.baseVault,
            pcVault: this.marketAccountInfo.decoded.quoteVault,
            vaultSigner: vaultOwner,
            orderPayerTokenAccount: userInstrumentLongTokenVault, // the (coin or price currency) account paying for the order
            instrumentTokenMintAuthorityPda: mintAuthority,
            instrumentShortSplTokenMint: new PublicKey(
              Config.Created_OptiFi_Market.shortSplTokenMint
            ),
            serumDexProgramId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );
      console.log("place ask order tx: ", placeOrderTx);
    } catch (e) {
      console.log(e);
    }
  });

  // // use another user wallet to test bid order if the order could match with previous ask order
  // // otherwise it will throw error 0x3d, it's WouldSelfTrade error
  it("should place a bid order to orderbook", async function () {
    try {
      let [userAccount, _bump] = await getUserAccount(
        new PublicKey(Config.OptiFi_Exchange_Id),
        myWallet.publicKey
      );
      let [mintAuthority, _bump2] = await get_optifi_market_mint_auth_pda(
        new PublicKey(Config.OptiFi_Exchange_Id)
      );
      let [vaultOwner, _bump3] = await getVaultOwnerAndNonce2(marketAddress);

      const placeOrderTx = await program.rpc.placeOrder(
        OrderSide.Bid, //
        new anchor.BN(5), // limit price
        new anchor.BN(5), // max amount of coins currency to receive = 8 * coinLotSize, while coinLotSize is defined when serum market is created
        new anchor.BN(25), // max amount of price currency to pay for the order??, 4 * pcLotSize, while pcLotSize is defined when serum market is created
        {
          accounts: {
            exchange: new PublicKey(Config.OptiFi_Exchange_Id),
            user: myWallet.publicKey,
            userAccount: userAccount,
            userMarginAccount: new PublicKey(user.User_Margin_Account_USDC),
            userInstrumentLongTokenVault,
            userInstrumentShortTokenVault,
            optifiMarket: new PublicKey(
              Config.Created_OptiFi_Market.optifiMarket
            ),
            serumMarket: marketAddress,
            openOrders: openOrdersAccount,
            openOrdersOwner: userAccount,
            requestQueue: this.marketAccountInfo.decoded.requestQueue,
            eventQueue: this.marketAccountInfo.decoded.eventQueue,
            bids: this.marketAccountInfo.decoded.bids,
            asks: this.marketAccountInfo.decoded.asks,
            coinMint: this.marketAccountInfo.decoded.baseMint,
            coinVault: this.marketAccountInfo.decoded.baseVault,
            pcVault: this.marketAccountInfo.decoded.quoteVault,
            vaultSigner: vaultOwner,
            orderPayerTokenAccount: userPcTokenAccount, // user's (coin or price currency) vault paying for the order
            instrumentTokenMintAuthorityPda: mintAuthority,
            instrumentShortSplTokenMint: new PublicKey(
              Config.Created_OptiFi_Market.shortSplTokenMint
            ),
            serumDexProgramId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );
      console.log("place bid order tx: ", placeOrderTx);
    } catch (e) {
      console.log(e);
    }
  });

  it("should cancel an order if the order exists", async function () {
    try {
      let [userAccount, _bump] = await getUserAccount(
        new PublicKey(Config.OptiFi_Exchange_Id),
        myWallet.publicKey
      );
      let [mintAuthority, _bump2] = await get_optifi_market_mint_auth_pda(
        new PublicKey(Config.OptiFi_Exchange_Id)
      );
      let [vaultOwner, _bump3] = await getVaultOwnerAndNonce2(marketAddress);

      const placeOrderTx = await program.rpc.cancelOrder(
        OrderSide.Ask, // sell
        this.orderId, // make sure order id exists. in previous step, this.orderId = openOrdersAccount2.orders[0]
        {
          accounts: {
            exchange: new PublicKey(Config.OptiFi_Exchange_Id),
            user: myWallet.publicKey,
            userAccount: userAccount,
            userMarginAccount: new PublicKey(user.User_Margin_Account_USDC),
            userInstrumentLongTokenVault,
            userInstrumentShortTokenVault,
            optifiMarket: new PublicKey(
              Config.Created_OptiFi_Market.optifiMarket
            ),
            serumMarket: marketAddress,
            openOrders: openOrdersAccount,
            openOrdersOwner: userAccount,
            requestQueue: this.marketAccountInfo.decoded.requestQueue,
            eventQueue: this.marketAccountInfo.decoded.eventQueue,
            bids: this.marketAccountInfo.decoded.bids,
            asks: this.marketAccountInfo.decoded.asks,
            coinMint: this.marketAccountInfo.decoded.baseMint,
            coinVault: this.marketAccountInfo.decoded.baseVault,
            pcVault: this.marketAccountInfo.decoded.quoteVault,
            vaultSigner: vaultOwner,
            orderPayerTokenAccount: userInstrumentLongTokenVault, // the (coin or price currency) account paying for the order
            instrumentTokenMintAuthorityPda: mintAuthority,
            instrumentShortSplTokenMint: new PublicKey(
              Config.Created_OptiFi_Market.shortSplTokenMint
            ),
            serumDexProgramId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );
      console.log("cancel ask order tx: ", placeOrderTx);
    } catch (e) {
      console.log(e);
    }
  });

  it("should update an order with new parameters", async function () {
    try {
      let [userAccount, _bump] = await getUserAccount(
        new PublicKey(Config.OptiFi_Exchange_Id),
        myWallet.publicKey
      );
      let [mintAuthority, _bump2] = await get_optifi_market_mint_auth_pda(
        new PublicKey(Config.OptiFi_Exchange_Id)
      );
      let [vaultOwner, _bump3] = await getVaultOwnerAndNonce2(marketAddress);

      const placeOrderTx = await program.rpc.updateOrder(
        OrderSide.Ask, // sell
        new anchor.BN(6), // limit price
        new anchor.BN(10), // max amount of coins currency to receive = 8 * coinLotSize, while coinLotSize is defined when serum market is created
        new anchor.BN(70), // max amount of price currency to pay for the order??, 4 * pcLotSize, while pcLotSize is defined when serum market is created
        this.orderId2, // make sure order id exists. in previous step, this.orderId = openOrdersAccount2.orders[0]
        {
          accounts: {
            exchange: new PublicKey(Config.OptiFi_Exchange_Id),
            user: myWallet.publicKey,
            userAccount: userAccount,
            userMarginAccount: new PublicKey(user.User_Margin_Account_USDC),
            userInstrumentLongTokenVault,
            userInstrumentShortTokenVault,
            optifiMarket: new PublicKey(
              Config.Created_OptiFi_Market.optifiMarket
            ),
            serumMarket: marketAddress,
            openOrders: openOrdersAccount,
            openOrdersOwner: userAccount,
            requestQueue: this.marketAccountInfo.decoded.requestQueue,
            eventQueue: this.marketAccountInfo.decoded.eventQueue,
            bids: this.marketAccountInfo.decoded.bids,
            asks: this.marketAccountInfo.decoded.asks,
            coinMint: this.marketAccountInfo.decoded.baseMint,
            coinVault: this.marketAccountInfo.decoded.baseVault,
            pcVault: this.marketAccountInfo.decoded.quoteVault,
            vaultSigner: vaultOwner,
            orderPayerTokenAccount: userInstrumentLongTokenVault, // the (coin or price currency) account paying for the order
            instrumentTokenMintAuthorityPda: mintAuthority,
            instrumentShortSplTokenMint: new PublicKey(
              Config.Created_OptiFi_Market.shortSplTokenMint
            ),
            serumDexProgramId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );
      console.log("update order tx: ", placeOrderTx);
    } catch (e) {
      console.log(e);
    }
  });

  it("should qeury open orders", async function () {
    let openOrdersAccount = await OpenOrders.findForMarketAndOwner(
      connection,
      marketAddress,
      myWallet.publicKey,
      serumDexProgramId
    );
    openOrdersAccount = await OpenOrders.findForOwner(
      connection,
      myWallet.publicKey,
      serumDexProgramId
    );
    console.log("openOrdersAccount: ", openOrdersAccount);
  });
});
