import {OptifiMarket} from "@optifi/optifi-sdk/lib/types/optifi-exchange-types";
import {PublicKey} from "@solana/web3.js";

export interface ExpiredMarketAndUsers {
    market: [OptifiMarket, PublicKey],
    tokenHolders: PublicKey[]
}

export default interface ExpirationContext {
    expiredMarkets: ExpiredMarketAndUsers[]
}