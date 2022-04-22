/**
 * Utilities for creating a structure in which cranks can be run at an interval, check for a criteria,
 * and fetch data specific to their types
 */
import Context from '@optifi/optifi-sdk/lib/types/context';
import internal from "stream";

/**
 * Helper function to set up the continuous cranking structure for a given crank function
 *
 * @param context The system context
 * @param interval How often to crank, in seconds
 * @param getter A function that, given the system context, will fetch from the on chain system any information it needs to
 *               make determinations about whether or not to crank, as well as any information necessary for said cranking
 * @param crankCriterion A function that, given the crank context returned by the getter, will return a boolean indicating whether or
 *                       not the system should be cranked on this cycle
 * @param crankExecution The function that, if the crankCriterion is passed, will execute the actual crank for this cycle
 * @constructor
 */
export default function CrankFactory<CrankContext>(context: Context,
                                                   interval: number,
                                                   getter: (context: Context) => Promise<CrankContext>,
                                                   crankCriterion: (context: Context, ctx: CrankContext) => Promise<boolean>,
                                                   crankExecution: (context: Context, ctx: CrankContext) => Promise<any>
                                     ): Promise<void> {
    const intervalInSeconds = interval * 1000;
    return new Promise((resolve, reject) => {
        const doCranking = () => {
            getter(context).then((crankCtx: CrankContext) => {
                crankCriterion(context, crankCtx).then((shouldCrank) => {
                    if (shouldCrank) {
                        console.debug("Cranking on this cycle ", crankCtx);
                        crankExecution(context, crankCtx).then(() => {
                            console.debug("Successfully cranked, resetting timeout");
                            setTimeout(doCranking, intervalInSeconds);
                        }).catch((err) => {
                            console.error("Got error while trying to execute crank ", err);
                        })
                    } else {
                        console.debug("Not cranking this cycle, resetting timeout");
                        setTimeout(doCranking, intervalInSeconds);
                    }
                }).catch((err) => {
                    console.error("Got error trying to determine whether or not to crank ", err);
                    reject(err);
                })
            }).catch((err) => {
                console.error("Got error trying to get crank context ", err);
                reject(err);
            })
        }
        setTimeout(
            doCranking,
            intervalInSeconds
        );
    })
}