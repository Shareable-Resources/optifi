install:
	# Install rustup if it doesn't already exist
	rustup --version || curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	# Install solana 
	solana --version || sh -c "$(curl -sSfL https://release.solana.com/v1.9.2/install)"
	# Install anchor-cli
	anchor-cli --version || make install-anchor
	# Install optifi Cargo dependencies
	make install-optifi
	# Copy IDL
	make idl
	# Install SDK js dependencies
	make install-sdk

install-anchor:
ifeq ($(shell uname -s),Linux)
	npm i -g @project-serum/anchor-cli
else
	cargo install --git https://github.com/project-serum/anchor --tag v0.19.0 anchor-cli --locked
endif

install-optifi:
	cd Optifi && cargo build && npm i
	
install-sdk:
	cd optifi-sdk && npm i

build:
	make build-optifi
	make idl

build-optifi:
	cd optifi && cargo build && anchor build

idl:
	cd optifi && npm run idl
	cp optifi/test/optifi-exchange-types.ts optifi-sdk/types
	cp optifi/target/idl/optifi_exchange.json optifi-sdk/idl
