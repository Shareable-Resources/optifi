import { AmmAccount, AmmState } from "@optifi/optifi-sdk/lib/types/optifi-exchange-types";
import Context from "@optifi/optifi-sdk/lib/types/context";
import { findAMMAccounts } from "@optifi/optifi-sdk/lib/utils/amm";
import { PublicKey } from '@solana/web3.js';

export type AMMStateCrankContext = [AmmAccount, PublicKey][];

export function getAMMsInState(context: Context, state: AmmState): Promise<[AmmAccount, PublicKey][]> {
    return new Promise((resolve, reject) => {
        console.log("Finding amm accounts")
        findAMMAccounts(context).then((amms) => {
            console.log("Found amm accounts")
            resolve(
                amms.filter((a) => a[0].state as AmmState == state)
            )
        }).catch((err) => {
            console.error(err);
            reject(err);
        })
    })
}