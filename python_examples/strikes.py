# -*- coding: utf-8 -*-
"""
Created on Thu Dec  2 11:15:30 2021

@author: NaglisVysniauskas
"""
import time
import numpy as np
from scipy.stats import norm

# volatility
vol = 0.8
# spot
spot = 52000
# current timestamp
ts = time.time()*1000
# maturity timestamp  - now just an example
mt = (time.time()+7*60*60*24)*1000

def get_strikes(spot, vol, ts, mt):
#  set volatility

	int_len_spot = len(str(round(spot)))
	
	target = spot / (10 ** (int_len_spot - 2))
	
	if target < 10:
		base_int = 1
	elif target < 20:
		base_int = 1	
	elif target < 50:
		base_int = 2.5
	elif target < 75:
		base_int = 5
	else:
		base_int = 10
	
	# maturity in yearfraction
	T = (mt-ts)/60/60/24/365/1000
	
	# initialize 9 strikes based on deltas, we can hard code inv_deltas based on below
	# deltas = np.double([0.005, 0.1, 0.25, 0.35, 0.5, 0.65, 0.75, 0.9, 0.995])
	# inv_deltas = norm.ppf(deltas) 
	inv_deltas = np.double([-2.576 , -1.282 , -0.675 , -0.385, 0.000, 0.385, 0.675, 1.282, 2.576])
	
	# adj annualized vol to maturity
	vol_adj = vol * np.sqrt(T)
	
	#calculate strike ranges. 
	strikes = np.exp(inv_deltas*vol_adj) * spot
	
	# min/max strike to atm strike range
	range_lower = strikes[4] - strikes[0] 
	range_upper = strikes[8] - strikes[4]
	
	#strike increments
	incr_lower = range_lower / 4
	incr_upper = range_upper / 4
	
	### calculate base to be used for rounding
	# integer length
	int_len_low = len(str(round(incr_lower)))
	int_len_upp = len(str(round(incr_upper)))
	
	base_low = ( 10 ** (int_len_low -1 ))* base_int
	base_upp = ( 10 ** (int_len_upp -1 ))* base_int
	
	# calculate base number to round to
	base_low = max (base_low, base_low * round (incr_lower / base_low) )
	base_upp = max (base_upp, base_upp * round (incr_upper / base_upp) )
	
	# reround again to closer 1 or 5 multiple
	base_low = ( 10 ** (int_len_low -1 )) * 5 * round (base_low / ( 10 ** (int_len_low -1 )) / 5) 
	if (base_low == 0) : 
		base_low = 10 ** (int_len_low -1)
	
	base_upp = ( 10 ** (int_len_upp -1 )) * 5 * round (base_upp / ( 10 ** (int_len_upp -1 )) / 5)
	if (base_upp == 0) :
		base_upp = 10 ** (int_len_upp -1)
	
	# base ATM
	atm = base_low * round(spot / base_low)
	
	# calcualte strikes
	strikes_out =  np.double([0,0,0,0,0,0,0,0,0])
	
	strikes_out[0] = atm - 4 * base_low
	strikes_out[1] = atm - 3 * base_low
	strikes_out[2] = atm - 2 * base_low
	strikes_out[3] = atm - 1 * base_low
	strikes_out[4] = atm
	strikes_out[5] = atm + 1 * min(base_upp, atm)
	strikes_out[6] = atm + 2 * min(base_upp, atm)
	strikes_out[7] = atm + 3 * min(base_upp, atm)
	strikes_out[8] = atm + 4 * min(base_upp, atm)
	
	return strikes_out


### TEST strike simulation
strikes = get_strikes(spot, vol, ts, mt)
