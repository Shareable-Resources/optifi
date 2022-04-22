# How to run the test for OptiFi program on Solana

## deploy the program

- after clone the repo, run

```bash
cd programs/Optifi
anchor build
```

you should be able to see the output like this:

`The program address will default to this keypair (override with --program-id): /REPLACE_WITH_YOUR_PATH/Optifi/target/deploy/optifi-keypair.json`

- to get the program id, run

```bash
solana-keygen pubkey /REPLACE_WITH_YOUR_PATH/Optifi/target/deploy/optifi-keypair.json
```

it should prints the program id

- make sure the returned program id in last step is the same as the ones declared both in `programs/Optifi/src/lib.rs` and `Anchor.toml`.
- if not, paste it to the two files and re-build

```bash
anchor build
```

- deploy the program onto Solana blockchain

```bash
anchor deploy
```

## run the ts tests

- install dependencies

```bash
yarn install
```

- convert idl to ts

```bash
yarn idl
```

- copy the contents in `config.example.json` to a new file `config.json` under dir `./test`
- replace the following fields in `config.json` with your own vaules which you can in other steps:

```bash
{
  "TOKEN_PROGRAM_ID": #spl token program id of Solana, fixed address
  "Serum_Dex_ProgramId": # Serum DEX program id
  "SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID": # spl associated token account program id of Solana, fixed address
  "WALLET_PATH": # your solana wallet path
  "OptiFi_ProgramId": # address of OptiFi Programdeployed in previous step
  "OptiFi_Exchange_Id": # initialzed optifi exchange id
  "USDC_TOKEN_MINT": # the usdc(or any other spl token to be deposited by users) mint address
  "Created_Instrumnet_Pubkey": # one of the created instrument keys
  "Created_Serum_Orderbook": { # the serum orderbook(aka. serum market) accounts details you've created with 3~4 SOL
    "market": #serum orderbook(market) address
    "coinMintPk": #serum orderbook's base currency mint address
    "pcMintPk": #serum orderbook's quote currency mint address (i.e, USDC mint address)
    "coinVaultPk": #serum orderbook's base currency vault
    "pcVaultPk": #serum orderbook's quote currency vault
    "bids": #serum orderbook's bids account
    "asks": #serum orderbook's asks account
    "reqQ":  #serum orderbook's request queue account
    "eventQ": #serum orderbook's event queue account
    "vaultOwner": #serum orderbook's vault owner that has authority over its coinVaultPk and pcVaultPk
    "vaultOwnerBump": # the bump seed to derive vaultOwner
  },
  "instrumentSplTokenMintAuthority" # the mint authority for both instrument long and short spl tokens
  "Created_OptiFi_Market": { #created optifi market account details
    "optifiMarket": #optifi market address,
    "optifiMarketId": #optifi market id, for example:1,2,3...
    "serumMarket": #the serum orderbook this optifi market is using
    "instrument": #the instrumnet this optifi market is listing
    "isStopped": # if the optifi market is stopped
    "shortSplTokenMint": # the mint address of instrument short spl token
  },
  "Created_Amm": {
    "AMM": # the created AMM address
    "Usdc_Vault": # amm's usdc vault
    "LP_Token_Mint": # amm's lp token mint
  },
  "user_profiles": { # all testing user's profiles
    "template": { # a template of user's profile, re-name it with customised username
      "Wallet_PubKey": "", # user's wallet pubkey
      "WALLET_PATH": "", # user's wallet file path (absolute path)
      "User_USDC_Token_Account": # user's usdc token account which is personally owned by the user
      "User_Account": # initiazlied user optifi account address
      "User_Margin_Account_USDC": # user's usdc margin account to which the user will deposit usdc, its contronled by pda
      "User_Open_Orders_Account":  # user's initialized open orders account which is specific to an optifi market and its serum orderbook
      "User_Instrument_Long_SPL_Token_Account": # user's instrument long spl token vault to recieve instrument spl token when trading on an optifi market
      "User_Instrument_Short_SPL_Token_Account": # user's instrument short spl token vault
    }
  }
}

```

- initialize the optifi exchange

```bash
yarn test-exchange
```

copy the optifi exchange address to to `OptiFi_Exchange_Id` in `config.json`
copy the creted usdc central pool address to to `USDC_CENTRAL_POOL` in `config.json`

- initialize an optifi user account for user

```bash
yarn test-user
```

copy user related addresses into the user's profile in `config.json`

it will 1) initilize an OptiFi account for the user; 2) deposit some usdc token to user's vault; 3) withdraw some usdc tokens from user's vault

you should be able to see the balance changes of account user_margin_account_usdc, which represents for a user's deposit.

- create an series of optition instruments which will have 9 different strikes

modify the specifiers of the instrument you want to create, then run:

```bash
yarn test-chain
```

copy one of the instrument address to `Created_Instrumnet_Pubkey` in `config.json`

- create a serum market(orderbook). Note that it costs 3~4 SOL to create a serum market

```bash
yarn test-serum
```

copy the serum orderbook details to `Created_Serum_Orderbook` in `config.json`

- create an optifi market

```bash
yarn test-market-create
```

it will bind the instrument and serum orderbook created in previous steps, so that the instrument can be traded on serum orderbook. copy the optifi market details to `Created_OptiFi_Market` in `config.json`

- init user for one optifi market

```bash
test-market-init-user
```

it will initialize a new open orders account for user to place order on the optifi market, and submit an ask order. copy the user's open orders account address to `User_Open_Orders_Account` in `config.json`
it will also initialize instrument long and short spl token accounts for the user to receive instrument spl tokens when trading on an optifi market, copy the instrument long/short spl token account to `User_Instrument_Long_SPL_Token_Account` and `User_Instrument_Short_SPL_Token_Account` in `config.json`

- test order instructions

try to send diffrent order instructions

```bash
yarn test-order
```

If the order is an ask order, the optifi market will mint the same amount of instrument spl token to the seller's instrumnet spl token account first, then all the minted instrument spl token will be sent to serum orderbook for trading.

- test record PnL for a user

After an optifi market is expired (actually it's the instrument listed on that optifi market gets expired), carnkers(or anyone) can record temp PnL for a user on that optifi market

```bash
test-market-record-pnl
```

It will burn the long and short tokens the user holds for that market, and calculate and update the PnL in user's account. If all long tokens and short tokens are burnt, the market will be stopped.

- test settle fund for a user

After all optifi markets with the same expiry date are stopped, carnkers(or anyone) can settle fund for a user

```bash
test-market-settle-fund
```

- stop and update market

When both the long token and short token's supply of an optifi market becomes zero after expiry date, the market can be stopped and be re-used for a new instrument later by updating the market.

```bash
test-market-stop-update
```
