import numpy as np
from scipy.stats import norm

def linear_interpolation(x, x0, x1, y0, y1):
	if x1 - x0 > 0:
		y = y0 + (x - x0) * ((y1 - y0) / (x1 - x0))
	else:
		y = y0 / 2 + y1 / 2
	return y

def get_two_closest_values(x, X):
	len_X = len(X)
	if len_X > 1:
    
		if x <= X[1]:
			return 0, 1
		elif x >= X[-2]:
			return len_X - 2, len_X - 1
		new_X = np.append(X, x)
		new_X = np.sort(new_X)
		index_x = new_X.tolist().index(x) 
		return index_x - 1, index_x
	else:
		return 0, 0

# d1 from Black Scholes pricing
def d1(spot, strike, iv, r, q, t):
	
	return (np.log(spot / strike) + (r - q + iv * iv / 2) * t) / (iv * np.sqrt(t))

# d2 from Black Scholes pricing
def d2(spot, strike, iv, r, q, t):
	
	return d1(spot, strike, iv, r, q, t) - iv * np.sqrt(t)

# black scholes pricing formula
def option_price(spot, strike, iv, r, q, t, isCall):
	# atm we calculate both puts and calls for each parameter set.
	call = spot * np.exp(-q * t) * norm.cdf(d1(spot, strike, iv, r, q, t)) - \
		strike * np.exp(-r * t) * norm.cdf(d2(spot, strike, iv, r, q, t))		
	put = call + strike * np.exp(-r * t) - spot * np.exp(-q * t)
	
	return isCall * call + (1 - isCall) * put

def option_delta(spot, strike, iv, r, q, t, isCall):
	# delta of a call
	call = norm.cdf(d1(spot, strike, iv, r, q, t))
	put = call - 1
	
	return isCall * call + (1 - isCall) * put

def option_intrinsic_value(spot, strike, isCall):
	# calculates intrinsic value of an option
    # .clip(0) is used as a function MAX[x,0]
	call = (spot - strike).clip(0)
	put = (strike - spot).clip(0)
		
	return isCall * call + (1 - isCall) * put
	
def option_reg_t_margin(spot, strike, stress, isCall):
	# calculates reg-t margin for each option (EXCLUDING OPTION PRREMIUM)
	call = (stress * spot - (strike - spot).clip(0)).clip(stress * spot / 2)
	put = (stress * spot - (spot - strike).clip(0)).clip(stress * spot / 2)
	
	return isCall * call + (1 - isCall) * put

def generate_stress_spot(spot, stress, step):
	# calculates a list of stressed spot prices
	incr = (stress / step * np.arange(step * 2 + 1)).reshape(1, -1)
	
	return spot * (1 - stress + incr)	
	
def stress_function(spot, strike, iv, r, q, t, stress, isCall, step = 5):
	
	# main values: prices, reg-t margins, delta, intrinsic values
	price = option_price(spot, strike, iv, r, q, t, isCall)
	reg_t_margin = option_reg_t_margin(spot, strike, stress, isCall)
	delta = option_delta(spot, strike, iv, r, q, t, isCall)
	intrinsic = option_intrinsic_value(spot, strike, isCall)
	
	# stresses
	stress_spot = generate_stress_spot(spot, stress, step)
	stress_price = option_price(stress_spot, strike, iv, r, q, t, isCall)
	stress_price_change = stress_price - price

	return {
		'Price': price,
		'Regulation T Margin': reg_t_margin,
		'Delta': delta,
		'Intrinsic Value': intrinsic,
		'Stress Spot': stress_spot,
		'Stress Price Delta': stress_price_change
		}

def margin_function(user, spot, t, price, intrinsic, stress_price_change):
	# calculates margin statistics for each user and his positions
	# totals
    # net contract position
	net_qty = np.sum(user)
    #net notional contract position
	notional_qty = np.sum(np.abs(user))
    # net notional position in USDT (assuming BTC/USDT or ETH/USDT spot price)
	net = net_qty * spot
	notional = notional_qty * spot
	
	# net results
	stress_result = np.min(np.matmul(np.transpose(user), stress_price_change))
	net_intrinsic = np.matmul(np.transpose(user), intrinsic).item()
	net_premium = np.matmul(np.transpose(user), price).item()
	
	# maturing contract results
	min_t = t == np.min(t[t > 0])
	
	# calculates net intrinsic value
	maturing_net_intrinsic = np.matmul(np.transpose(user * min_t), intrinsic * min_t).item()
	# calculates net premium
	maturing_premium = np.matmul(np.transpose((2 / (365 * t + 1)) * user * min_t), price * min_t).item()
	# calcualtes liquidity add on
	maturing_liquidity = np.matmul(np.transpose((2 / (365 * t + 1)) * user * min_t), intrinsic * min_t).item()
	
	# 1st margin component is a sum of 1) change in value after stress, and a minimum of net_intrincic/net premium value)
	margin_1 = np.min([stress_result + np.min([net_intrinsic, net_premium]), 0])
	# 2nd margin component is a liquidity add on for soon maturing options
	margin_2 = maturing_liquidity - net_intrinsic if maturing_liquidity < net_intrinsic and maturing_liquidity < 0 else 0
	# 3rd add on is premium add on for soon maturing options
	margin_3 = maturing_premium if maturing_premium < 0 else 0
	
	# total margin
	total_margin = margin_1 + margin_2 + margin_3
	net_leverage = net / total_margin
	notional_leverage = notional / total_margin

	return {
		'Net Position (QTY)': net_qty,
		'Total Notional Position (QTY)': notional_qty,
		'Net Position ($)': net,
		'Total Notional Position ($)': notional,
		'Stress Result': stress_result,
		'Total Net Intrinsic Value': net_intrinsic,
		'Total Net Premium Value': net_premium,
		'Maturing Contract Net Intrinsic Value': maturing_net_intrinsic,
		'Maturing Contract Premium Add-on': maturing_premium,
		'Maturing Contract Liquidity Add-on': maturing_liquidity,
		'Total Margin': total_margin,
		'Net Leverage': net_leverage,
		'Notional Leverage': notional_leverage
		}

def option_gamma(spot, strike, iv, r, q, t):
	# option gamma
	gamma = np.exp(-q * t) * norm.pdf( d1(spot, strike, iv, r, q, t) ) / (spot * iv * np.sqrt(t))
	
	return gamma


def option_speed(spot, strike, iv, r, q, t, gamma):
	# option spot
	# uses gamma parameter generated by option_gamma func as input
	speed = -gamma * (d1(spot, strike, iv, r, q, t) / iv / np.sqrt(t) + 1) / spot
	return speed