import Context from '@optifi/optifi-sdk/lib/types/context';
import { OptifiMarket, UserAccount } from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';
import { PublicKey } from '@solana/web3.js';
import CrankFactory from "../../utils/crankFactory";
import { findValidMarkets } from "@optifi/optifi-sdk/lib/utils/market";
import { getMarketTokenHolders } from "../../utils/token";
import { initializeContext } from '@optifi/optifi-sdk';

export interface ValidMarketAndUsers {
    market: [OptifiMarket, PublicKey],
    tokenHolders: PublicKey[]
}

export interface ValidMarketsContext {
    ValidMarkets: ValidMarketAndUsers[]
}


function retrieveValidMarketsContext(context: Context): Promise<ValidMarketsContext> {
    return new Promise((resolve, reject) => {
        findValidMarkets(context).then((markets) => {
            let ValidMarketContext: ValidMarketAndUsers[];
            Promise.all(
                markets.map((market) => {
                    return new Promise((resolve, reject) => {
                        getMarketTokenHolders(context, market[0]).then((res) => {
                            ValidMarketContext.push({
                                market: market,
                                tokenHolders: res
                            })
                            resolve(true);
                        }).catch((err) => reject(err))
                    })
                })
            ).then(() => {
                resolve({
                    ValidMarkets: ValidMarketContext
                })
            }).catch((err) => reject(err))
        })
    })
}

initializeContext().then((context) => {
    retrieveValidMarketsContext(context).then((res) => {
        console.log(res);
    }).catch((err) => {
        console.error(err);
    })
})

// type LiquidationCrankContext = [UserAccount, PublicKey][];


// function retrieveUserAccountContext(context: Context): Promise<LiquidationCrankContext> {
//     console.log("Retrieving user account context")
//     return getAMMsInState(context, Liquidation.CalculateDelta);
// }

// function shouldCalculateDeltaCrank(context: Context, deltaCtx: LiquidationCrankContext): Promise<boolean> {
//     return new Promise((resolve) => resolve(deltaCtx.length > 0));
// }

// function doDeltaCalculationCrank(context: Context, deltaCtx: LiquidationCrankContext): Promise<void> {
//     return new Promise((resolve, reject) => {
//         let ammToSync = pickRandomItem(deltaCtx);
//         calculateAmmDelta(context, ammToSync[1]).then((calculateDeltaRes) => {
//             if (calculateDeltaRes.successful) {
//                 console.log("Calculated delta ", calculateDeltaRes);
//                 resolve()
//             } else {
//                 console.warn(calculateDeltaRes)
//                 resolve()
//             }
//         }).catch((err) => {
//             console.error(err);
//             reject(err);
//         })
//     });
// }

// export default function Liquidations(context: Context): Promise<void> {
//     return CrankFactory<LiquidationCrankContext>(
//         context,
//         15,
//         retrieveDeltaCalcContext,
//         shouldCalculateDeltaCrank,
//         doDeltaCalculationCrank
//     )
// }