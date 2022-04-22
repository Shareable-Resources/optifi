import Context from "@optifi/optifi-sdk/lib/types/context";
import ExpirationContext from "./expirationContext";
import {randomInt} from "crypto";
import recordPnl from "@optifi/optifi-sdk/lib/instructions/recordPnl";
import {formatExplorerAddress, SolanaEntityType} from "@optifi/optifi-sdk/lib/utils/debug";
import settleFunds from "@optifi/optifi-sdk/lib/instructions/settleFunds";
import {pickRandomItem} from "../../utils/generic";


export function doFundSettlementCrank(context: Context, expirationContext: ExpirationContext): Promise<void> {
    return new Promise((resolve, reject) => {
        // Pick just one market, and one user out of the list of valid users, and do it at random, to minimize the
        // possibility of conflicting with other crankers
        let validMarkets = expirationContext.expiredMarkets.filter((m) => m.tokenHolders.length > 0);
        if (validMarkets.length > 0) {
            let marketToSettle = pickRandomItem(validMarkets);
            let userToSettle = pickRandomItem(marketToSettle.tokenHolders)
            console.debug("Submitting calculate PNL for ", userToSettle);
            recordPnl(context,
                userToSettle,
                marketToSettle.market[1],
            ).then((pnlResult) => {
                if (pnlResult.successful) {
                    console.debug(`Recorded PNL for user ${userToSettle} - ${formatExplorerAddress(context, 
                        pnlResult.data as string, 
                        SolanaEntityType.Transaction)}`);
                    // Now that we've recorded their PNL, settle their funds
                    settleFunds(context, userToSettle).then((settleRes) => {
                        if (settleRes.successful) {
                            console.debug(`Settled funds for user ${userToSettle}, ${formatExplorerAddress(context,
                                settleRes.data as string,
                                SolanaEntityType.Transaction)}`);
                            resolve()
                        } else {
                         console.warn(`Couldn't settle funds for user ${userToSettle}`)
                        }
                    }).catch((err) => {
                        console.error(err);
                        reject(err);
                    })
                } else {
                    console.warn(`Couldn't record PNL for user ${userToSettle}`, pnlResult);
                    // Regardless, we'll resolve, as we've finished a crank
                    resolve();
                }
            }).catch((err) => {
                console.error(err);
                reject(err);
            })
        } else {
            console.log("No remaining users to be settled, starting to mark markets ");
            let marketIdx = randomInt(expirationContext.expiredMarkets.length);
            let randomMarket = expirationContext.expiredMarkets[marketIdx];
            // TODO: Update the optifi market with a new instrument
        }
    })
}