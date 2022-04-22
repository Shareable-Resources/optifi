table! {
    assets (id) {
        id -> Int4,
        code -> Varchar,
        name -> Varchar,
    }
}

table! {
    chains (id) {
        id -> Int4,
        exchange_id -> Int4,
        asset_id -> Int4,
        is_trading -> Bool,
        instrument_type_id -> Int4,
        expiration -> Nullable<Timestamp>,
        expiry_type_id -> Int4,
    }
}

table! {
    exchanges (id) {
        id -> Int4,
        program_id -> Int4,
        exchange_uuid -> Varchar,
        address -> Varchar,
    }
}

table! {
    expiry_types (id) {
        id -> Int4,
        code -> Varchar,
    }
}

table! {
    instruments (id) {
        id -> Int4,
        address -> Varchar,
        instrument_type_id -> Int4,
        chain_id -> Int4,
        strike -> Float8,
        expiration -> Nullable<Timestamp>,
        expiry_type_id -> Int4,
        start -> Date,
        contract_size -> Float8,
        market_id -> Int4,
    }
}

table! {
    instrument_types (id) {
        id -> Int4,
        code -> Varchar,
    }
}

table! {
    metrics_greeks (id) {
        id -> Int4,
        time -> Timestamp,
        instrument_id -> Int4,
        implied_vol -> Float8,
        weekly_hist_vol -> Float8,
        monthly_hist_vol -> Float8,
        delta -> Float8,
        gamma -> Float8,
    }
}

table! {
    optifi_markets (id) {
        id -> Int4,
        exchange_id -> Int4,
        serum_market_id -> Int4,
        address -> Varchar,
        short_token_address -> Varchar,
        long_token_address -> Varchar,
        optifi_market_id -> Int4,
    }
}

table! {
    orders (id) {
        id -> Int4,
        time -> Timestamp,
        transaction_id -> Varchar,
        serum_market_id -> Int4,
        instrument_id -> Int4,
        price -> Float8,
        side -> Int4,
        size -> Float8,
        fee_cost -> Float8,
        price_before_fees -> Float8,
    }
}

table! {
    programs (id) {
        id -> Int4,
        address -> Varchar,
        network -> Int4,
    }
}

table! {
    serum_markets (id) {
        id -> Int4,
        exchange_id -> Int4,
        address -> Varchar,
    }
}

table! {
    spots (id) {
        id -> Int4,
        time -> Timestamp,
        instrument_id -> Int4,
        mark -> Float8,
        bid -> Float8,
        ask -> Float8,
        bid_size -> Float8,
        ask_size -> Float8,
    }
}

joinable!(chains -> assets (asset_id));
joinable!(chains -> exchanges (exchange_id));
joinable!(chains -> expiry_types (expiry_type_id));
joinable!(chains -> instrument_types (instrument_type_id));
joinable!(exchanges -> programs (program_id));
joinable!(instruments -> chains (chain_id));
joinable!(instruments -> expiry_types (expiry_type_id));
joinable!(instruments -> instrument_types (instrument_type_id));
joinable!(instruments -> optifi_markets (market_id));
joinable!(metrics_greeks -> instruments (instrument_id));
joinable!(optifi_markets -> exchanges (exchange_id));
joinable!(optifi_markets -> serum_markets (serum_market_id));
joinable!(orders -> instruments (instrument_id));
joinable!(orders -> serum_markets (serum_market_id));
joinable!(serum_markets -> exchanges (exchange_id));
joinable!(spots -> instruments (instrument_id));

allow_tables_to_appear_in_same_query!(
    assets,
    chains,
    exchanges,
    expiry_types,
    instruments,
    instrument_types,
    metrics_greeks,
    optifi_markets,
    orders,
    programs,
    serum_markets,
    spots,
);
