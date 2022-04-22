import {Program, Wallet} from "@project-serum/anchor";
import {OptifiExchangeIDL} from "./optifi-exchange-types";

export interface TestContext {
    program: Program<OptifiExchangeIDL>,
    wallet: Wallet
}