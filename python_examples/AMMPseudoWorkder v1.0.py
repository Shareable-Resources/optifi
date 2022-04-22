import sys
# sys.path.append('C:/Users/Administrator/Desktop/AMM Pseudo Code')

import numpy as np
import pandas as pd

from functions import linear_interpolation, get_two_closest_values, \
	option_price, option_delta, margin_function, option_gamma, option_speed
	
import config

###########
## SETUP ##
###########

vol = 1

dt = np.double(config.TIME_TO_MATURITY)
spot = config.SPOT
strike = np.array(config.STRIKE).reshape(1, -1)
vol_dt = config.vol['dt'].values
vol_iv = config.vol['atmMarkIV'].values
call_put_ind = np.double(config.IS_CALL)
NQUOTES = config.NQUOTES

qsize = config.QUOTE_SIZE

###################
## OPTIONS DELTA ##
###################

''' this option delta calculation is used for convenient handling of orderbook calculations'''
# get ATM IVs for option pricing
iv = []
for j in range(len(dt)):
	
	ix0, ix1 = get_two_closest_values(dt[j], vol_dt)
	tmp_iv = linear_interpolation(dt[j], vol_dt[ix0], vol_dt[ix1], vol_iv[ix0], vol_iv[ix1])
	
	iv.append(tmp_iv / 100)
	
iv = np.array(iv).reshape(1, -1)

# calc option DELTAs and market prices
# REMOVE FLOOR OF DELTA VALUES!

# TODO: I THINK WE CAN SOURCE OPTION PRICE AND DELTA VALUES FROM MARGIN CALCULATOR. MORE EFFICIENT!!!

########### NEW LINES:
'START OF NEW CODE'
cdelta_btc_raw = option_delta(spot, strike, iv, 0.0, 0.0, dt, 1)
pdelta_btc_raw = option_delta(spot, strike, iv, 0.0, 0.0, dt, 0)
# new line CALCULATE CAMMA

gamma_btc = option_gamma(spot, strike, iv, 0.0, 0.0, dt)
speed_btc = option_speed(spot, strike, iv, 0.0, 0.0, dt, gamma_btc)

cdelta_btc = cdelta_btc_raw.clip(min = config.MIN_CDELTA)
pdelta_btc = pdelta_btc_raw.clip(max = config.MAX_PDELTA)
'end OF NEW CODE'
# replace nans with 0 
cdelta_btc[np.isnan(cdelta_btc)] = 0
pdelta_btc[np.isnan(pdelta_btc)] = 0

# convert BTC deltas into spot deltas needed because we can deposit only usdc.

cdelta_usd = cdelta_btc * spot 
pdelta_usd = pdelta_btc * spot

# calculate call and put prices
cprice_usd = option_price(spot, strike, iv, 0.0, 0.0, dt, 1)
pprice_usd = option_price(spot, strike, iv, 0.0, 0.0, dt, 0)

cprice_btc = cprice_usd / spot
pprice_btc = pprice_usd / spot

#replace nans with 0
cprice_btc[np.isnan(cprice_btc)] = 0
pprice_btc[np.isnan(pprice_btc)] = 0


###########################
### TOTAL AMM LIQUIDITY ###
###########################
''' this part of delta and price calculations is used for net option premium and value calcs'''
# get base prices
delta_btc = option_delta(spot, strike, iv, 0.0, 0.0, dt, call_put_ind)
price_usd = option_price(spot, strike, iv, 0.0, 0.0, dt, call_put_ind)
delta_usd = delta_btc*spot


# calculate amm option net premium and delta values

net_option_premium = np.matmul(price_usd,config.AMM_POSITION)
net_option_delta = np.matmul(delta_btc,config.AMM_POSITION)

# calculate AMM positions and deltas
net_futures_delta = config.FUTURE_POSITION
net_delta = net_option_delta + net_futures_delta

amm_liquidity = config.AMM_USDC_BALANCE + net_option_premium 
amm_liquidity_btc = amm_liquidity/spot

#######################################
## AMM TRADING CAPACITY CALCULATIONS ##
#######################################
        
# TODO: ADD NET DELTA CALCULATIONS  

# bid and ask btc liquidity based on total AMM value and Trade capacity parameters
liq_2ask = amm_liquidity_btc + max([min([net_delta, 0]), -1 * amm_liquidity_btc * config.TRADE_CAPACITY])
liq_2bid = amm_liquidity_btc + min([max([net_delta, 0]), amm_liquidity_btc * config.TRADE_CAPACITY])	


### OLD CODE
'START OF OLD CODE'
# initialize bid and ask pricing steps

