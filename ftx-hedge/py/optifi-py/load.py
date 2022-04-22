import asyncio
from solana.rpc.async_api import AsyncClient
from solana.publickey import PublicKey
from anchorpy import Program, Provider, Wallet

OPTIFI_PROGRAM_ID = "hjo3CZHSkssq4df3uhYPEuJMdAstA6qc3EEYNDXAxvW"


async def main():
    client = AsyncClient("https://api.devnet.solana.com")
    provider = Provider(client, Wallet.local())
    # load the Serum Swap Program (not the Serum dex itself).
    program_id = PublicKey(OPTIFI_PROGRAM_ID)
    program = await Program.at(program_id, provider)
    print(program.idl)  # swap
    await program.close()


asyncio.run(main())
