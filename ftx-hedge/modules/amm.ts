import Context from "@optifi/optifi-sdk/lib/types/context";
import { findAMMAccounts } from "@optifi/optifi-sdk/lib/utils/amm";
import { initializeContext } from "@optifi/optifi-sdk";

function getWalletPath(): string {
    let args = process.argv;
    let walletPath: string;
    if (args.length >= 3) {
        walletPath = args[2];
    } else {
        if (process.env.OPTIFI_WALLET) {
            walletPath = process.env.OPTIFI_WALLET;
        } else {
            throw new Error("No wallet supplied - you must specify the location of a Solana wallet " +
                "either through a command line argument, or the environment variable OPTIFI_WALLET")
        }
    }
    return walletPath;
}

// get_amm_positions
export function getAMMsDelta(context: Context): Promise<number[]> {
    return new Promise((resolve, reject) => {
        findAMMAccounts(context).then((amms) => {
            resolve(
                amms.map(a => a[0].netDelta.toNumber())
            )
        }).catch((err) => {
            console.error(err);
            reject(err);
        })
    })
}


export default function main() {
    let walletPath = getWalletPath();
    initializeContext(walletPath).then((context) => {
        Promise.all([
            getAMMsDelta(context)
        ]).then((deltas) => {
            console.log(deltas);
        }).catch((err) => {
            console.error(err);
            throw new Error("Got error trying to crank");
        })
    }).catch((err) => {
        console.error(err);
        throw new Error("Got error trying to initialize program context ");
    })
}

main();