#rng_2ask = np.arange(-1 * config.NSTEP, 0)
#rng_2bid = np.arange(1, config.NSTEP + 1)


# initialize residual btc balances at each bid and ask pricing step 
#btc_2ask_old = (amm_liquidity_btc + amm_liquidity_btc * config.TRADE_CAPACITY * rng_2ask / config.NSTEP).clip(max = liq_2ask)
#btc_2bid_old = (amm_liquidity_btc + amm_liquidity_btc * config.TRADE_CAPACITY * rng_2bid / config.NSTEP).clip(min = liq_2bid)
'END OF OLD CODE'


### NEW CODE
'START OF NEW CODE'
# quote increment
#quote_inc = amm_liquidity_btc*config.TRADE_CAPACITY/config.NSTEP

quote_inc = np.ceil((amm_liquidity_btc*config.TRADE_CAPACITY/config.NSTEP)/qsize)*qsize


rng_2ask = np.arange(-1 * NQUOTES, 0)
rng_2bid = np.arange(1, NQUOTES + 1)

btc_2ask = (liq_2ask + rng_2ask*quote_inc).clip(min = amm_liquidity_btc* ( 1 - config.TRADE_CAPACITY))
btc_2bid = (liq_2bid + rng_2bid*quote_inc).clip(max = amm_liquidity_btc* ( 1 + config.TRADE_CAPACITY))


'END OF NEW CODE'

# calculate sqrt prces
liq_chng_2ask = np.sqrt(amm_liquidity_btc * amm_liquidity_btc * spot / btc_2ask)
liq_chng_2bid = np.sqrt(amm_liquidity_btc * amm_liquidity_btc * spot / btc_2bid)

#calcuulate bid and ask prices
usdtbtc_price_2ask = liq_chng_2ask * liq_chng_2ask / amm_liquidity_btc
usdtbtc_price_2bid = liq_chng_2bid * liq_chng_2bid / amm_liquidity_btc

# calculate dollar liquidity at each point
liq_usdt_2ask = (amm_liquidity_btc - btc_2ask) * usdtbtc_price_2ask + amm_liquidity
liq_usdt_2bid = (amm_liquidity_btc - btc_2bid) * usdtbtc_price_2bid + amm_liquidity

# calculate calculate change in liquidities at each price point
chng_in_pos_2ask = np.abs(btc_2ask - liq_2ask)
chng_in_pos_2bid = np.abs(btc_2bid - liq_2bid)


##############################
## TOTAL ORDERBOOK CAPACITY ##
##############################
  
# bid and ask sizes 
btc_delta_size_2ask = np.concatenate([btc_2ask[1:], liq_2ask]) - btc_2ask
btc_delta_size_2bid = btc_2bid - np.concatenate([liq_2bid, btc_2bid[:-1]])

# futures orderbook sizes
fut_total_2ask = btc_delta_size_2ask
fut_total_2bid = btc_delta_size_2bid


# total liquidity at offer
btc_total_2ask = np.flip(np.cumsum(np.flip(btc_delta_size_2ask)))
btc_total_2bid = np.cumsum(btc_delta_size_2bid)

# ASK PRICES - careful need to remove NAN rows.
quote_price_2ask = np.concatenate([
	(np.abs(usdtbtc_price_2ask[:-1] * chng_in_pos_2ask[:-1]) - np.abs(usdtbtc_price_2ask[1:] * chng_in_pos_2ask[1:])) / btc_delta_size_2ask[:-1],
	[usdtbtc_price_2ask[-1] * chng_in_pos_2ask[-1] / btc_delta_size_2ask[-1]]
	])

# BID PRICES - 
quote_price_2bid = np.concatenate([
	[usdtbtc_price_2bid[0] * chng_in_pos_2bid[0] / btc_delta_size_2bid[0]],
	(np.abs(usdtbtc_price_2bid[1:] * chng_in_pos_2bid[1:]) - np.abs(usdtbtc_price_2bid[:-1] * chng_in_pos_2bid[:-1])) / btc_delta_size_2bid[1:]
	])



###############
## ORDERBOOK ##
###############

## CALLs

# set individual option bid ask sizes
call_btc_delta_size_2ask = btc_delta_size_2ask.reshape(-1, 1) / np.abs(cdelta_btc)
call_btc_delta_size_2bid = btc_delta_size_2bid.reshape(-1, 1) / np.abs(cdelta_btc)

# remove NaNs
call_btc_delta_size_2ask[np.isinf(call_btc_delta_size_2ask)] = 0
call_btc_delta_size_2bid[np.isinf(call_btc_delta_size_2bid)] = 0

