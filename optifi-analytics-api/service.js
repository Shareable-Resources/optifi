const { Client } = require('pg');

exports.getProgram = async function (programAddress) {
    const client = getDBClient();
    client.connect();

    const res = await client.query('SELECT * from programs WHERE address = $1 ORDER BY id LIMIT 1', [programAddress])

    return sendRes(200, res.rows[0])

}

exports.getExchange = async function () {
    const client = getDBClient();
    client.connect();

    const res = await client.query('SELECT * from instruments', [])
    let data = JSON.stringify(res.rows);
    await client.end();

    return sendRes(200, data)
}

exports.getInstruments = async function (programAddress, exchangeUUID) {
    const client = getDBClient();
    client.connect();
    // query the program id
    let res = await client.query('SELECT * from programs WHERE address = $1 ORDER BY id LIMIT 1', [programAddress])
    let program = res.rows[0]

    // query the exchange
    res = await client.query('SELECT * from exchanges WHERE program_id = $1 AND exchange_uuid = $2', [program.id, exchangeUUID])
    let exchange = res.rows[0]

    // query optifi markets
    res = await client.query('SELECT * from optifi_markets WHERE exchange_id = $1', [exchange.id])
    let optifiMarkets = res.rows

    res = await client.query('SELECT * from instruments', [])
    let instruments = res.rows
    let data = JSON.stringify(instruments);

    return sendRes(200, data)
}

exports.getInstruments2 = async function (programAddress, exchangeUUID) {
    const client = getDBClient();
    client.connect();
    // query the program id
    let res = await client.query('SELECT id from programs WHERE address = $1 ORDER BY id LIMIT 1', [programAddress])
    let program = res.rows[0]

    // query the exchange
    res = await client.query('SELECT id from exchanges WHERE program_id = $1 AND exchange_uuid = $2', [program.id, exchangeUUID])
    let exchange = res.rows[0]

    // query trading chains
    let chains = await client.query('SELECT id, asset_id from chains WHERE exchange_id=$1 AND is_trading=true', [exchange.id])

    let result = []
    for (let j = 0; j < chains.rows.length; j++) {
        let chain = chains.rows[j]
        // query the underlying asset of the chain
        let assets = await client.query('SELECT code from assets WHERE id = $1', [chain.asset_id])
        // query the instruments of the chain
        res = await client.query('SELECT * from instruments WHERE chain_id = $1', [chain.id])

        for (let i = 0; i < res.rows.length; i++) {
            let instrument = res.rows[i]
            let instrumentTypes = await client.query('SELECT code from instrument_types WHERE id = $1', [instrument.instrument_type_id])
            let market = await client.query('SELECT address from optifi_markets WHERE id = $1', [instrument.market_id])
            let marketAddress = market.rows[0].address
            let spots = await client.query('SELECT * from spots WHERE instrument_id = $1', [instrument.id])

            let bidPrice = 0
            let bidSize = 0
            let askPrice = 0
            let askSize = 0
            if (spots.rows.length > 0) {
                let spot = spots.rows[0]
                bidPrice = spot.bid
                bidSize = spot.bid_size
                askPrice = spot.ask
                askSize = spot.ask_size
            }

            result.push({
                asset: assets.rows[0].code,
                strike: instrument.strike,
                instrumentType: instrumentTypes.rows[0].code,
                bidPrice: bidPrice,
                bidSize: bidSize,
                bidOrderId: '',
                askPrice: askPrice,
                askSize: askSize,
                askOrderId: '',
                volume: 0,
                expiryDate: instrument.expiration,
                marketAddress: marketAddress,
                marketId: instrument.market_id
            })
        }
    }
    let data = JSON.stringify(result);
    await client.end();

    return sendRes(200, data)
}

exports.getInstrumentByOtifiMarketAddr = async function (otifiMarketAddr) {
    const client = getDBClient();
    client.connect();
    let res = await client.query('SELECT id from optifi_markets WHERE address=$1', [otifiMarketAddr])
    let optifiMarket = res.rows[0]
    res = await client.query('SELECT * from instruments WHERE market_id=$1', [optifiMarket.id])
    let instrument = res.rows[0]
    let instrumentTypes = await client.query('SELECT * from instrument_types WHERE id = $1', [instrument.instrument_type_id])

    let spots = await client.query('SELECT * from spots WHERE instrument_id = $1', [instrument.id])
    let bidPrice = 0
    let bidSize = 0
    let askPrice = 0
    let askSize = 0
    if (spots.rows.length > 0) {
        let spot = spots.rows[0]
        bidPrice = spot.bid
        bidSize = spot.bid_size
        askPrice = spot.ask
        askSize = spot.ask_size
    }
    let chains = await client.query('SELECT asset_id from chains WHERE id = $1', [instrument.chain_id])
    let chain = chains.rows[0]
    let assets = await client.query('SELECT code from assets WHERE id = $1', [chain.asset_id])

    let result = {
        asset: assets.rows[0].code,
        strike: instrument.strike,
        instrumentType: instrumentTypes.rows[0].code,
        bidPrice: bidPrice,
        bidSize: bidSize,
        bidOrderId: '',
        askPrice: askPrice,
        askSize: askSize,
        askOrderId: '',
        volume: 0,
        expiryDate: instrument.expiration,
        marketAddress: otifiMarketAddr,
        marketId: instrument.market_id
    }

    let data = JSON.stringify(result);

    await client.end();
    return sendRes(200, data)
}

