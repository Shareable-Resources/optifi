import solana.system_program as sp
from solana.publickey import PublicKey
from solana.account import Account
from solana.rpc.api import Client
from solana.transaction import Transaction, TransactionInstruction, AccountMeta


from config import keypair

cli = Client("https://api.devnet.solana.com")


account = Account()
new_account = Account()
print(new_account.public_key())
print(new_account.keypair())


transaction = Transaction()

transaction.add(
    TransactionInstruction(
        [
            AccountMeta(
                PublicKey("3LdbrFBY7sZ71MtuZhrMzK4YLgxNcTrQ5wLNZHs7r85T"), False, False
            ),
            AccountMeta(
                PublicKey("FABkSFDkF3Wz3CpC5JTmw44jeKvXKQvXgXFCyxhAE46X"), False, False
            ),
            ...,
        ],
        PublicKey("CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz"),
        bytearray.fromhex("050000000000000000"),
    )
)

# send_tx = cli.send_transaction(transaction, new_account)

send_tx = cli.request_airdrop(
    PublicKey("HwLPYHdoGvBTHH14SNND1H6weoPSJieQJKQtY6JYScuN"), 2 * 10 ** 9
)


print(send_tx)
