import { OptifiMarket } from "@optifi/optifi-sdk/lib/types/optifi-exchange-types";
import { PublicKey } from '@solana/web3.js';
import { findAMMAccounts } from '@optifi/optifi-sdk/lib/utils/amm'
import Context from "@optifi/optifi-sdk/lib/types/context";


export function getMarketTokenHolders(context: Context, market: OptifiMarket): Promise<PublicKey[]> {
    return new Promise((resolve, reject) => {
        // Find the AMM accounts so they can be excluded from the list of top token holders
        findAMMAccounts(context).then((ammAccounts) => {
            let ammAddresses: Set<PublicKey> = new Set(ammAccounts.map((a) => a[1]));
            let tokenHoldingAccounts: Set<PublicKey> = new Set();
            Promise.all(
                [
                    market.instrumentShortSplToken,
                    market.instrumentLongSplToken
                ].map((tokenMint => {
                    return new Promise((resolve, reject) => {
                        context.connection.getTokenLargestAccounts(tokenMint).then((res) => {
                            let relevantAddresses = res.value
                                .filter((acct) => acct.uiAmount as number > 0)
                                .map(
                                    (acct) => acct.address
                                ).filter((address) => !ammAddresses.has(address))
                            for (let addr of relevantAddresses) {
                                tokenHoldingAccounts.add(addr)
                            }
                            resolve(true)
                        }).catch((err) => reject(err))
                    })
                }))
            ).then(() => {
                resolve(Array.from(tokenHoldingAccounts))
            }).catch((err) => {
                console.error(err);
                reject(err);
            })
        })
    })
}