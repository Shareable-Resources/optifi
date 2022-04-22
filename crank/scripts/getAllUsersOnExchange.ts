import { initializeContext } from "@optifi/optifi-sdk";
import { getAllUsersOnExchange } from "../utils/account";


initializeContext().then((context) => {
    getAllUsersOnExchange(context).then((res) => {
        for (let r of res) {
            console.log(r.publicKey.toString());
        }
    })
})