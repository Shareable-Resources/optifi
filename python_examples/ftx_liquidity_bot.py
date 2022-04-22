# -*- coding: utf-8 -*-
"""
Created on Mon Jan 13 10:18:20 2022

@author: NaglisVysniauskas
"""

import time
import urllib.parse
from typing import Optional, Dict, Any, List
from requests import Request, Session, Response
import hmac 
import datetime
import pandas as pd
import numpy as np
import math as math

from ciso8601 import parse_datetime

# orderbook capaciy - what % of available collateral x target leverage is used to post orders on the book
ob_capacity = 0.1
# target leverage of the market maker on ftx
target_leverage = 2
# max leverage allowed when transfering in between accounts
target_leverage_max = 2.5

# market maker spread / price mark-up 
mm_spread = 0.0025
#min order
min_order = 0.1

# setup credentials
api_key = ""
api_secret = ""
baseUrl = "https://ftx.com/api"

# FTX API module
# based on https://docs.ftx.com/?python#rest-api
class FtxApi():   
	_ENDPOINT = 'https://ftx.com/api/'

	def __init__(self, api_key=None, api_secret=None, subaccount_name=None) -> None:
		self._session = Session()
		self._api_key = api_key
		self._api_secret = api_secret
		self._subaccount_name = subaccount_name

	def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
		return self._request('GET', path, params=params)

	def _post(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
		return self._request('POST', path, json=params)
	
	def _delete(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
		return self._request('DELETE', path, json=params)

	def _request(self, method: str, path: str, **kwargs) -> Any:
		request = Request(method, self._ENDPOINT + path, **kwargs)
		self._sign_request(request)
		response = self._session.send(request.prepare())
		return self._process_response(response)

	def _sign_request(self, request: Request) -> None:
		ts = int(time.time() * 1000)
		prepared = request.prepare()
		signature_payload = f'{ts}{prepared.method}{prepared.path_url}'.encode()
		if prepared.body:
			signature_payload += prepared.body
		signature = hmac.new(self._api_secret.encode(), signature_payload, 'sha256').hexdigest()
		request.headers['FTX-KEY'] = self._api_key
		request.headers['FTX-SIGN'] = signature
		request.headers['FTX-TS'] = str(ts)
		if self._subaccount_name:
			request.headers['FTX-SUBACCOUNT'] = urllib.parse.quote(self._subaccount_name)

	def _process_response(self, response: Response) -> Any:
		try:
			data = response.json()
		except ValueError:
			response.raise_for_status()
			raise
		else:
			if not data['success']:
				raise Exception(data['error'])
			return data['result']


	def list_futures(self) -> List[dict]:
		return self._get('futures')

	def list_markets(self) -> List[dict]:
		return self._get('markets')

	def get_orderbook(self, market: str, depth: int = None) -> dict:
		response = self._get(f'markets/{market}/orderbook', {'depth': depth})
		#return pd.DataFrame(response)
		return response

	def get_trades(self, market: str) -> dict:
		return self._get(f'markets/{market}/trades')

	def get_account_info(self) -> dict:
		return self._get(f'account')

	def get_open_orders(self, market: str = None) -> List[dict]:
		return self._get(f'orders', {'market': market})
    
	def get_order_history(self, market: str = None, side: str = None, order_type: str = None, start_time: float = None, end_time: float = None) -> List[dict]:
		return self._get(f'orders/history', {'market': market, 'side': side, 'orderType': order_type, 'start_time': start_time, 'end_time': end_time})
        
	def get_conditional_order_history(self, market: str = None, side: str = None, type: str = None, order_type: str = None, start_time: float = None, end_time: float = None) -> List[dict]:
		return self._get(f'conditional_orders/history', {'market': market, 'side': side, 'type': type, 'orderType': order_type, 'start_time': start_time, 'end_time': end_time})

	def modify_order(
		self, existing_order_id: Optional[str] = None,
        existing_client_order_id: Optional[str] = None, price: Optional[float] = None,
        size: Optional[float] = None, client_order_id: Optional[str] = None,
    ) -> dict:
		assert (existing_order_id is None) ^ (existing_client_order_id is None), \
            'Must supply exactly one ID for the order to modify'
		assert (price is None) or (size is None), 'Must modify price or size of order'
		path = f'orders/{existing_order_id}/modify' if existing_order_id is not None else \
            f'orders/by_client_id/{existing_client_order_id}/modify'
		return self._post(path, {
            **({'size': size} if size is not None else {}),
            **({'price': price} if price is not None else {}),
            ** ({'clientId': client_order_id} if client_order_id is not None else {}),
        })

	def get_conditional_orders(self, market: str = None) -> List[dict]:
		return self._get(f'conditional_orders', {'market': market})

	def place_order(self, market: str, side: str, price: float, size: float, type: str = 'limit',
                    reduce_only: bool = False, ioc: bool = False, post_only: bool = False,
                    client_id: str = None) -> dict:
		return self._post('orders', {'market': market,
                                     'side': side,
                                     'price': price,
                                     'size': size,
                                     'type': type,
                                     'reduceOnly': reduce_only,
                                     'ioc': ioc,
                                     'postOnly': post_only,
                                     'clientId': client_id,
                                     })

	def place_conditional_order(
        self, market: str, side: str, size: float, type: str = 'stop',
        limit_price: float = None, reduce_only: bool = False, cancel: bool = True,
        trigger_price: float = None, trail_value: float = None
	) -> dict:
		"""
        To send a Stop Market order, set type='stop' and supply a trigger_price
        To send a Stop Limit order, also supply a limit_price
        To send a Take Profit Market order, set type='trailing_stop' and supply a trigger_price
        To send a Trailing Stop order, set type='trailing_stop' and supply a trail_value
        """
		assert type in ('stop', 'take_profit', 'trailing_stop')
		assert type not in ('stop', 'take_profit') or trigger_price is not None, \
            'Need trigger prices for stop losses and take profits'
		assert type not in ('trailing_stop',) or (trigger_price is None and trail_value is not None), \
            'Trailing stops need a trail value and cannot take a trigger price'

		return self._post('conditional_orders',
                          {'market': market, 'side': side, 'triggerPrice': trigger_price,
                           'size': size, 'reduceOnly': reduce_only, 'type': 'stop',
                           'cancelLimitOnTrigger': cancel, 'orderPrice': limit_price})

	def cancel_order(self, order_id: str) -> dict:
		return self._delete(f'orders/{order_id}')

	def cancel_orders(self, market_name: str = None, conditional_orders: bool = False,
                      limit_orders: bool = False) -> dict:
		return self._delete(f'orders', {'market': market_name,
                                        'conditionalOrdersOnly': conditional_orders,
                                        'limitOrdersOnly': limit_orders,
                                        })

	def get_fills(self) -> List[dict]:
		return self._get(f'fills')

	def get_balances(self) -> List[dict]:
		return self._get('wallet/balances')

	def get_deposit_address(self, ticker: str) -> dict:
		return self._get(f'wallet/deposit_address/{ticker}')

	def get_positions(self, show_avg_price: bool = False) -> List[dict]:
		return self._get('positions', {'showAvgPrice': show_avg_price})

	def get_position(self, name: str, show_avg_price: bool = False) -> dict:
		return next(filter(lambda x: x['future'] == name, self.get_positions(show_avg_price)), None)

	def get_all_trades(self, market: str, start_time: float = None, end_time: float = None) -> List:
		ids = set()
		limit = 100
		results = []
		while True:
			response = self._get(f'markets/{market}/trades', {
                'end_time': end_time,
                'start_time': start_time,
            })
			deduped_trades = [r for r in response if r['id'] not in ids]
			results.extend(deduped_trades)
			ids |= {r['id'] for r in deduped_trades}
			print(f'Adding {len(response)} trades with end time {end_time}')
			if len(response) == 0:
				break
			end_time = min(parse_datetime(t['time']) for t in response).timestamp()
			if len(response) < limit:
				break
		return results



coin = FtxApi(api_key=api_key, api_secret=api_secret, subaccount_name=None)
 

# initial simple back-to-back MM flow
# 1. read FTX account positions
# 2. read Optifi account positions
# 3. calculate futures position mismatch: FTX - Opfity
# 4. send buy/sell market order to FTX to offset position mismatch
# 5. cancel optifi buys and sell
# 6. code reads top FTX orderbook and liquidity
# 7. code sends new orders to optifi orderbook
# 8. check ftx and optifi margin requirement
# 9. send wUSDC transfer from/to Optifi to/from FTX



###################################
### 1 read FTX account positions
port = coin.get_account_info()
fee_ftx = port['takerFee']
coll_ftx = port['collateral']
coll_free_ftx = port['freeCollateral']


'#### !!!!!!!!  temp for testing ####'
coll_free_ftx = 500000
margin_ftx = port['initialMarginRequirement'] + port['maintenanceMarginRequirement']

# placeholder for ftx position
pos_ftx_btcusd = 5

#####################################
### 2. read Optifi account positions

# placeholder for optifi position
pos_opt_btcusd = 4 # number of contracts held in BTC-PERP future
coll_opt = 600000 # usdc value of collateral held on optify
coll_free_opt = 200000 # available usdc collateral for trading on optify (coll_opt - margin requirement)
margin_opt = 10000 # margin requirement in USDC on optify

#### 3. calcualte futures position mismatch

trade_qty_ftx = pos_ftx_btcusd - pos_opt_btcusd

#####################################
### 4. execute hedge on ftx

# cancel existing trades (if any)
cancel_ftx = coin.cancel_orders(market_name = "BTC-PERP")

# send market order to buy/sell
if trade_qty_ftx > 0:
	side_ftx = "buy" 
	
elif trade_qty_ftx <0:
	side_ftx = "sell"
	
if (trade_qty_ftx != 0):
	try:
		trade_ftx = coin.place_order(market = "BTC-PERP", side = side_ftx, \
							 price = "null", size = abs(trade_qty_ftx), type = "market")
	except:
		print('##### FTX Order to ' + side_ftx + ' '+ str(trade_qty_ftx) + ' qty failed !!! ######')
		# TODO: BUILD CHECKS for why order might fail

#####################################
### 5. cancel all optifi perp future orders
###... or dont cancel and just do a comparison


### 6. code reads top FTX orderbook and liquidity
ob_ftx = coin.get_orderbook("BTC-PERP",100)

ob_ftx_ask = pd.DataFrame(ob_ftx['asks'])
ob_ftx_bid = pd.DataFrame(ob_ftx['bids'])

price_mid = ob_ftx_ask[0][0]/2 + ob_ftx_bid[0][0]/2

# maximum quantity to bid/ask 
max_qty = round( (ob_capacity * coll_free_ftx * target_leverage / price_mid)  /  min_order) * min_order

# target cummulative qty
qty_to_ask = np.column_stack((np.cumsum(ob_ftx_ask[1]) , np.ones(len(ob_ftx_ask))*max_qty)).min(axis=1)
qty_to_bid = np.column_stack((np.cumsum(ob_ftx_bid[1]), np.ones(len(ob_ftx_bid))*max_qty)).min(axis=1)

# available to bid qty	
qty_to_ask = np.append(qty_to_ask[0],qty_to_ask[1:] - qty_to_ask[:-1])
qty_to_bid = np.append(qty_to_bid[0],qty_to_bid[1:] - qty_to_bid[:-1])

ob_opt_ask = np.column_stack( (np.ceil( (ob_ftx_ask[0]) * (1+mm_spread) ) , qty_to_ask))
ob_opt_bid = np.column_stack( (np.floor( (ob_ftx_bid[0]) * (1-mm_spread) ), qty_to_bid))

#####################################
#### orders to be sent to OPTIFI
ob_opt_ask = ob_opt_ask[(ob_opt_ask[:,1] > 0), : ]
ob_opt_bid = ob_opt_bid[(ob_opt_bid[:,1] > 0 ), : ]



# 8. check ftx and optifi margin requirement
transfer_to_ftx = False
transfer_to_opt = False
required_transfer = 0
transfer_avail = 0
system_funds_requirement = 0

# seems like FTX collateral is based on the underlying - e.g. BTCUSD is based on BTC collateral requirement
coll_free_ftx = coll_free_ftx * price_mid
coll_ftx = coll_ftx * price_mid

if coll_free_ftx / margin_ftx < 0.3:
	transfer_to_ftx = True
	
if coll_free_opt / margin_opt < 0.3:
	transfer_to_ftx = True

# 9. send wUSDC transfer from/to Optifi to/from FTX

if (transfer_to_ftx == True and transfer_to_opt == True):
	print('################################################################# \
		NOT ENOUGH COLLATERAL!!!! PLEASE ADD USDC TO BOTH - FTX AND OPTIFY \
			################################################################')

elif transfer_to_ftx == True:
	required_transfer = margin_ftx * target_leverage - coll_ftx
	transfer_avail_opt = min( required_transfer, max( coll_opt - margin_opt * target_leverage_max , 0)) 
	system_funds_requirement = max( required_transfer - transfer_avail_opt , 0 )
	
	# SEND transfer_avail TO FTX FROM OPTIFY
		
	print ('######### PLEASE ADD FUNDS TO THE SYSTEM ' + str(system_funds_requirement) + '#################')
	
elif transfer_to_opt == True:
	required_transfer = margin_opt * target_leverage - coll_opt
	transfer_avail = min( required_transfer, max( coll_ftx - margin_ftx * target_leverage_max , 0)) 
	system_funds_requirement = max( required_transfer - transfer_avail_opt , 0 )
	
	# SEND transfer_avail TO OPTIFY FROM FTX
	print ('######### PLEASE ADD FUNDS TO THE SYSTEM ' + str(system_funds_requirement) + '#################')
	

