import asyncio
from solana.rpc.async_api import AsyncClient
from solana.publickey import PublicKey
from anchorpy import Program, Provider, Wallet


async def main():
    client = AsyncClient("https://api.mainnet-beta.solana.com/")
    provider = Provider(client, Wallet.local())
    # load the Serum Swap Program (not the Serum dex itself).
    program_id = PublicKey("22Y43yTVxuUkoRKdm9thyRhQ3SdgQS7c7kB6UNCiaczD")
    program = await Program.at(program_id, provider)
    print(program.idl.name)  # swap
    await program.close()


asyncio.run(main())
