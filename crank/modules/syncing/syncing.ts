import Context from '@optifi/optifi-sdk/lib/types/context';
import CrankFactory from "../../utils/crankFactory";
import {AMMStateCrankContext, getAMMsInState} from "../../utils/amm";
import {AmmState, OptifiMarket} from "@optifi/optifi-sdk/lib/types/optifi-exchange-types";
import syncPositions from "@optifi/optifi-sdk/lib/instructions/syncPositions";
import {pickRandomItem} from "../../utils/generic";
import {findOptifiMarkets} from "@optifi/optifi-sdk/lib/utils/market";
import Position from "@optifi/optifi-sdk/lib/types/position";
import {PublicKey} from "@solana/web3.js";

function retrieveSyncContext(context: Context): Promise<AMMStateCrankContext> {
    return getAMMsInState(context, AmmState.Sync);
}

function shouldSyncCrank(context: Context, syncCtx: AMMStateCrankContext): Promise<boolean> {
    return new Promise((resolve) => resolve(syncCtx.length > 0));
}

function doSyncCrank(context: Context, syncCtx: AMMStateCrankContext): Promise<void> {
    return new Promise((resolve, reject) => {
        let ammToSync = pickRandomItem(syncCtx);
        findOptifiMarkets(context).then((markets) => {
            let instrumentPromises: Promise<void>[] = [];
            for (let position of (ammToSync[0].positions as Position[])) {
                let instrumentKey = position.instruments;
                let correspondingMarketKey = markets.find((m) =>
                    m[0].instrument.toString() === instrumentKey.toString()
                );
                if (correspondingMarketKey === undefined) {
                   reject(new Error(`Couldn't find market for instrument key ${instrumentKey.toString()}`))
                }
                let marketKey = correspondingMarketKey as [OptifiMarket, PublicKey];
                instrumentPromises.push(new Promise((syncResolve, syncReject) => {
                    console.log(`Submitting sync for instrument ${instrumentKey.toString()}, 
                        corresponding market ${marketKey[1].toString()}`);
                    syncPositions(context,
                        marketKey[1],
                        ammToSync[1]
                    ).then((syncRes) => {
                        if (syncRes.successful) {
                            syncResolve();
                        } else {
                            console.warn(syncRes);
                            syncResolve();
                        }
                    }).catch((err) => {
                        console.error(err);
                        syncReject(err);
                    })
                }))
            }
            Promise.all(instrumentPromises)
                .then(() => resolve())
                .catch((err) => {
                    console.error(err);
                    reject(err);
                })
        })
    })
}

export default function Syncing(context: Context): Promise<void> {
    return CrankFactory<AMMStateCrankContext>(
        context,
        15,
        retrieveSyncContext,
        shouldSyncCrank,
        doSyncCrank
    )
}