from pathlib import Path
import asyncio
import json
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from anchorpy import Idl, Program, Context, Provider, Wallet
from solana.keypair import Keypair
from solana.system_program import SYS_PROGRAM_ID
from spl.token.constants import TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID

OPTIFI_PROGRAM_ID = "hjo3CZHSkssq4df3uhYPEuJMdAstA6qc3EEYNDXAxvW"


USER_ACCOUNT_PREFIX: str = "user_account"
USER_TOKEN_ACCOUNT_PDA: str = "user_token_account_pda"
EXCHANGE_PREFIX: str = "optifi_exchange"
INSTRUMENT_PREFIX: str = "instrument"
OPTIFI_MARKET_PREFIX: str = "optifi_market"
OPTIFI_MARKET_MINT_AUTH_PREFIX: str = "optifi_market_mint_auth"
USDC_CENTRAL_POOL_PREFIX: str = "central_usdc_pool"
USDC_POOL_AUTH_PREFIX: str = "central_usdc_pool_auth"
SERUM_OPEN_ORDERS_PREFIX: str = "serum_open_orders"
SERUM_MARKET_AUTHORITY: str = "serum_market_auth"
SERUM_PRUNE_AUTHORITY: str = "serum_prune_auth"
AMM_PREFIX: str = "amm"
AMM_LIQUIDITY_AUTH_PREFIX: str = "amm_liquidity_auth"
MARKET_MAKER_PREFIX: str = "market_maker"
LIQUIDATION_STATE_PREFIX: str = "liquidation_state"

# Read the generated IDL.
f = Path("idl/optifi_exchange.json").open()
raw_idl = json.load(f)
idl = Idl.from_json(raw_idl)

program_id = PublicKey(OPTIFI_PROGRAM_ID)
exchangeUUID = "111162"


def findAccountWithSeeds(seeds):
    return PublicKey.find_program_address(seeds, program_id)


# Exchange Address: 3o3DRQThKmyorZeoMFu94NmiAvDEvMoCmW3mb8VvgT1K
def findExchangeAccount():
    account = findAccountWithSeeds([EXCHANGE_PREFIX.encode(), exchangeUUID.encode()])
    print(f"ExchangeAccount: {account}")
    return account


# Optifi User Account Adddress: AXWWiFMNZuypMDwK3i3S9hUJmQVbGju4ZNtFpjXnR12S
def findUserAccount():
    exchangeId = findExchangeAccount()
    account = findAccountWithSeeds(
        [
            USER_ACCOUNT_PREFIX.encode(),
            exchangeId[0]._key,
            Wallet.local().public_key._key,
        ]
    )
    print(f"UserAccount: {account}")
    return account


# findUserAccount()


def findOptifiMarketMintAuthPDA():
    return derivePDAAddress(OPTIFI_MARKET_MINT_AUTH_PREFIX)


def derivePDAAddress(prefix: str):
    exchangeId = findExchangeAccount()
    return findAccountWithSeeds([prefix.encode(), exchangeId[0]._key])


def findOptifiMarketMintAuthPDA():
    return derivePDAAddress(OPTIFI_MARKET_MINT_AUTH_PREFIX)


def findOptifiUSDCPoolAuthPDA():
    return derivePDAAddress(USDC_POOL_AUTH_PREFIX)


def findOptifiUSDCPoolPDA():
    return derivePDAAddress(USDC_CENTRAL_POOL_PREFIX)


def findSerumAuthorityPDA():
    return derivePDAAddress(SERUM_MARKET_AUTHORITY)


def findSerumPruneAuthorityPDA():
    return derivePDAAddress(SERUM_PRUNE_AUTHORITY)


def getAmmLiquidityAuthPDA():
    return derivePDAAddress(AMM_LIQUIDITY_AUTH_PREFIX)