# cap max orderbook order size to MAX_ORDERBOOK_SIZE parameter
call_btc_delta_size_2ask = call_btc_delta_size_2ask.clip(max = config.MAX_ORDERBOOK_SIZE)
call_btc_delta_size_2bid = call_btc_delta_size_2bid.clip(max = config.MAX_ORDERBOOK_SIZE)

# new rounding added
'ADDED ROUNDING TO MIN QUOTE SIZE'
call_btc_delta_size_2ask = np.ceil(call_btc_delta_size_2ask/qsize)*qsize
call_btc_delta_size_2bid = np.ceil(call_btc_delta_size_2bid/qsize)*qsize


# cumulative total bid and ask sizes
call_btc_total_2ask = np.flip(np.cumsum(np.flip(call_btc_delta_size_2ask, axis = 0), axis = 0), axis = 0)
call_btc_total_2bid = np.cumsum(call_btc_delta_size_2bid, axis = 0)

##### OLD CODE
# calculate quote prices for calls 
#cprice_usd_2ask_old = option_price(quote_price_2ask.reshape(-1, 1), strike, iv, 0.0, 0.0, dt, 1)
#cprice_usd_2bid_old = option_price(quote_price_2bid.reshape(-1, 1), strike, iv, 0.0, 0.0, dt, 1)

#### NEW CODE
'START OF NEW CODE'
dS_ask = (quote_price_2ask.reshape(-1, 1)-spot)
dS_bid = (quote_price_2bid.reshape(-1, 1)-spot)

cprice_usd_2ask = cprice_usd + dS_ask*cdelta_btc_raw #+ dS_ask*dS_ask*gamma_btc/2 + dS_ask*dS_ask*dS_ask *speed_btc/6
cprice_usd_2bid = cprice_usd + dS_bid*cdelta_btc_raw #+ dS_bid*dS_bid*gamma_btc/2 + dS_bid*dS_bid*dS_bid *speed_btc/6


# replace nans with 0
cprice_usd_2ask[np.isnan(cprice_usd_2ask)] = 0
cprice_usd_2bid[np.isnan(cprice_usd_2bid)] = 0

cprice_usd_2ask[(cprice_usd_2ask < 0)] = 0
cprice_usd_2bid[(cprice_usd_2bid < 0)] = 0

'END OF NEW CODE'



# calculate btc prices if required (now we will function in USDC not in BTC - so probably not required)
cprice_btc_2ask = cprice_usd_2ask / spot
cprice_btc_2bid = cprice_usd_2bid / spot

## PUTs

# set individual put option bid ask sizes
put_btc_delta_size_2ask = np.flip(btc_delta_size_2bid.reshape(-1, 1), axis = 0) / np.abs(pdelta_btc) 
put_btc_delta_size_2bid = np.flip(btc_delta_size_2ask.reshape(-1, 1), axis = 0) / np.abs(pdelta_btc) 

#remove NaNs
put_btc_delta_size_2ask[np.isinf(put_btc_delta_size_2ask)] = 0
put_btc_delta_size_2bid[np.isinf(put_btc_delta_size_2bid)] = 0

# cap max orderbook order size to MAX_ORDERBOOK_SIZE parameter
put_btc_delta_size_2ask = put_btc_delta_size_2ask.clip(max = config.MAX_ORDERBOOK_SIZE)
put_btc_delta_size_2bid = put_btc_delta_size_2bid.clip(max = config.MAX_ORDERBOOK_SIZE)

# new rounding added
'ADDED ROUNDING TO MIN QUOTE SIZE'
put_btc_delta_size_2ask = np.ceil(put_btc_delta_size_2ask/qsize)*qsize
put_btc_delta_size_2bid = np.ceil(put_btc_delta_size_2bid/qsize)*qsize


# cumulative total bid and ask sizes
put_btc_total_2ask = np.flip(np.cumsum(np.flip(put_btc_delta_size_2ask, axis = 0), axis = 0), axis = 0)
put_btc_total_2bid = np.cumsum(put_btc_delta_size_2bid, axis = 0)

# OLD CODE
# put quote prices
#pprice_usd_2ask_old = option_price(np.flip(quote_price_2bid.reshape(-1, 1), axis = 0), strike, iv, 0.0, 0.0, dt, 0)
#pprice_usd_2bid_old = option_price(np.flip(quote_price_2ask.reshape(-1, 1), axis = 0), strike, iv, 0.0, 0.0, dt, 0)

###### NEW PUT QUOTE PRICES
dS_ask = np.flip(dS_ask, axis = 0)
dS_bid = np.flip(dS_bid, axis = 0)

