import Context from "@optifi/optifi-sdk/lib/types/context";
import { findExchangeAccount } from "@optifi/optifi-sdk/lib/utils/accounts";
import { AccountInfo, PublicKey } from "@solana/web3.js";

export async function getFilteredProgramAccounts(
    context: Context,
    filters,
): Promise<{ publicKey: PublicKey; accountInfo: AccountInfo<Buffer> }[]> {
    // @ts-ignore
    const resp = await context.connection._rpcRequest('getProgramAccounts', [
        context.program.programId.toBase58(),
        {
            commitment: context.connection.commitment,
            filters,
            encoding: 'base64',
        },
    ]);
    if (resp.error) {
        throw new Error(resp.error.message);
    }
    return resp.result.map(
        ({ pubkey, account: { data, executable, owner, lamports } }) => ({
            publicKey: new PublicKey(pubkey),
            accountInfo: {
                data: Buffer.from(data[0], 'base64'),
                executable,
                owner: new PublicKey(owner),
                lamports,
            },
        }),
    );
}

export async function getAllUsersOnExchange(context: Context)
    : Promise<{ publicKey: PublicKey; accountInfo: AccountInfo<Buffer> }[]> {

    let [exchangeId, _] = await findExchangeAccount(context);

    const userAccountFilter = [
        {
            memcmp: {
                offset: 8,
                bytes: exchangeId.toBase58(),
            }
        },
        {
            dataSize: 8 + 32 + 32 + 33 + 32 + 64 + 64 + 64 + 200,
        },
    ];

    return getFilteredProgramAccounts(context, userAccountFilter)
}