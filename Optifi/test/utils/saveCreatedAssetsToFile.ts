import * as path from "path";
import fs from "fs";
import { PublicKey } from "@solana/web3.js";

export async function appendCreatedInstrumentToFile(
  ...newInstruments: string[]
) {
  let filename = path.resolve(__dirname, "../assets/instruments.json");
  let instruments = JSON.parse(fs.readFileSync(filename, "utf-8"));
  instruments = instruments.concat(newInstruments);
  fs.writeFileSync(filename, JSON.stringify(instruments));
}

export async function getCreatedSerumOrderbookFromFile(id: number) {
  let filename = path.resolve(__dirname, "../assets/serum_orderbooks.json");
  let serumOrderbookds = JSON.parse(fs.readFileSync(filename, "utf-8"));
  return serumOrderbookds[id];
}

export async function appendCreatedSerumOrderbookToFile(
  market: string,
  coinMint: string,
  pcMint: string,
  coinVault: string,
  pcVault: string,
  bids: string,
  asks: string,
  reqQ: string,
  eventQ: string,
  vaultOwner: string,
  vaultOwnerBump: number,
  coinMintAuthority: string,
  serumMarketAuthority: string,
  serumMarketAuthorityBump: number,
  txid: string
) {
  let record = {
    market,
    coinMint,
    pcMint,
    coinVault,
    pcVault,
    bids,
    asks,
    reqQ,
    eventQ,
    vaultOwner,
    vaultOwnerBump,
    coinMintAuthority,
    serumMarketAuthority,
    serumMarketAuthorityBump,
    txid,
  };
  let filename = path.resolve(__dirname, "../assets/serum_orderbooks.json");
  let serumOrderbookds = JSON.parse(fs.readFileSync(filename, "utf-8"));
  serumOrderbookds.push(record);
  fs.writeFileSync(filename, JSON.stringify(serumOrderbookds));
}

export async function appendCreatedOptifiMarketToFile(
  optifiMarket: string,
  optifiMarketId: number,
  serumMarket: string,
  instrument: string,
  isStopped: boolean,
  longSplTokenMint: string,
  shortSplTokenMint: string,
  txid: string
) {
  let record = {
    optifiMarket,
    optifiMarketId,
    serumMarket,
    instrument,
    isStopped,
    longSplTokenMint,
    shortSplTokenMint,
    txid,
  };
  let filename = path.resolve(__dirname, "../assets/optifi_markets.json");
  let optifiMarkets = JSON.parse(fs.readFileSync(filename, "utf-8"));
  optifiMarkets.push(record);
  fs.writeFileSync(filename, JSON.stringify(optifiMarkets));
}
