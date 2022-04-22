import Context from '@optifi/optifi-sdk/lib/types/context';
import {AmmState} from "@optifi/optifi-sdk/lib/types/optifi-exchange-types";
import calculateAmmProposal from "@optifi/optifi-sdk/lib/instructions/calculateAmmProposal";
import {AMMStateCrankContext, getAMMsInState} from "../../utils/amm";
import {pickRandomItem} from "../../utils/generic";
import {formatExplorerAddress, SolanaEntityType} from "@optifi/optifi-sdk/lib/utils/debug";
import CrankFactory from "../../utils/crankFactory";

function getProposalContext(context: Context): Promise<AMMStateCrankContext> {
    return getAMMsInState(context, AmmState.CalculateProposal);
}

function shouldCalculateProposal(context: Context, proposalCtx: AMMStateCrankContext): Promise<boolean> {
    return new Promise((resolve) => {
        resolve(proposalCtx.length > 0)
    })
}

function calculateProposal(context: Context, proposalCtx: AMMStateCrankContext): Promise<void> {
    return new Promise((resolve, reject) => {
        let ammToCalculate = pickRandomItem(proposalCtx);
        console.debug("Calculating proposal for Amm ", ammToCalculate[1].toString());
        calculateAmmProposal(context, ammToCalculate[1]).then((proposalRes) => {
            if (proposalRes.successful) {
                console.debug("Calculated AMM Proposal ", formatExplorerAddress(context,
                    proposalRes.data as string,
                    SolanaEntityType.Transaction));
                resolve();
            } else {
                console.warn(proposalRes);
                resolve();
            }
        }).catch((err) => reject(err));
    })
}

export default function ProposalCalculation(context: Context): Promise<void> {
    return CrankFactory<AMMStateCrankContext>(
        context,
        15,
        getProposalContext,
        shouldCalculateProposal,
        calculateProposal
    )
}