import { InstrumentData } from "@optifi/optifi-sdk/lib/types/optifi-exchange-types";
import console from "console";
import _ from "lodash";
import WebSocket from "ws";


const SamplingTime = 10 * 1000; // ms to get once data

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


type Trades = {
    trades: Trade[],
    has_more: boolean
}

type Trade = {
    trade_seq: number, // The sequence number of the trade within instrument
    trade_id: String, // Unique (per currency) trade identifier
    timestamp: number,
    tick_direction: number,
    price: number,
    mark_price: number,
    iv: number,
    instrument_name: String,
    index_price: number,
    direction: String,
    amount: number
}


async function get_instruments(): Promise<String[]> {

    let instrument_name: String[] = [];

    let msg =
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
    let ws = new WebSocket('wss://test.deribit.com/ws/api/v2');

    ws.onmessage = function (e) {
        // do something with the response...
        let results: Instrument[] = JSON.parse(e.data.toString()).result;

        results = results.filter((result: Instrument) => result.settlement_period == "week");

        // console.log(results);

        // Get unique maturity date

        let expiration_timestamp = results.map((result: Instrument) => result.expiration_timestamp);

        expiration_timestamp = expiration_timestamp.filter((x, i, a) => a.indexOf(x) == i).sort();

        console.log("expiration_timestamp", expiration_timestamp);

        // ADD FILTER HERE
        // results = results.filter((result: Instrument) => result.expiration_timestamp == expiration_timestamp[0]);

        // Get instrument_name

        instrument_name = results.map((result: Instrument) => result.instrument_name);

        // console.log("instrument_name", instrument_name);

        // close the connection from the server
        ws.close();
    };
    ws.onopen = function () {
        ws.send(JSON.stringify(msg));
    };

    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(instrument_name), 5000);
    });
}

var trade_id_queue: String[] = [];

async function get_deribit_trades(i: String): Promise<void> {

    let ws = new WebSocket('wss://test.deribit.com/ws/api/v2');

    ws.onmessage = function (e) {
        // do something with the response...

        let results: Trades = JSON.parse(e.data.toString()).result;

        let trades = results.trades;

        // console.log(trade);
        // console.log("trade_id_queue:", trade_id_queue);

        trades.forEach(trade => {
            if (!trade_id_queue.includes(trade.trade_id)) {

                //  Get trades here
                console.log(trade);

                trade_id_queue.push(trade.trade_id);

                if (trade_id_queue.length > 1000) {
                    trade_id_queue.shift();
                }
            }
        });
    };

    var msg =
    {
        "jsonrpc": "2.0",
        "id": 9267,
        "method": "public/get_last_trades_by_instrument",
        "params": {
            "instrument_name": i,
            "count": 10
        }
    };

    ws.onopen = function () {
        // every 100ms examine the socket and send more data
        // only if all the existing data was sent out
        setInterval(() => {
            if (ws.bufferedAmount == 0) {
                ws.send(JSON.stringify(msg));
            }
        }, 1000);

    };


    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), SamplingTime);
    });
}

(async () => {

    let instrument_name = await get_instruments();

    console.log("instrument_name.length:", instrument_name.length);


    for (let i of instrument_name) {
        await get_deribit_trades(i);
        // console.log(i);
    }
    // get_deribit_trades("BTC-21JAN22-42000-P");
    // await get_deribit_trades("BTC-PERPETUAL");

})()