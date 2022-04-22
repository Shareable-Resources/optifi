import { WebsocketClient, isWsTradesEvent, RestClient, OrderbookReq, OrderSide } from "ftx-api";
import { FTX_KEY, FTX_SECRET } from "../config.json";

//orderbook capaciy - what % of available collateral x target leverage is used to post orders on the book
const ob_capacity = 0.1;
// target leverage of the market maker on ftx
const target_leverage = 2;
//max leverage allowed when transfering in between accounts
const target_leverage_max = 2.5;

// market maker spread / price mark-up 
const mm_spread = 0.0025;
// min order
const min_order = 0.1;

//cumulative
const cummulativeSum = require("cumulative-sum");

export function get_ftx_positions_webSocket(asset: string) {
  try {
    const params = {
      key: 'apikeyhere',
      secret: 'apisecrethere',
    }

    // Prepare a ws connection (connection init is automatic once ws client is instanced)
    const ws = new WebsocketClient(params);

    // append event listeners
    ws.on('response', msg => console.log('response: ', msg));
    ws.on('update', msg => {
      // use a type guard to narrow down types
      if (isWsTradesEvent(msg)) {
        // msg now is WsEventTrades
        let results = msg;
        console.log('trades event: ', results);
        //let results = JSON.parse(msg.data.toString()).result;
      } else {
        console.log('update: ', msg);
      }
    });
    ws.on('error', msg => console.log('err: ', msg));

    // Subscribe to public & private topics. Any of the following are valid:
    /*
      Option 1: specify channel using name (no params)
    */
    ws.subscribe('fills');

    /*
      Option 2: specify list of channel names (no params)
    */
    ws.subscribe(['fills', 'orders']);

    /*
      Option 3: specify channel with extra parameters
    */
    ws.subscribe({
      channel: 'trades',
      market: asset
    });

  } catch (e) {
    console.error('err: ', e);
  }
}

class FTX_client {
  private key: string;
  private secret: string;
  public client: RestClient;

  constructor(_key: string, _secret: string) {
    this.key = _key;
    this.secret = _secret;
    this.client = new RestClient(this.key, this.secret);
  }

  async get_ftx_positions_rest(asset: string) {
    try {
      const market_data = await this.client.getMarket(asset);
      console.log('getMarkets: ', market_data);
      return market_data;
    } catch (e) {
      console.error('public get method failed: ', e);
    }
  }

  async get_orderbook(params: OrderbookReq) {
    try {
      const order_book = await this.client.getOrderbook(params);
      console.log('getMarkets: ', order_book);
      return order_book;
    } catch (e) {
      console.error('public get method failed: ', e);
    }
  }

  async get_balances() {
    try {
      console.log('getBalances: ', await this.client.getBalances());
    } catch (e) {
      console.error('public get method failed: ', e);
    }
  }

  async place_ftx_order(market: string, side: OrderSide, size: number, price: number) {
    try {
      console.log('buysome: ', await this.client.placeOrder({
        market,
        side,
        type: 'market',
        size,
        price
      }));
    } catch (e) {
      console.error('buy failed: ', e);
    }
  }

  async get_account_info(){
    try {
      const account_info = await this.client.getAccount();
      console.log('get account info', account_info);
      return account_info;    
    } catch (e) {
      console.error('public get method failed: ');
    }
  }

  async cancel_order(market_name: string){
    try {
      const _cancel = await this.client.cancelOrder(market_name);
      console.log('', _cancel);
      return _cancel;    
    } catch (e) {
      console.error('Cancel order failed: ');
    }
  }
}

