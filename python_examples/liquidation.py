import sys
# sys.path.append('C:/Users/Administrator/Desktop/AMM Pseudo Code')

import numpy as np
import pandas as pd

from functions import option_price, option_delta, margin_function, stress_function
	
import config

liq_target = config.LIQUIDATION_MARGIN_MULT_TARGET
# parameter to indicate if account is already in liquidation
ACCOUNT_IN_LIQUIDATION = config.ACCOUNT_IN_LIQUIDATION

# temp override
balance = 200000
#default system/exchange spot
spot = np.double(config.SPOT).reshape(-1, 1)
# strikes for each option in the master contract list
strike = np.double(config.STRIKE).reshape(-1, 1)
# time to maturity for each option in the master contract list
dt_opt = np.double(config.TIME_TO_MATURITY).reshape(-1, 1)
# implied volatilities 
iv = np.double(config.IV).reshape(-1, 1)
# call put indicator for each options in the master contract list
is_call = np.double(config.IS_CALL).reshape(-1, 1)


# other black scholes parameters - defaults from exchange master
rrate = np.double(config.RRATE).reshape(-1, 1)
dvd = np.double(config.DVD_YLD).reshape(-1, 1)
stress = np.double(config.STRESS).reshape(-1, 1)

# USER POSITIONS for each option - taking "AMM positions" as an example
positions_opt = np.double(config.AMM_POSITION).reshape(-1, 1)
# USER POSITION IN FUTURES
positions_fut = np.double(config.FUTURE_POSITION).reshape(-1, 1)
# TOTAL POSITIONS for margin calcs (futures are appended to the bottom of the array)
positions = np.concatenate([positions_opt, positions_fut], axis = 0)

# get stresses
stress_results = stress_function(
	spot, 
	strike, 
	iv,
	rrate, 
	dvd, 
	dt_opt, 
	stress, 
	is_call
	)

# implement futures positions
stress_price = stress_results['Price']
stress_intrinsic = stress_results['Intrinsic Value']
stress_spot = stress_results['Stress Spot']
stress_price_delta = stress_results['Stress Price Delta']

# calculate deltas for each instrument
delta_opt =  option_delta(spot, strike, iv, rrate, dvd, dt_opt, is_call)
delta_fut = 1

# add options and futures delta to single array
# 0 - put, 1 - call, 2 - FUTURE
instrument = np.concatenate([is_call, np.array(2).reshape(-1, 1)], axis = 0)
delta = np.concatenate([delta_opt, np.array(delta_fut).reshape(-1, 1)], axis = 0)

# add stresses for futures position at the bottom of the array
stress_price = np.concatenate([stress_price, np.array(0).reshape(-1, 1)], axis = 0)
stress_intrinsic = np.concatenate([stress_intrinsic, np.array(0).reshape(-1, 1)], axis = 0)
stress_price_delta = np.concatenate([stress_price_delta, stress_spot - spot], axis = 0)
dt = np.concatenate([dt_opt, np.array(100).reshape(-1, 1)], axis = 0)


net_stresses = np.matmul(np.transpose(positions),stress_price_delta)
worst_net_stress = np.min(net_stresses)

# WE SELECT STRESS SCENARIO WITH THE WORST LOSS (corresponding to the margin calc result)
stress_ind = net_stresses.reshape(-1) == worst_net_stress
worst_stress_array = stress_price_delta[:, stress_ind]

# create instrument index to identify assets after sorting
option_index = np.arange(1, len(positions)).reshape(-1, 1)
# add index for future contract
fut_index = max(option_index) + 1
option_index = np.concatenate([option_index, np.array(fut_index).reshape(-1, 1)], axis = 0)


#it seems we cant have a market order!!! hence.. we need to..
'''calculate affordable spot price (e.g. spot under stress up/down) '''
spot_ask = spot * 0.95
spot_bid = spot * 1.05

# if we SELL CALL we sell at SPOT_ASK thats below SPOT MID
# if we BUY CALL we buy at SPOT_BID thats above SPOT MID
# if we SELL PUT we sell at SPOT BID thats above SPOT MID
# if we BUY PUT we BUY at SPOT ASK thats below SPOT MID

# setup quote spot for puts, calls, and future
spot_quote_opt = (is_call ==0) * (positions_opt <=0 ) * spot_ask + (is_call ==0) * (positions_opt >0 ) * spot_bid + \
	(is_call ==1) * (positions_opt <=0 ) * spot_bid + (is_call ==1) * (positions_opt >0 ) * spot_ask
# setup spot for future
spot_quote_fut =  (positions_fut <=0 ) * spot_bid + (positions_fut >0 ) * spot_ask
spot_quote = np.concatenate([spot_quote_opt, np.array(spot_quote_fut).reshape(-1, 1)], axis = 0)
''' calculate put/call quote prices'''

price_quote_opt = option_price(spot_quote_opt, strike, iv, rrate, dvd, dt_opt, 0)
price_quote_fut = spot_quote_fut

price_quote = np.concatenate([price_quote_opt, np.array(price_quote_fut).reshape(-1, 1)], axis = 0)

#aggregate dataframe for all positions and instrument values under stresses
risk_array = np.concatenate([option_index, instrument ,positions, positions * delta, positions * worst_stress_array, spot_quote, price_quote], axis = 1)
# sort array by worst risk position
risk_array = risk_array[(-1 * np.abs(risk_array[:, 4])).argsort(axis = 0)] 

# margin calculation

