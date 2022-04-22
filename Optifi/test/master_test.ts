/**
 * Entrypoint for Optifi tests -- these tests will use the
 * workspace feature to simplify building and testing against localnet
 */

// Standard imports
import Config from './config.json';
import {workspace, Program, Wallet, web3} from "@project-serum/anchor";
import {OptifiExchangeIDL} from "./optifi-exchange-types";
import {test_account_initialization} from "./test_user_accounts";
import {TestContext} from "./testContext";

// Require imports
const fs = require('fs');

describe('Optifi', () => {
    // Read the deployed program from the optifi_exchange workspace
    const program: Program<OptifiExchangeIDL> = workspace.OptifiExchange;
    const programId = program.programId;
    const providerEnv = process.env.ANCHOR_PROVIDER_URL;

    // The users wallet
    const walletPair = web3.Keypair.fromSecretKey(
        new Uint8Array(
            JSON.parse(fs.readFileSync(Config.WALLET_PATH,
                "utf-8"))
        )
    )
    const wallet = new Wallet(walletPair);
    console.log(`Starting tests... \nProgram: ${programId}\nNetwork: ${providerEnv}\nWallet Pubkey: ${wallet.publicKey}`)

    const context: TestContext = {
        program,
        wallet
    };

    it('Can initialize successfully', () => )
    it('Can load and reference user accounts', () => test_account_initialization(context))
});