exports.getInstrumentByOtifiMarketId = async function (programAddress, exchangeUUID, optifiMarketId) {
    const client = getDBClient();
    client.connect();
    // query the program id
    let res = await client.query('SELECT * from programs WHERE address = $1 ORDER BY id LIMIT 1', [programAddress])
    let program = res.rows[0]

    // query the exchange
    res = await client.query('SELECT * from exchanges WHERE program_id = $1 AND exchange_uuid = $2', [program.id, exchangeUUID])
    let exchange = res.rows[0]

    res = await client.query('SELECT id from optifi_markets WHERE optifi_market_id=$1 AND exchange_id=$2', [optifiMarketId, exchange.id])
    let optifiMarket = res.rows[0]

    res = await client.query('SELECT * from instruments WHERE market_id=$1', [optifiMarket.id])
    let instrument = res.rows[0] // Note that the lenght may be > 1

    let instrumentTypes = await client.query('SELECT * from instrument_types WHERE id = $1', [instrument.instrument_type_id])
    let spots = await client.query('SELECT * from spots WHERE instrument_id = $1', [instrument.id])
    let bidPrice = 0
    let bidSize = 0
    let askPrice = 0
    let askSize = 0
    if (spots.rows.length > 0) {
        let spot = spots.rows[0]
        bidPrice = spot.bid
        bidSize = spot.bid_size
        askPrice = spot.ask
        askSize = spot.ask_size
    }
    let chains = await client.query('SELECT asset_id from chains WHERE id = $1', [instrument.chain_id])
    let chain = chains.rows[0]
    let assets = await client.query('SELECT code from assets WHERE id = $1', [chain.asset_id])

    let result = {
        asset: assets.rows[0].code,
        strike: instrument.strike,
        instrumentType: instrumentTypes.rows[0].code,
        bidPrice: bidPrice,
        bidSize: bidSize,
        bidOrderId: '',
        askPrice: askPrice,
        askSize: askSize,
        askOrderId: '',
        volume: 0,
        expiryDate: instrument.expiration,
        marketAddress: optifiMarket.address,
        marketId: instrument.market_id
    }

    let data = JSON.stringify(result);
    await client.end();

    return sendRes(200, data)
}

exports.getOptifiMarkets = async function (programAddress, exchangeUUID) {
    const client = getDBClient();
    client.connect();

    // query the program id
    let res = await client.query('SELECT * from programs WHERE address = $1 ORDER BY id LIMIT 1', [programAddress])
    let program = res.rows[0]

    // query the exchange
    res = await client.query('SELECT * from exchanges WHERE program_id = $1 AND exchange_uuid = $2', [program.id, exchangeUUID])
    let exchange = res.rows[0]

    // query optifi markets
    res = await client.query('SELECT * from optifi_markets WHERE exchange_id = $1', [exchange.id])
    let result = []
    for (let i = 0; i < res.rows.length; i++) {
        let optifiMarket = res.rows[i]
        let instrumentAddress = await client.query('SELECT address from instruments WHERE market_id=$1', [optifiMarket.id])
        if (instrumentAddress.rows.length > 0) {
            optifiMarket.instrumentAddress = instrumentAddress.rows[0].address
        } else continue

        let serumMarket = await client.query('SELECT address from serum_markets WHERE id=$1', [optifiMarket.serum_market_id])
        optifiMarket.serumMarketAddress = serumMarket.rows[0].address
        result.push(optifiMarket)
    }

    let data = JSON.stringify(result);
    await client.end();

    return sendRes(200, data)
}

function getDBClient() {
    return new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
    });
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('/');
}


const sendRes = (status, body) => {
    var response = {
        statusCode: status,
        // Allows CORS here
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
            "Access-Control-Allow-Credentials": true,
            "Access-Control-Allow-Origin": "*",
            "X-Requested-With": "*"
        },
        body: body
    };
    return response;
};
