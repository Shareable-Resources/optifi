import { initializeContext } from "@optifi/optifi-sdk";
import { OptifiMarket } from "@optifi/optifi-sdk/lib/types/optifi-exchange-types";
import { PublicKey } from "@solana/web3.js";
import { getMarketTokenHolders } from "../utils/token";

let market = new PublicKey("HgRRCp5Dt18GFW8Gc9bp8hvYct37GrXnWzNUEAgetxMS");

initializeContext().then((context) => {
    context.program.account.optifiMarket.fetch(market).then((marketRes) => {
        let optifiMarket = marketRes as OptifiMarket;
        getMarketTokenHolders(context, optifiMarket).then((res) => {
            console.log(res.toString());
        }).catch((err) => {
            console.error(err);
        })
    })
})