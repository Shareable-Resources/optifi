###################
## CONFIGURATION ##
###################
import pandas as pd

# system timestamp
ts = 1586277382456

# quote size standard - standard increment/size of the quote
QUOTE_SIZE = 0.1


# parameter for each account to indicate if the account is being liquidated
ACCOUNT_IN_LIQUIDATION = 0 

# total USDC balance of a given account
AMM_USDC_BALANCE = 50000000
USDC_BALANCE = 50000000

# AMM TRADE CAPACITY (in Delta)
TRADE_CAPACITY = 0.25
SPOT = 46000
# future position in number of BTC (+ve = long; -ve = short)
FUTURE_POSITION = 40

# NET DELTA PARAMETER - now a placeholder for each amm
NET_DELTA = -45


#  indicator if delta hedging is in progress. 0 - not in progress; 1 - in progress
LIQUIDATION_MARGIN_MULT_TARGET = 1.3
HEDGE_IN_PROGRESS = 0 

vol = pd.DataFrame(data =
                  {'dt':        [0.0821355, 0.164271, 0.19165,  0.24407, 0.492813],
                   'atmMarkIV': [78.28,     88.65,    92.53,    95.17,   96.18]})

# delta limit for hedging
DELTA_LIMIT = 0.05

# perp futures trading cost
COST_FUT = 0.0001

# nStep to generate orderbook
NSTEP = 100
# nQuotes - number of quotes provided to orderbook at a single time (one-sided)
NQUOTES = 5

MIN_CDELTA = 0.005
MAX_PDELTA = -0.005

MAX_ORDERBOOK_SIZE = 10

RRATE = 0
DVD_YLD = 0
STRESS = 0.3

SDATE = '2020-04-01'
EDATE = '2021-11-08'

#
IV = 1.0
RATE = 0.0
DVD_YLD = 0.0 

STRIKE = [
	39000,
	42000,
	45000,
	48000,
	53000,
	58000,
	75000,
	39000,
	42000,
	45000,
	48000,
	53000,
	58000,
	75000,
	39000,
	42000,
	45000,
	48000,
	53000,
	58000,
	75000,
	39000,
	42000,
	45000,
	48000,
	53000,
	58000,
	75000
	]

TIME_TO_MATURITY = [
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0254814,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594,
	0.0446594		
	]

IS_CALL = [
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1
	]

AMM_POSITION = [
	0,
	-2,
	1,
	-1,
	0,
	3,
	6,
	-4,
	2,
	4,
	-4,
	-5,
	1,
	-4,
	0,
	1,
	0,
	-1,
	1,
	-4,
	1,
	4,
	-5,
	2,
	-3,
	4,
	-6,
	0	
	]