margin = margin_function(
	positions,
	spot, 
	dt,
	stress_price, 
	stress_intrinsic, 
	stress_price_delta
	)

target_margin = -1 * (balance / liq_target)

target_risk_reduction = margin['Total Margin'] - target_margin
# target_risk_reduction = -400000

# risk reduction array to store information on how much risk is reduced by trading an instrument
reduction_arr = np.zeros((risk_array.shape[0], 1))
# risk outstanding array (placeholder for total reduced risk position)
risk_left_arr = np.zeros((risk_array.shape[0], 1))
position_chng_arr = np.zeros((risk_array.shape[0], 1))

# initialize variable to calculate total reduced risk amount after deducting trades
total_reduction_amount = 0
# loop through positions and calculate trades to reduce risk
for i in range(risk_array.shape[0]):
	
	# check if we reduced enough risk already - if so, leave loop
	# target risk reduction is -50k then total risk reduction
	if target_risk_reduction >= total_reduction_amount:
		break
	
	# extract current user positions and risk under stress
	tmp_pos = risk_array[i, 2]
	tmp_risk = risk_array[i, 4]
	
	# check if risk can be reduced by closing position
	#if risk is negative and target risk reduction is still negative we check ability to reduce
	if tmp_risk < 0 and target_risk_reduction < 0:
		
		reduction_amount = max(tmp_risk, target_risk_reduction - total_reduction_amount)	
	
	# there might be scenarios where we will need to reduce positive risk too - e.g. when we have complex long & 
	# short positions which take up lots of cash requirement due to large ITM position
	
	# TODO: we will finish developing this after MVP
	#elif tmp_risk > 0 and target_risk_reduction > 0:
	#	reduction_amount = min(tmp_risk, target_risk_reduction - total_reduction_amount)
	else:
		
		continue

	# add reduced risk to total
	position_chng_arr[i, 0] = int((tmp_risk - reduction_amount) * tmp_pos / tmp_risk ) - tmp_pos	
	
	# calculate full risk reduction amount after rounding of position
	reduction_amount = -1 * tmp_risk * position_chng_arr[i, 0] / tmp_pos	
	total_reduction_amount += reduction_amount	
	reduction_arr[i, 0] = reduction_amount
	risk_left_arr[i, 0] = tmp_risk - reduction_amount

# add risk reduction parameters to array
risk_array = np.concatenate([risk_array, reduction_arr, risk_left_arr, position_chng_arr], axis = 1)		


''' send orders at call put prices calculated '''
if (ACCOUNT_IN_LIQUIDATION == 1):
	print ("WE NEED TO CANCEL ALL EXISTING ORDERS")


# FIRST LINE OF DEFENSE - SEND ORDERS TO THE ORDERBOOK
if (balance / abs(margin['Total Margin'])) < 1:

	if (balance / abs(margin['Total Margin']) >= 0.8) :
		# send positions to orderbook
		
		'''SEND MARKET ORDER TO ORDERBOOK'''
		# quantity to send to orderbook
		print(risk_array[9,:])
		# price to send at to orderbook
		print(risk_array[6,:])
		
		
	
	elif (balance / abs(margin['Total Margin'])) >= 0.5:
		#implement netting against market maker
		#check AMM delta capacity - should be a function/call to amm contract to retreive AMM NET DELTA
		amm_delta = config.NET_DELTA
		amm_liquidity = config.AMM_USDC_BALANCE
		amm_trade_capacity = config.TRADE_CAPACITY
		
		amm_capacity_to_buy = amm_trade_capacity * amm_liquidity / spot - max(amm_delta,0)
		amm_capacity_to_sell = amm_trade_capacity * amm_liquidity / spot + min(amm_delta,0)
		
		delta_to_trade = risk_array[:,3] * (abs(risk_array[:,9]) / abs(risk_array[:,2])) 
		delta_to_trade = np.nan_to_num(delta_to_trade)
		
		if sum(delta_to_trade) >= 0 :
			if abs(sum(delta_to_trade)) < amm_capacity_to_buy:
				'''SEND ALL TRADES TO AMM'''
				QTY = risk_array[:,9]
			else:
				QTY = round( np.nan_to_num( risk_array[:,9] * sum(delta_to_trade) / amm_capacity_to_buy ), 0)
		else:
			if abs(sum(delta_to_trade)) < amm_capacity_to_sell:
				'''SEND ALL TRADES TO AMM'''
				QTY = risk_array[:,9]
			else:
				QTY = round( np.nan_to_num( risk_array[:,9] * sum(delta_to_trade) / amm_capacity_to_sell ) , 0)
				
		
		PRICE = risk_array[:,6]
		""" send QTY and PRICE to exchange master for settlement"""
		
		
	else:
		#TODO: implement netting against market makers
		# but we dont have market maker contract just yet. postponed.
		""""""
		
		"""we need to implement pro rata netting against other users - lets discuss how we do that"""
		
	# SET ACCOUNT TO LIQUIDATION MARKED AS 1
	ACCOUNT_IN_LIQUIDATION = 1
	# PROBABL NOT REQUIRED FOR NOW, LETS SEE LATER
	# calculated adj positions post trade
	#positions_adj = positions + risk_array[risk_array[:, 0].argsort(axis = 0)][:, 6].reshape(-1, 1)
	
	# calculate risk if all liquidated
	#margin_adj = margin_function(
	#	positions_adj,
	#	spot, 
	#	dt,
	#	stress_price, 
	#	stress_intrinsic, 
	#	stress_price_delta
	#	)

else:
	ACCOUNT_IN_LIQUIDATION = 0
