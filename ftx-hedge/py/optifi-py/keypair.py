import json
from solana.keypair import Keypair
import base58
from config import phantom, keypair

# From Phantom is a str ( which len is 88)

byte_array = phantom.encode()
b58 = base58.b58decode(byte_array)

key = Keypair.from_secret_key(b58)
print(key.public_key)

# To solana CLI

json_string = "[" + ",".join(map(lambda b: str(b), b58)) + "]"
print(json_string)

json_string = json.loads(json_string)
print(len(json_string))  # 長度 64 list
