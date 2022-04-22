import fs from "fs";
// import {WalletProvider} from "../types/solanaTypes";
import * as anchor from "@project-serum/anchor";
// import Asset from "../types/asset";
// import {
//     Asset as Asset,
//     ExpiryType as ExpiryType,
//     InstrumentType as InstrumentType
// } from '../types/optifi-exchange-types';
// import InstrumentType from "../types/instrumentType";
// import ExpiryType from "../types/expiryType";

import { Asset, InstrumentType, ExpiryType } from "./optifi-exchange-types";

/**
 * Small helper function to read a JSON file as a type from a filepath
 *
 * @param filePath The path to read the data from
 */
export function readJsonFile<T>(filePath: string): T {
    let strData = fs.readFileSync(filePath);
    return JSON.parse(
        fs.readFileSync(
            filePath,
            "utf-8"
        )
    )
}

// export function isWalletProvider(object: unknown): object is WalletProvider {
//     return Object.prototype.hasOwnProperty.call(object, "name")
//         && Object.prototype.hasOwnProperty.call(object, "url");
// }

export function generateUuid(): string {
    return anchor.web3.Keypair.generate()
        .publicKey.toBase58()
        .slice(0, 6);
}

export function dateToAnchorTimestamp(date?: Date): anchor.BN {
    return date ?
        new anchor.BN(date.getTime() / 1000)
        : new anchor.BN(1)
}

export function dateToAnchorTimestampBuffer(date?: Date): Buffer {
    return dateToAnchorTimestamp(date).toArrayLike(Buffer, "be", 8)
}

export function assetToAsset(asset: Asset): Asset {
    switch (asset) {
        case Asset.Bitcoin:
            return Asset.Bitcoin;
        case Asset.Ethereum:
            return Asset.Ethereum;
    }
}

export function optifiAssetToNumber(asset: Asset): number {
    switch (asset) {
        case Asset.Bitcoin:
            return 0;
        case Asset.Ethereum:
            return 1;
        case Asset.USDC:
            return 2;
        default:
            return -1;
    }
}


export function expiryTypeToNumber(expiryType: ExpiryType): number {
    switch (expiryType) {
        case ExpiryType.Standard:
            return 0;
        case ExpiryType.Perpetual:
            return 1;
        default:
            return -1;
    }
}

export function instrumentTypeToNumber(instrumentType: InstrumentType): number {
    switch (instrumentType) {
        case InstrumentType.Put:
            return 0;
        case InstrumentType.Call:
            return 1;
        case InstrumentType.Future:
            return 2;
        default:
            return -1;
    }
}

export function instrumentTypeToInstrumentType(instrumentType: InstrumentType): InstrumentType {
    switch (instrumentType) {
        case InstrumentType.Call:
            return InstrumentType.Call;
        case InstrumentType.Put:
            return InstrumentType.Put;
        case InstrumentType.Future:
            return InstrumentType.Future;
    }
}

export function expiryTypeToExpiryType(expiryType: ExpiryType): ExpiryType {
    switch (expiryType) {
        case ExpiryType.Perpetual:
            return ExpiryType.Perpetual;
        case ExpiryType.Standard:
            return ExpiryType.Standard;
    }
}

export function numberToAsset(asset: number): Asset {
    switch (asset) {
        case 0:
            return Asset.Bitcoin;
        case 1:
            return Asset.Ethereum;
        case 2:
            return Asset.USDC;
        default:
            throw new Error(`Unrecognized asset number ${asset}`)
    }
}