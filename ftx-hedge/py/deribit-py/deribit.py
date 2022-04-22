from deribit_api import RestClient

#recent trade of the specific futures, e.g."BTC-14JAN22"
"""
return format
'tradeId': 198936397, 
'instrument': 'BTC-14JAN22', 
'timeStamp': 1642069526269, 
'tradeSeq': 26334, 
'quantity': 21, 
'amount': 210.0, 
'price': 43933.5, 
'direction': 'buy', '
tickDirection': 3, 
'indexPrice': 43936.45
"""
def getFutures(instrument):
    deribit = RestClient(key="client_id", secret="client_secret")
    return deribit.getlasttrades(instrument)
