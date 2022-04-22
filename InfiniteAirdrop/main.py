import subprocess
import multiprocessing
import os
import time

devnet_url = "https://api.devnet.solana.com"

devnet_args = ["--url", devnet_url]

PROCESSES = 1


def wait_retry(command):
    try:
        print(subprocess.check_output(command))
    except subprocess.CalledProcessError:
        print(f"Command {command} failed, waiting 5 seconds and retrying...")
        time.sleep(5)
        wait_retry(command)


def airdrop(root_address: str, idx: int):
    fname = f"airdrop_{idx}.json"
    if not os.path.exists(fname):
        subprocess.check_output(["solana-keygen", "new", "--no-bip39-passphrase", "-o",  fname])
    address_args = ["-k", fname]
    new_address = subprocess.check_output(["solana", "address"]+address_args+devnet_args).strip()
    print(f"Sending to {new_address}")
    i = 0
    while True:
        try:
            output = subprocess.check_output(["solana", "airdrop", "1", new_address]+address_args+devnet_args).decode('utf-8')
            print(output)
            i += 1
        except subprocess.CalledProcessError:
            print("Rate limit reached, transferring and generating new")
            break
    if i == 0:
        print("Errored on first airdrop, waiting a minute and regenerating")
        time.sleep(60)
    else:
        # Transfer the coins back to the root address
        wait_retry(["solana", "transfer", root_address, "ALL"]+address_args+devnet_args)
    os.remove(fname)
    print("Generating new key")
    airdrop(root_address, idx)


def main():

    address = subprocess.check_output(["solana", "address"]+devnet_args).strip().decode('utf-8')
    processes = []
    print(f"Starting {PROCESSES} aidrop processes")

    for i in range(PROCESSES):
        p = multiprocessing.Process(target=airdrop, args=(address, i, ))
        p.start()
        processes.append(p)

    try:
        for p in processes:
            p.join()
    except KeyboardInterrupt:
        print("Killing processes...")
        [p.close() for p in processes]
        print("Done!")


if __name__ == "__main__":
    main()