def findAssociatedTokenAccount(
    tokenMintAddress: PublicKey,
    accountOwner: PublicKey = Wallet.local().public_key._key,
):
    return PublicKey.find_program_address(
        [
            accountOwner._key,
            TOKEN_PROGRAM_ID._key,
            tokenMintAddress._key,
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID,
    )


# Exchange UUID: 111162
# Exchange URL: https://explorer.solana.com/address/3o3DRQThKmyorZeoMFu94NmiAvDEvMoCmW3mb8VvgT1K?cluster=devnet
# Exchange Exists: true
# User Wallet Address: HwLPYHdoGvBTHH14SNND1H6weoPSJieQJKQtY6JYScuN
# Optifi Program ID: hjo3CZHSkssq4df3uhYPEuJMdAstA6qc3EEYNDXAxvW
# Optifi User Account Adddress: AXWWiFMNZuypMDwK3i3S9hUJmQVbGju4ZNtFpjXnR12S
# Optifi User Account Exists: true


market = PublicKey("469XB2MCbn1VhcCfBXHxjAtFTkatHKnJR34qsHqe4FW3")


async def main():

    client = AsyncClient("https://api.devnet.solana.com")
    provider = Provider(client, Wallet.local())

    async with Program(idl, program_id, provider) as program:

        # account = await program.account["UserAccount"].fetch(findUserAccount()[0])

        account = await program.account["OptifiMarket"].fetch(market)
        # OptifiMarket(
        #     optifi_market_id=54,
        #     serum_market=B4Z8pjdpAtV3SH9vRUAsgr82JaKXWRuA9bXNr56SNn4X,
        #     instrument=8eNGYsJPBeJx3kK8mjv9WXUEhhqvjchQH5PSUjb1KgZw,
        #     instrument_long_spl_token=14aAkhbWjpYrsFGRCGq1byNnLdtu9r5kZuJu7TsLBkGe
        #     instrument_short_spl_token=anuDjvZK8MdKvSua5Mo51NqHNUe812RK6dVN2PffBrv,
        #     is_stopped=False,
        #     bump=254
        #     )

        serum_market = account.serum_market

        print(
            "serum_market: ", serum_market
        )  # B4Z8pjdpAtV3SH9vRUAsgr82JaKXWRuA9bXNr56SNn4X

        instrument_long_spl_token = account.instrument_long_spl_token

        instrument_short_spl_token = account.instrument_short_spl_token

        userAccountAddress = findUserAccount()[0]

        print(
            findAssociatedTokenAccount(instrument_long_spl_token, userAccountAddress)
        )  # 4CzzoXLNfcJh18Ynmdmbon1pZhJATSQVeCTK1PTghGJW

        print(account)

        # --------------------PLACE ORDER--------------------


"""
        # Execute the RPC.
            side = program.type["OrderSide"].Bid() # Bid, Ask
            limit = 1
            maxCoinQty = 1
            maxPcQty = 1

            accounts = {
                        "exchange": findExchangeAccount()[0],
                        "user": Wallet.local().public_key,
                        "user_account": userAccountAddress,
                        "user_margin_account": userAccount.userMarginAccountUsdc,
                        "user_instrument_long_token_vault": PublicKey(instrument_long_spl_token),
                        "user_instrument_short_token_vault": PublicKey(instrument_short_spl_token),
                        "optifi_market": market,
                        "serum_market": optifiMarket.serumMarket,
                        "open_orders": openOrdersAccount,
                        "open_orders_owner": userAccountAddress,
                        "request_queue": serumMarket.decoded.requestQueue,
                        "event_queue": serumMarket.decoded.eventQueue,
                        "bids": serumMarket.bidsAddress,
                        "asks": serumMarket.asksAddress,
                        "coin_mint": serumMarket.decoded.baseMint,
                        "coin_vault": serumMarket.decoded.baseVault,
                        "pc_vault": serumMarket.decoded.quoteVault,
                        "vault_signer": vaultOwner,
                        "order_payer_token_account": (side === OrderSide.Bid ? userAccount.userMarginAccountUsdc : longSPLTokenVault),
                        "instrument_token_mint_authority_pda": mintAuthAddress,
                        "usdc_central_pool": exchange.usdcCentralPool,
                        "instrument_short_spl_token_mint": optifiMarket.instrumentShortSplToken,
                        "serum_dex_program_id": serumId,
                        "token_program": TOKEN_PROGRAM_ID,
                        "rent": SYSVAR_RENT_PUBKEY
                    }
            await program.rpc["place_order"]((market, side, limit, maxCoinQty, maxPcQty), ctx=Context(accounts=accounts, signers=[my_account]))


            
            order = (market, side, limit, maxCoinQty, maxPcQty)"""


asyncio.run(main())