'START OF NEW CODE'
pprice_usd_2ask = pprice_usd + dS_bid*pdelta_btc_raw #+ dS_bid*dS_bid*gamma_btc/2 #+ dS_bid*dS_bid*dS_bid *speed_btc/6
pprice_usd_2bid = pprice_usd + dS_ask*pdelta_btc_raw #+ dS_ask*dS_ask*gamma_btc/2 #+ dS_ask*dS_ask*dS_ask *speed_btc/6


# remove NaNs
pprice_usd_2ask[np.isnan(pprice_usd_2ask)] = 0
pprice_usd_2bid[np.isnan(pprice_usd_2bid)] = 0

pprice_usd_2ask[ (pprice_usd_2ask <0) ] = 0
pprice_usd_2bid[ (pprice_usd_2bid <0) ] = 0

'END OF NEW CODE'


# calculate btc prices if required (now we will function in USDC not in BTC - so probably not required)
pprice_btc_2ask = pprice_usd_2ask / spot
pprice_btc_2bid = pprice_usd_2bid / spot

##### filter call and put prices and sizes to match CONFIG file structure


# ASK PRICES and SIZES
btc_delta_size_2ask = call_btc_delta_size_2ask * call_put_ind + put_btc_delta_size_2ask *  ((call_put_ind-1)*-1)
price_usd_2ask = cprice_usd_2ask * call_put_ind + pprice_usd_2ask *  ((call_put_ind-1)*-1)


# BID PRICES and SIZES
btc_delta_size_2bid = call_btc_delta_size_2bid * call_put_ind + put_btc_delta_size_2bid *  ((call_put_ind-1)*-1)
price_usd_2bid = cprice_usd_2bid * call_put_ind + pprice_usd_2bid *  ((call_put_ind-1)*-1)

#### NEW CODE####
'START OF NEW LINES'

# THIS IS REPLACING PRICE QUOTES THAT ARE VERY FAR AWAY FROM OTM.
ind_ask = (price_usd_2ask==0)
ind_bid = (price_usd_2bid==0)

btc_delta_size_2ask[ind_ask] = 0
btc_delta_size_2bid[ind_bid] = 0

#test1 = price_usd_2bid[:-1,:]
#test2 = price_usd_2bid[1:,:]

#ind_ask = (btc_delta_size_2ask[1:,:] != 0 )  & (price_usd_2ask[:-1,:] < price_usd_2ask[1:,:])
#ind_bid = (btc_delta_size_2bid[:-1,:] != 0 )  & (price_usd_2bid[:-1,:] < price_usd_2bid[1:,:])

#btc_delta_size_2ask[:-1,:][ind_ask] = 0
#price_usd_2ask[:-1,:][ind_ask] = 0

#btc_delta_size_2bid[1:,:][ind_bid] = 0
#price_usd_2bid[1:,:][ind_bid] = 0


'END OF NEW LINES'

# FUTURES BID PRICES AND SIZES
'''fut_total_2ask'''
'''fut_total_2bid'''
'''quote_price_2ask'''
'''quote_price_2bid'''


''' cancel old AMM orders'''
''' send orders to orderbook'''


###############
### HEDGING ###
###############

## DELTA HEDGE POSITION IN PERP FUTURES - THIS NEEDS TO BE ADJUSTED FOR LIVE CODE, just a general idea now

if abs(net_delta) > abs(config.DELTA_LIMIT * (amm_liquidity_btc)) or config.HEDGE_IN_PROGRESS > 0:
	# if we traded most of the risk we stop hedging. set 1% / 0.1 BTC tolarance limit to stop trading 
	
	if (abs(net_delta) < config.DELTA_LIMIT * (amm_liquidity_btc) * 0.01) or  (abs(net_delta) < 0.1):
		''' cancel existing orders'''
		''' set config.HEDGE_IN_PROGRESS = 0 '''
	else:
		
		if net_delta < 0:
			fut_buy_size = round(net_delta,1)
			fut_buy_price = spot*(1+config.COST_FUT)
			''' cancel existing buy order'''
			''' send new order to the orderbook'''
		else:
			fut_sell_size = round(net_delta,1)
			fut_sell_price = spot*(1-config.COST_FUT)
			''' cancel existing buy order'''
			''' send new order to the orderbook'''
		
		'''set config.HEDGE_IN_PROGRESS = 1  '''

##################################
#### List of output of interest:
	### perpetual futures buy/sell size/buy_price
	# fut_buy_size fut_sell_size
	# fut_buy_price fut_sell_price
	
	### submit ask sizes and prices
	''' btc_delta_size_2ask price_usd_2ask'''
	
	### submit bid sizes and prices
	''' btc_delta_size_2bid price_usd_2bid'''
