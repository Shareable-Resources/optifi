import Context from '@optifi/optifi-sdk/lib/types/context';
import CrankFactory from "../../utils/crankFactory";
import ExpirationContext, {ExpiredMarketAndUsers} from "./expirationContext";
import {findExpiredMarkets} from "@optifi/optifi-sdk/lib/utils/market";
import {getMarketTokenHolders} from "../../utils/token";
import {OptifiMarket} from "@optifi/optifi-sdk/lib/types/optifi-exchange-types";
import {randomInt} from "crypto";
import {doFundSettlementCrank} from "./executeExpiration";

function retrieveExpirationContext(context: Context): Promise<ExpirationContext> {
    return new Promise((resolve, reject) => {
        findExpiredMarkets(context).then((markets) => {
            let expiredMarketContext: ExpiredMarketAndUsers[];
            Promise.all(
                markets.map((market) => {
                    return new Promise((resolve, reject) => {
                        getMarketTokenHolders(context, market[0]).then((res) => {
                            expiredMarketContext.push({
                                market: market,
                                tokenHolders: res
                            })
                            resolve(true);
                        }).catch((err) => reject(err))
                    })
                })
            ).then(() => {
                resolve({
                    expiredMarkets: expiredMarketContext
                })
            }).catch((err) => reject(err))
        })
    })
}

function shouldCrankExpiration(context: Context, expirationContext: ExpirationContext): Promise<boolean> {
    return new Promise((resolve, reject) => {
        // If there are any expired markets, we should crank
        resolve(expirationContext.expiredMarkets.length > 0)
    })
}



export default function FundSettlement(context: Context): Promise<void> {
    return CrankFactory<ExpirationContext>(
        context,
        5,
        retrieveExpirationContext,
        shouldCrankExpiration,
        doFundSettlementCrank
    )
}