(async () => {

  let client = new FTX_client(FTX_KEY, FTX_SECRET);

  /// 1 read FTX account positions ///
  const account_info = await client.get_account_info();
  let fee_ftx  = account_info['takerFee'];
  let coll_ftx = account_info['collateral'];
  let coll_free_ftx = account_info['freeCollateral'];

  /// temp for testing ///
  coll_free_ftx = 500000;
  let margin_ftx = account_info['initialMarginRequirement'] + account_info['maintenanceMarginRequirement'];
  
  //placeholder for ftx position
  let pos_ftx_btcusd: number = 5;

  /// 2. Read Optifi Account postions ///
  let pos_opt_btcusd: number = 4;
  let coll_opt: number = 600000;
  let coll_free_opt: number = 200000;
  let margin_opt:number = 10000;

  /// 3. caculate Optifi account positions ///

  let trade_qty_ftx:number = pos_ftx_btcusd - pos_opt_btcusd;

  ///////////////////////////////////////////
  // 4. execute hedge on ftx

  await client.cancel_order('BTC-PERP');
  let side_ftx : OrderSide = "buy" ;

  if (trade_qty_ftx > 0){
    side_ftx = "buy";
  }
  else if (trade_qty_ftx < 0){
    side_ftx = "sell";
  }
  if (trade_qty_ftx != 0){
    try{
      let trade_ftx = await client.place_ftx_order('BTC-PERP',side_ftx, Math.abs(trade_qty_ftx),0)
    }
    catch{
      console.log('##### FTX Order to ' + side_ftx + ' '+ trade_qty_ftx.toString() + ' qty failed !!! ######');
      //TODO: BUILD CHECKS for why order might fail
    }
  }

  ///5. cancel all optifi perp future orders
  ///... or don't cancel and jsut a comparision

  ///6. code reads top FTX ordebook and liquidity
  let _params: OrderbookReq = {
    depth : 100,
    marketName : 'BTC-PERP',
  }

  let ob_ftx = await client.get_orderbook(_params);
  let ob_ftx_bids = new Array(ob_ftx['result']["bids"]);
  let ob_ftx_asks = new Array(ob_ftx['result']["asks"]);
  ob_ftx_bids = ob_ftx_bids[0];
  ob_ftx_asks = ob_ftx_asks[0];

  let price_mid = ob_ftx_asks[0][0]/2 + ob_ftx_bids[0][0]/2;

  //maximum quantity to bid/ask
  let max_qty = Math.round((ob_capacity * coll_free_ftx * target_leverage / price_mid) / min_order) * min_order;
  
  //target cummulative qty
  let one_array_ask = new Array(ob_ftx_asks.length);
  one_array_ask.fill(1*max_qty);
  let one_array_bid = new Array(ob_ftx_bids.length);
  one_array_bid.fill(1*max_qty);

  let ob_ftx_asks_cum = new Array(cummulativeSum(ob_ftx_asks.map(ob_ftx_asks => ob_ftx_asks[1])));
  ob_ftx_asks_cum = ob_ftx_asks_cum[0];
  let qty_to_ask = new Array(ob_ftx_asks_cum.map((item,index) => {return [item,one_array_ask[index]]}));
  
  let ob_ftx_bids_cum = new Array(cummulativeSum(ob_ftx_bids.map(ob_ftx_bids => ob_ftx_bids[1])));
  ob_ftx_bids_cum = ob_ftx_bids_cum[0];
  let qty_to_bid = ob_ftx_bids_cum.map((item,index) => {return [item,one_array_bid[index]]});

  //available to bid qty	
  let tmp_ask_0 = new Array;
  for(let i = 0; i < qty_to_ask[0].length - 1; i++){
    tmp_ask_0.push(qty_to_ask[0][i][0] - qty_to_ask[0][i+1][0]);
  }

  console.log(qty_to_ask);
  let qty_ask_append = new Array;
  for(let i = 0; i < qty_to_ask[0].length; i++){
    qty_ask_append.push(qty_to_ask[0][i][0]);
  }

  for(let i = 0; i < tmp_ask_0.length ; i++){
    qty_ask_append.push(tmp_ask_0[i]);
  }
  console.log(qty_ask_append);

  var tmp_bid_0 = new Array;
  for(let i = 0; i < qty_to_bid[0].length - 1; i++){
    tmp_bid_0.push(qty_to_bid[0][i][0] - qty_to_bid[0][i+1][0]);
  }

  console.log(qty_to_bid);
  var qty_bid_append = new Array;
  for(let i = 0; i < qty_to_bid[0].length; i++){
    qty_bid_append.push(qty_to_bid[0][i][0]);
  }

  for(let i = 0; i < tmp_bid_0.length ; i++){
    qty_bid_append.push(tmp_bid_0[i]);
  }
  console.log(qty_bid_append);


  var ob_ftx_asks_ceil = new Array;
  for(let i = 0; i < ob_ftx_asks.length; i++){
    ob_ftx_asks_ceil.push(Math.ceil(ob_ftx_asks[i][0] * (1+mm_spread)));
  }

  var ob_ftx_bids_floor = new Array;
  for(let i = 0; i < ob_ftx_bids.length; i++){
    ob_ftx_bids_floor.push(Math.floor(ob_ftx_bids[i][0] * (1+mm_spread)));
  }

  let ob_opt_ask = new Array(ob_ftx_asks_ceil.map((item,index) => {return [item,qty_ask_append[index]]}));
  let ob_opt_bid = new Array(ob_ftx_bids_floor.map((item,index) => {return [item,qty_bid_append[index]]}));

  console.log("##################OB_OPT_ASK####################");
  console.log(ob_opt_ask);
  console.log("##################OB_OPT_BID####################");
  console.log(ob_opt_bid);
  // 8. check ftx and optifi margin requirement
  let transfer_to_ftx = false;
  let transfer_to_opt = true;
  let required_transfer = 0;
  let transfer_avail = 0;
  let system_funds_requirement = 0;

  // seems like FTX collateral is based on the underlying - e.g. BTCUSD is based on BTC collateral requirement
  coll_free_ftx = coll_free_ftx * price_mid
  coll_ftx = coll_ftx * price_mid

  if (coll_free_ftx / margin_ftx < 0.3){
	  transfer_to_ftx = true;
  }
	
  if (coll_free_opt / margin_opt < 0.3){
	  transfer_to_ftx = true;
  }

  // 9. send wUSDC transfer from/to Optifi to/from FTX
  let transfer_avail_opt = Math.min( required_transfer, Math.max( coll_opt - margin_opt * target_leverage_max , 0));
  if (transfer_to_ftx == true && transfer_to_opt == true){
	console.log('################################################################# \
		NOT ENOUGH COLLATERAL!!!! PLEASE ADD USDC TO BOTH - FTX AND OPTIFY \
			################################################################');
  } else if (transfer_to_ftx == true){
	  required_transfer = margin_ftx * target_leverage - coll_ftx
	  system_funds_requirement = Math.max( required_transfer - transfer_avail_opt , 0 )
	
	  // SEND transfer_avail TO FTX FROM OPTIFI
	  console.log('######### PLEASE ADD FUNDS TO THE SYSTEM ' + String(system_funds_requirement) + '#################');
  }
  else if (transfer_to_opt == true){
	  required_transfer = margin_opt * target_leverage - coll_opt;
	  transfer_avail = Math.min( required_transfer, Math.max( coll_ftx - margin_ftx * target_leverage_max , 0)); 
	  system_funds_requirement = Math.max( required_transfer - transfer_avail_opt , 0 );
    
    //SEND transfer_avail TO OPTIFY FROM FTX
	  console.log('######### PLEASE ADD FUNDS TO THE SYSTEM ' + String(system_funds_requirement) + '#################');
  }
  //await client.get_ftx_positions_rest('BTC-PERP');
  //await client.get_balances();
  //await client.place_ftx_order('BTC/USD', 1, 1);
  //get_ftx_positions_webSocket('BTC-PERP');

  process.exit();
})()