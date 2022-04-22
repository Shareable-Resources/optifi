-- https://dbdiagram.io/d/61f9568285022f4ee521ecce

-- Table creation
CREATE TABLE IF NOT EXISTS "programs" (
                            "id" SERIAL PRIMARY KEY,
                            "address" varchar NOT NULL,
                            "network" int NOT NULL
);


CREATE TABLE IF NOT EXISTS "exchanges" (
                             "id" SERIAL PRIMARY KEY,
                             "program_id" int NOT NULL,
                             "exchange_uuid" varchar NOT NULL,
                             "address" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "assets" (
                          "id" SERIAL PRIMARY KEY,
                          "code" varchar UNIQUE NOT NULL,
                          "name" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "instrument_types" (
                                    "id" SERIAL PRIMARY KEY,
                                    "code" varchar UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS "expiry_types" (
                                "id" SERIAL PRIMARY KEY,
                                "code" varchar UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS "serum_markets" (
                                 "id" SERIAL PRIMARY KEY,
                                 "exchange_id" int NOT NULL,
                                 "address" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "optifi_markets" (
                                  "id" SERIAL PRIMARY KEY,
                                  "exchange_id" int NOT NULL,
                                  "serum_market_id" int NOT NULL,
                                  "address" varchar NOT NULL,
                                  "underlying_address" varchar NOT NULL,
                                  "short_token_address" varchar NOT NULL,
                                  "long_token_address" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "chains" (
                          "id" SERIAL PRIMARY KEY,
                          "exchange_id" int NOT NULL,
                          "market_id" int NOT NULL,
                          "asset_id" int NOT NULL,
                          "is_trading" boolean NOT NULL,
                          "address" varchar NOT NULL,
                          "instrument_type_id" int NOT NULL,
                          "expiration" timestamp,
                          "expiry_type_id" int NOT NULL
);

CREATE TABLE IF NOT EXISTS "instruments" (
                               "id" SERIAL PRIMARY KEY,
                               "address" varchar NOT NULL,
                               "instrument_type_id" int NOT NULL,
                               "chain_id" int NOT NULL,
                               "strike" float NOT NULL,
                               "expiration" timestamp,
                               "expiry_type_id" int NOT NULL,
                               "start" date NOT NULL,
                               "contract_size" float NOT NULL
);

CREATE TABLE IF NOT EXISTS "orders" (
                          "id" SERIAL PRIMARY KEY,
                          "time" timestamp NOT NULL,
                          "transaction_id" varchar NOT NULL,
                          "serum_market_id" int NOT NULL,
                          "instrument_id" int NOT NULL,
                          "price" float NOT NULL,
                          "side" int NOT NULL,
                          "size" float NOT NULL,
                          "fee_cost" float NOT NULL,
                          "price_before_fees" float NOT NULL
);

CREATE TABLE IF NOT EXISTS "spots" (
                         "id" SERIAL PRIMARY KEY,
                         "time" timestamp NOT NULL,
                         "instrument_id" int NOT NULL,
                         "mark" float NOT NULL,
                         "bid" float NOT NULL,
                         "ask" float NOT NULL,
                         "bid_size" float NOT NULL,
                         "ask_size" float NOT NULL,
                         "total_bids" int NOT NULL,
                         "total_asks" int NOT NULL
);

CREATE TABLE IF NOT EXISTS "metrics_greeks" (
                                  "id" SERIAL PRIMARY KEY,
                                  "time" timestamp NOT NULL,
                                  "instrument_id" int NOT NULL,
                                  "implied_vol" float NOT NULL,
                                  "weekly_hist_vol" float NOT NULL,
                                  "monthly_hist_vol" float NOT NULL,
                                  "delta" float NOT NULL,
                                  "gamma" float NOT NULL
);

-- Relationships

ALTER TABLE "exchanges" ADD FOREIGN KEY ("program_id") REFERENCES "programs" ("id");

ALTER TABLE "serum_markets" ADD FOREIGN KEY ("exchange_id") REFERENCES "exchanges" ("id");

ALTER TABLE "optifi_markets" ADD FOREIGN KEY ("exchange_id") REFERENCES "exchanges" ("id");

ALTER TABLE "optifi_markets" ADD FOREIGN KEY ("serum_market_id") REFERENCES "serum_markets" ("id");

ALTER TABLE "chains" ADD FOREIGN KEY ("exchange_id") REFERENCES "exchanges" ("id");

ALTER TABLE "chains" ADD FOREIGN KEY ("market_id") REFERENCES "optifi_markets" ("id");

ALTER TABLE "chains" ADD FOREIGN KEY ("asset_id") REFERENCES "assets" ("id");

ALTER TABLE "chains" ADD FOREIGN KEY ("instrument_type_id") REFERENCES "instrument_types" ("id");

ALTER TABLE "chains" ADD FOREIGN KEY ("expiry_type_id") REFERENCES "expiry_types" ("id");

ALTER TABLE "instruments" ADD FOREIGN KEY ("instrument_type_id") REFERENCES "instrument_types" ("id");

ALTER TABLE "instruments" ADD FOREIGN KEY ("chain_id") REFERENCES "chains" ("id");

ALTER TABLE "instruments" ADD FOREIGN KEY ("expiry_type_id") REFERENCES "expiry_types" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("serum_market_id") REFERENCES "serum_markets" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("instrument_id") REFERENCES "instruments" ("id");

ALTER TABLE "spots" ADD FOREIGN KEY ("instrument_id") REFERENCES "instruments" ("id");

ALTER TABLE "metrics_greeks" ADD FOREIGN KEY ("instrument_id") REFERENCES "instruments" ("id");

-- Indexes

-- Everything that has an address should expect to be queried by it
CREATE INDEX IF NOT EXISTS programs_address_idx ON programs (address);
CREATE INDEX IF NOT EXISTS exchanges_address_idx ON exchanges (address);
CREATE INDEX IF NOT EXISTS serum_markets_address_idx on serum_markets (address);
CREATE INDEX IF NOT EXISTS optifi_markets_address_idx on optifi_markets (address);
CREATE INDEX IF NOT EXISTS optifi_markets_underlying_address_idx on optifi_markets(underlying_address);
CREATE INDEX IF NOT EXISTS optifi_markets_short_token_address_idx on optifi_markets(short_token_address);
CREATE INDEX IF NOT EXISTS optifi_markets_long_token_address_idx on optifi_markets(long_token_address);
create INDEX IF NOT EXISTS chains_address_idx on chains(address);
create INDEX IF NOT EXISTS instruments_address_idx on instruments(address);
create INDEX IF NOT EXISTS orders_tx_id_idx on orders (transaction_id);

-- Misc. single column indexes
create INDEX IF NOT EXISTS exchange_uuid_idx ON exchanges(exchange_uuid);
create INDEX IF NOT EXISTS asset_code_idx ON assets(code);
create INDEX IF NOT EXISTS instrument_type_code_idx ON instrument_types(code);
create INDEX IF NOT EXISTS expiry_type_code_idx ON expiry_types(code);
create INDEX IF NOT EXISTS serum_markets_exchange_idx ON serum_markets(exchange_id);
create INDEX IF NOT EXISTS optifi_markets_serum_market_idx ON optifi_markets(serum_market_id);
create INDEX IF NOT EXISTS optifi_markets_exchange_idx ON optifi_markets(exchange_id);
create INDEX IF NOT EXISTS instrument_chain_idx ON instruments(chain_id);
create INDEX IF NOT EXISTS orders_instrument_idx ON orders(instrument_id);
create INDEX IF NOT EXISTS orders_serum_market_idx ON orders(serum_market_id);
create INDEX IF NOT EXISTS spots_instrument_idx ON spots(instrument_id);
create INDEX IF NOT EXISTS metrics_instrument_idx ON metrics_greeks(instrument_id);


-- Datetime indexes, using BRIN
create INDEX IF NOT EXISTS chains_expiration_idx ON chains USING brin (expiration);
create INDEX IF NOT EXISTS instruments_expiration_idx ON instruments USING brin (expiration);
create INDEX IF NOT EXISTS instruments_start_idx ON instruments USING brin (start);
create INDEX IF NOT EXISTS instruments_start_expiration_idx ON instruments USING brin (start, expiration);
create INDEX IF NOT EXISTS orders_timestamp_idx ON orders USING brin (time);
create INDEX IF NOT EXISTS spots_timestamp_idx ON spots USING brin (time);
create INDEX IF NOT EXISTS metrics_timestamp_idx ON metrics_greeks USING brin (time);


