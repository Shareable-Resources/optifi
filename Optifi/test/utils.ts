// Anchor isn't generating the instruction type properly here, so we'll disable it
// to make
import {TestContext} from "./testContext";
import {PublicKey, TransactionSignature} from "@solana/web3.js";
import {Wallet, web3} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import Config from './config.json';
import {AccountLayout, Token} from "@solana/spl-token";

/**
 * Helper function to derive the address for a user account with the specified
 * wallet in the system
 */
export function deriveUserAccount(context: TestContext): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
        [
            Buffer.from("user_account"),
            context.wallet.publicKey.toBuffer()
        ],
        context.program.programId
    )
}


/**
 * Wrapper function to
 */
export function getAccount(context: TestContext, key: PublicKey):  Promise<web3.AccountInfo<Buffer> | null> {
    return new Promise((resolve) => {
        context
            .program
            .provider
            .connection
            .getAccountInfo(
                key
            ).then((res) => resolve(res));
    })
}

/**
 * Create a user account attached to the wallet - return the pubkey associated
 * with the new account
 */
/*
export function initializeUserAccount(context: TestContext): Promise<PublicKey> {
    return new Promise((resolve, reject) => {
        deriveUserAccount(context).then((userAccount) => {
            console.log("Derived user account");
            let newUserVaultAccount = web3.Keypair.generate();
            console.log("Generated new keypair");
            let tx = context.program.instruction.initUserAccount(
                {
                    accounts: {
                        userAccount: userAccount,
                        userVaultOwnedByPda: newUserVaultAccount.publicKey,
                        owner: context.wallet.publicKey,
                        payer: context.wallet.publicKey,
                        tokenProgram: Config.TOKEN_PROGRAM_ID,
                        systemProgram: anchor.web3.SystemProgram.programId,
                        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    },
                    signers: [context.wallet, newUserVaultAccount]
                },
            );
            console.log("Did tx", tx);
            console.log("Typeof tx is ", typeof(tx));
        });
    });
}
 */

export function initializeUserAccount(context: TestContext): Promise<TransactionSignature> {
    return new Promise((resolve, reject) => {
        deriveUserAccount(context).then((res) => {
            let [userAccount, bump2] = res;
            let user_margin_account_usdc = anchor.web3.Keypair.generate();

            context.program.provider.connection.getMinimumBalanceForRentExemption(
                AccountLayout.span
            ).then((lamports) => {
                context.program.rpc.initUserAccount(bump2, {
                    accounts: {
                        optifiExchange: new PublicKey(Config.OptiFi_Exchange_Id),
                        userAccount: userAccount,
                        userMarginAccountUsdc: user_margin_account_usdc.publicKey,
                        owner: context.wallet.publicKey,
                        payer: context.wallet.publicKey,
                        tokenProgram: context.program.programId,
                        systemProgram: anchor.web3.SystemProgram.programId,
                        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    },
                    signers: [context.wallet.payer, user_margin_account_usdc],
                    instructions: [
                        anchor.web3.SystemProgram.createAccount({
                            fromPubkey: context.wallet.publicKey,
                            newAccountPubkey: user_margin_account_usdc.publicKey,
                            // space: configArrayStart + 4 + 16 * configLineSize + 4 + 2,
                            space: AccountLayout.span,
                            lamports: lamports,
                            programId: context.program.programId,
                        }),
                        Token.createInitAccountInstruction(
                            context.program.programId,
                            new PublicKey(Config.USDC_TOKEN_MINT),
                            user_margin_account_usdc.publicKey,
                            context.wallet.publicKey
                        ),
                    ],
                }).then((tx8) => {
                    console.log("tx8: ", tx8);
                    resolve(tx8);
                }).catch((err) => {
                    console.error("tx8 err", err);
                    reject(err);
                });
            })

        })
    })
}