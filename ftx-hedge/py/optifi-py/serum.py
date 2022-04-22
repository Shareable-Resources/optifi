# %%
# from pyserum.connection import get_live_markets, get_token_mints

# print("tokens: ")
# print(get_token_mints())
# print("markets: ")
# print(get_live_markets())

# %%
from pyserum.connection import conn
from pyserum.market import Market
from solana.publickey import PublicKey
from solana.rpc import types

cc = conn("https://api.devnet.solana.com")

market_address = PublicKey(
    "pbTGMwiQy7ZmkY4byob2synqLtw7FfqWVkscedG6Zrz"
)  # Address for BTC/USDC

# cc = conn("https://api.mainnet-beta.solana.com/")
# market_address = "5LgJphS6D5zXwUVPU7eCryDBkyta3AidrJ5vjNU6BcGW"  # Address for BTC/USDC


serum_program_id = PublicKey("DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY")

account_info: types.RPCResponse = cc.get_account_info(market_address)

print(cc.get_version())


# Load the given market
market = Market.load(cc, market_address, serum_program_id)
asks = market.load_asks()
# Show all current ask order
print("Ask Orders:")
for ask in asks:
    print(
        "Order id: %d, price: %f, size: %f."
        % (ask.order_id, ask.info.price, ask.info.size)
    )

print("\n")
# Show all current bid order
print("Bid Orders:")
bids = market.load_bids()
for bid in bids:
    print(f"Order id: {bid.order_id}, price: {bid.info.price}, size: {bid.info.size}.")
