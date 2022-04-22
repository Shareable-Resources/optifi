import {TestContext} from "./testContext";
import {web3} from "@project-serum/anchor";
import {deriveUserAccount, getAccount, initializeUserAccount} from "./utils";
import assert from "assert";


/**
 * Test to make sure that the program either appropriately
 * creates an account for the user when requested, or that one already
 * exists
 */
export function test_account_initialization(context: TestContext) {
    deriveUserAccount(context).then((derivedAddress) => {
        // After calculating the address we'd expect to find the user account at,
        // check to see whether or not there's an account there - if there is,
        // we'll succeed on the check, or otherwise, we'll initialize the account
        getAccount(context, derivedAddress[0]).then((res) => {
            if (res) {
                console.log("Account already existed!");
            } else {
                console.log("Account didn't already exist, initializing!");
                initializeUserAccount(context)
                    .then(
                        (tx) => {
                            console.log("Initialized user account in transaction - ", tx);
                            // Now that the account has been initialized,
                            // assert that we can find it
                            getAccount(context, derivedAddress[0]).then((res) => {
                                assert.notEqual(res, null);
                            })
                        }
                    ).catch((err) => console.error(err))
            }
        }).catch((err) => console.error(err));
    })
}