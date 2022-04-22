import Context from '@optifi/optifi-sdk/lib/types/context';
import CrankFactory from "../../utils/crankFactory";
import {AMMStateCrankContext, getAMMsInState} from "../../utils/amm";
import {AmmState} from "@optifi/optifi-sdk/lib/types/optifi-exchange-types";
import {pickRandomItem} from "../../utils/generic";
import calculateAmmDelta from "@optifi/optifi-sdk/lib/instructions/calculateAmmDelta";

function retrieveDeltaCalcContext(context: Context): Promise<AMMStateCrankContext> {
    console.log("Retrieving delta calc context")
    return getAMMsInState(context, AmmState.CalculateDelta);
}

function shouldCalculateDeltaCrank(context: Context, deltaCtx: AMMStateCrankContext): Promise<boolean> {
    return new Promise((resolve) => resolve(deltaCtx.length > 0));
}

function doDeltaCalculationCrank(context: Context, deltaCtx: AMMStateCrankContext): Promise<void> {
    return new Promise((resolve, reject) => {
        let ammToSync = pickRandomItem(deltaCtx);
        calculateAmmDelta(context, ammToSync[1]).then((calculateDeltaRes) => {
            if (calculateDeltaRes.successful) {
                console.log("Calculated delta ", calculateDeltaRes);
                resolve()
            } else {
                console.warn(calculateDeltaRes)
                resolve()
            }
        }).catch((err) => {
            console.error(err);
            reject(err);
        })
    });
}

export default function DeltaCalculation(context: Context): Promise<void> {
    return CrankFactory<AMMStateCrankContext>(
        context,
        15,
        retrieveDeltaCalcContext,
        shouldCalculateDeltaCrank,
        doDeltaCalculationCrank
    )
}