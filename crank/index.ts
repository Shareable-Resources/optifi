import {initializeContext} from "@optifi/optifi-sdk";
import FundSettlement from "./modules/fundSettlement/fundSettlement";
import Syncing from "./modules/syncing/syncing";
import ProposalCalculation from "./modules/proposalCalculation/proposalCalculation";
import DeltaCalculation from "./modules/deltaCalculation/deltaCalculation";

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

/**
 * Entrypoint of the cranking program
 */
function main() {
    console.log("Starting Optifi cranker...");
    let walletPath = getWalletPath();
    console.debug(`Initializing SDK context from wallet path ${walletPath}`);
    initializeContext(walletPath).then((context) => {
        console.debug("Initialized program context", context);
        Promise.all([
            FundSettlement(context),
            Syncing(context),
            ProposalCalculation(context),
            DeltaCalculation(context)
        ]).then(() => {
            console.log("Finished cranking!")
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