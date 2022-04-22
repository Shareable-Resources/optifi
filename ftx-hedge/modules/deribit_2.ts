import { DERIBIT_KEY, DERIBIT_SECRET } from "../config.json";

const Deribit = require('deribit-v2-ws');

const key = DERIBIT_KEY;
const secret = DERIBIT_SECRET;
const domain = 'www.deribit.com';


type Instrument = {
    tick_size: number,
    taker_commission: number,
    strike: number,
    settlement_period: String,
    quote_currency: String,
    option_type: String,
    min_trade_amount: number,
    maker_commission: number,
    kind: String,
    is_active: true,
    instrument_name: String,
    expiration_timestamp: number,
    creation_timestamp: number,
    contract_size: number,
    block_trade_commission: number,
    base_currency: String
}


async function get_instruments() {

    var msg =
    {
        "jsonrpc": "2.0",
        "id": 7617,
        "method": "public/get_instruments",
        "params": {
            "currency": "BTC",
            "kind": "option",
            "expired": false
        }
    };
    var ws = new WebSocket('wss://test.deribit.com/ws/api/v2');
    ws.onmessage = function (e) {
        // do something with the response...
        let results: Instrument[] = JSON.parse(e.data.toString()).result;

        results = results.filter((result: Instrument) => result.settlement_period == "week");

        console.log(results);
    };
    ws.onopen = function () {
        ws.send(JSON.stringify(msg));

        ws.close(); // <- this closes the connection from the server
    };
}


(async () => {

    const db = new Deribit({ key, secret });

    console.log(new Date, 'connecting...');

    await db.connect();
    console.log(new Date, 'connected');

    const instrument = await db.request(
        'public/get_instruments',
        {
            "currency": "BTC",
            "kind": "option",
            "expired": false
        }
    );

    console.log('instrument:', instrument);

    await db.subscribe(
        'public',
        'deribit_price_index.btc_usd'
    );

    db.on('deribit_price_index.btc_usd', console.log);


})()