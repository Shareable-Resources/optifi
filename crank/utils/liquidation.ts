import { initializeContext } from '@optifi/optifi-sdk';
import Context from '@optifi/optifi-sdk/lib/types/context';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import { findExchangeAccount } from "@optifi/optifi-sdk/lib/utils/accounts";
import console from 'console';


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// async function refreshAccounts(
//     context: Context,
//     optifiAccounts: optifiAccount[],
// ) {
//     try {
//         console.log('Refreshing accounts...');
//         console.time('getAlloptifiAccounts');

//         optifiAccounts.splice(
//             0,
//             optifiAccounts.length,
//             ...(await client.getAlloptifiAccounts(optifiGroup, undefined, true)),
//         );
//         shuffleArray(optifiAccounts);

//         console.timeEnd('getAlloptifiAccounts');
//         console.log(`Fetched ${optifiAccounts.length} accounts`);
//     } catch (err: any) {
//         console.error(`Error reloading accounts: ${err}`);
//     } finally {
//         setTimeout(
//             refreshAccounts,
//             refreshAccountsInterval,
//             optifiGroup,
//             optifiAccounts,
//         );
//     }
// }