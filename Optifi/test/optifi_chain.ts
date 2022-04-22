import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import Config from "./config.json";
import { Asset, InstrumentType, ExpiryType } from "./optifi-exchange-types";
import {
  dateToAnchorTimestamp,
  optifiAssetToNumber,
  instrumentTypeToNumber,
  expiryTypeToNumber,
} from "./generic";

import { appendCreatedInstrumentToFile } from "./utils/saveCreatedAssetsToFile";

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

  // seeds=[PREFIX.as_bytes(),
  //   &[data.asset as u8],
  //   &[data.instrument_type as u8],
  //   &[data.expiry_type as u8],
  //   &data.expiry_date.to_be_bytes(),
  //   &[0u8],
  //   ]
  const getInstrumentPubkey = async (
    asset: Asset,
    instrumentType: InstrumentType,
    // strike: anchor.BN,
    expiryDate: anchor.BN,
    expiryType: ExpiryType,
    serialNo: number
  ) => {
    return await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("instrument"),
        Uint8Array.of(0), // 0: BTC, 1: ETH
        Uint8Array.of(1), // 0: Put, 1: Call, 2: Future
        // strike.toArrayLike(Buffer, "be", 8),
        Uint8Array.of(0), // 0: Standard, 1: Perpetual
        expiryDate.toArrayLike(Buffer, "be", 8),
        Uint8Array.of(serialNo),
        // Buffer.from(Number(0).toString()),
        // new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        // Buffer.from([0x00]),
        // Buffer.from("0"),
        // Buffer.from(instrumentType.toString()),
        // Buffer.from(strike.toString()),
        // Buffer.from(expiryType.toString()),
        // Uint8Array.of(strike.toNumber())
        // Buffer.from(expiryDate.toString()),
        // Buffer.from("BTC"),
        // Buffer.from("63000"),
      ],
      programId
    );
  };
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

  const getSeedString = (idx: number, expiryDate: Date): string => {
    let seedStr: string =
      optifiAssetToNumber(Asset.Bitcoin).toString() +
      instrumentTypeToNumber(InstrumentType.Call).toString() +
      expiryTypeToNumber(ExpiryType.Standard).toString() +
      dateToAnchorTimestamp(expiryDate).toNumber().toString() +
      idx.toString();
    return seedStr;
  };

  const getInstrumentPubkeyV2 = async (
    seedStr: string,
    optifi_exchange: PublicKey = new PublicKey(Config.OptiFi_Exchange_Id)
  ) => {
    return await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("instrument"),
        optifi_exchange.toBuffer(),
        Buffer.from(seedStr),
      ],
      programId
    );
  };

  describe("test1", function () {
    // before(async function () {
    //   const asset = Asset.Bitcoin;
    //   const instrumentType = InstrumentType.Call;
    //   // const strike = new anchor.BN(65700);
    //   let expiryDate_date = new Date(2022, 2, 1, 0, 0, 0); // YYYY, MM, DD, HH, MM, SS
    //   const expiryDate = new anchor.BN(expiryDate_date.getTime() / 1000); // 26 December 2021 08:51:51
    //   const expiryType = ExpiryType.Standard;
    //   const duration = new anchor.BN(123);
    //   const start = new anchor.BN(456);
    //   const authority = myWallet.publicKey;
    //   const assetSpotPriceOracleFeed = getOracleFeed(asset, true);
    //   const assetIvOracleFeed = getOracleFeed(asset, false);
    //   const usdcSpotPriceOracleFeed = getOracleFeed(Asset.USDC, true);

    //   console.log(
    //     "assetSpotPriceOracleFeed: ",
    //     assetSpotPriceOracleFeed.toString(),
    //     "usdcSpotPriceOracleFeed: ",
    //     usdcSpotPriceOracleFeed.toString(),
    //     "assetIvOracleFeed: ",
    //     assetIvOracleFeed.toString()
    //   );

    //   // // get the instrument pda address with given set of specifiers
    //   // let [instrument0, bump0] = await getInstrumentPubkey(
    //   //   asset,
    //   //   instrumentType,
    //   //   // strike,
    //   //   expiryDate,
    //   //   expiryType,
    //   //   0
    //   // );
    //   // this.instrumentPubKey = instrument0;
    //   // let [instrument1, bump1] = await getInstrumentPubkey(
    //   //   asset,
    //   //   instrumentType,
    //   //   // strike,
    //   //   expiryDate,
    //   //   expiryType,
    //   //   1
    //   // );
    //   // let [instrument2, bump2] = await getInstrumentPubkey(
    //   //   asset,
    //   //   instrumentType,
    //   //   // strike,
    //   //   expiryDate,
    //   //   expiryType,
    //   //   2
    //   // );
    //   // let [instrument3, bump3] = await getInstrumentPubkey(
    //   //   asset,
    //   //   instrumentType,
    //   //   // strike,
    //   //   expiryDate,
    //   //   expiryType,
    //   //   3
    //   // );
    //   // let [instrument4, bump4] = await getInstrumentPubkey(
    //   //   asset,
    //   //   instrumentType,
    //   //   // strike,
    //   //   expiryDate,
    //   //   expiryType,
    //   //   4
    //   // );
    //   // let [instrument5, bump5] = await getInstrumentPubkey(
    //   //   asset,
    //   //   instrumentType,
    //   //   // strike,
    //   //   expiryDate,
    //   //   expiryType,
    //   //   5
    //   // );
    //   // let [instrument6, bump6] = await getInstrumentPubkey(
    //   //   asset,
    //   //   instrumentType,
    //   //   // strike,
    //   //   expiryDate,
    //   //   expiryType,
    //   //   6
    //   // );
    //   // let [instrument7, bump7] = await getInstrumentPubkey(
    //   //   asset,
    //   //   instrumentType,
    //   //   // strike,
    //   //   expiryDate,
    //   //   expiryType,
    //   //   7
    //   // );
    //   // let [instrument8, bump8] = await getInstrumentPubkey(
    //   //   asset,
    //   //   instrumentType,
    //   //   // strike,
    //   //   expiryDate,
    //   //   expiryType,
    //   //   8
    //   // );
    //   // console.log(
    //   //   "instrument pda account and bump:",
    //   //   instrument0.toString(),
    //   //   bump0
    //   // );
    //   // console.log(
    //   //   instrument0.toString(),
    //   //   instrument1.toString(),
    //   //   instrument2.toString()
    //   // );

    //   let instrument0Seed = getSeedString(0, expiryDate_date);
    //   let instrument1Seed = getSeedString(1, expiryDate_date);
    //   let instrument2Seed = getSeedString(2, expiryDate_date);
    //   let instrument3Seed = getSeedString(3, expiryDate_date);
    //   let instrument4Seed = getSeedString(4, expiryDate_date);
    //   let instrument5Seed = getSeedString(5, expiryDate_date);
    //   let instrument6Seed = getSeedString(6, expiryDate_date);
    //   let instrument7Seed = getSeedString(7, expiryDate_date);
    //   let instrument8Seed = getSeedString(8, expiryDate_date);

    //   // get the instrument pda address with given set of specifiers
    //   let [instrument0, bump0] = await getInstrumentPubkeyV2(instrument0Seed);
    //   this.instrumentPubKey = instrument0;
    //   let [instrument1, bump1] = await getInstrumentPubkeyV2(instrument1Seed);
    //   let [instrument2, bump2] = await getInstrumentPubkeyV2(instrument2Seed);
    //   let [instrument3, bump3] = await getInstrumentPubkeyV2(instrument3Seed);
    //   let [instrument4, bump4] = await getInstrumentPubkeyV2(instrument4Seed);
    //   let [instrument5, bump5] = await getInstrumentPubkeyV2(instrument5Seed);
    //   let [instrument6, bump6] = await getInstrumentPubkeyV2(instrument6Seed);
    //   let [instrument7, bump7] = await getInstrumentPubkeyV2(instrument7Seed);
    //   let [instrument8, bump8] = await getInstrumentPubkeyV2(instrument8Seed);

    //   try {
    //     // Note that with the same set of specifiers,
    //     // there can be only one instrument account created
    //     const tx = await program.rpc.createNewInstrument(
    //       {
    //         instrument0: bump0,
    //         instrument1: bump1,
    //         instrument2: bump2,
    //         instrument3: bump3,
    //         instrument4: bump4,
    //         instrument5: bump5,
    //         instrument6: bump6,
    //         instrument7: bump7,
    //         instrument8: bump8,
    //       },
    //       {
    //         asset: asset,
    //         instrumentType: instrumentType,
    //         // strike: strike,
    //         expiryDate: expiryDate,
    //         expiryType: expiryType,
    //         duration: duration,
    //         start: start,
    //         authority: authority,
    //         contractSizePercent: new anchor.BN(10), // it means the contract size is 0.1 underlying asset
    //         instrument0Seed,
    //         instrument1Seed,
    //         instrument2Seed,
    //         instrument3Seed,
    //         instrument4Seed,
    //         instrument5Seed,
    //         instrument6Seed,
    //         instrument7Seed,
    //         instrument8Seed,
    //       },
    //       // { name: "asset"; type: "u8" },
    //       // { name: "instrumentType"; type: "u8" },
    //       // { name: "expiryDate"; type: "u64" },
    //       // { name: "duration"; type: "u64" },
    //       // { name: "start"; type: "u64" },
    //       // { name: "expiryType"; type: "u8" },
    //       // { name: "authority"; type: "publicKey" },
    //       // { name: "contractSizePercent"; type: "u64" },
    //       // { name: "instrument0Seed"; type: "string" },
    //       // { name: "instrument1Seed"; type: "string" },
    //       // { name: "instrument2Seed"; type: "string" },
    //       // { name: "instrument3Seed"; type: "string" },
    //       // { name: "instrument4Seed"; type: "string" },
    //       // { name: "instrument5Seed"; type: "string" },
    //       // { name: "instrument6Seed"; type: "string" },
    //       // { name: "instrument7Seed"; type: "string" },
    //       // { name: "instrument8Seed"; type: "string" }

    //       {
    //         accounts: {
    //           optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
    //           instrument0,
    //           instrument1,
    //           instrument2,
    //           instrument3,
    //           instrument4,
    //           instrument5,
    //           instrument6,
    //           instrument7,
    //           instrument8,
    //           payer: myWallet.publicKey,
    //           systemProgram: SystemProgram.programId,
    //           rent: SYSVAR_RENT_PUBKEY,
    //           assetSpotPriceOracleFeed,
    //           assetIvOracleFeed,
    //           // usdcSpotPriceOracleFeed,
    //         },
    //         signers: [myWallet],
    //       }
    //     );
    //     console.log("tx: ", tx);

    //     await appendCreatedInstrumentToFile(
    //       instrument0.toString(),
    //       instrument1.toString(),
    //       instrument2.toString(),
    //       instrument3.toString(),
    //       instrument4.toString(),
    //       instrument5.toString(),
    //       instrument6.toString(),
    //       instrument7.toString(),
    //       instrument8.toString()
    //     );
    //   } catch (e) {
    //     console.log(e);
    //     // throw e;
    //   }
    // });

    it("Is initialized!", async function () {
      const accountInfo = await program.account.chain.fetch(
        // this.instrumentPubKey
        "AqZ8zt3kqnEfBWMwhBPnbKNq8vezzrTBdkx7hCTJtaaL"
      );
      const accountInfo2 = await program.account.chain.fetch(
        "95RE8yx177oQcvwGjt4rPvzpu1twRhz5SR6zUVUhy1uH"
      );
      console.log("instrument account info: ", accountInfo);
      console.log("instrument account info 2: ", accountInfo2);

      console.log("1 strike: ", accountInfo.strike.toNumber());
      console.log("2 strike: ", accountInfo2.strike.toNumber());
      console.log("1 expiryDate: ", accountInfo.expiryDate.toNumber());
      console.log("1 contractSizePercent: ", accountInfo.contractSizePercent.toNumber());

    });
  });
});
