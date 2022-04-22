import pandas as pd
import requests

#get the specific futures data with asset name, e.g.YFI-0325
"""
return format
                                                 result
ask                                             34235.0
bid                                             34165.0
change1h                                      -0.000585
change24h                                      0.030449
changeBod                                      0.005886
description            Yearn.Finance March 2022 Futures
enabled                                            True
expired                                           False
expiry                        2022-03-25T03:00:00+00:00
expiryDescription                            March 2022
group                                         quarterly
imfFactor                                        0.0033
index                                        34018.6751
last                                            34175.0
lowerBound                                      32320.0
marginPrice                                     34180.0
mark                                            34180.0
moveStart                                          None
name                                           YFI-0325
openInterest                                      2.673
openInterestUsd                                91363.14
perpetual                                         False
positionLimitWeight                               100.0
postOnly                                          False
priceIncrement                                      5.0
sizeIncrement                                     0.001
type                                             future
underlying                                          YFI
underlyingDescription                     Yearn.Finance
upperBound                                      35940.0
volume                                            3.684
volumeUsd24h                                  125064.76

"""
def getFutures(asset) -> pd:
    futures = pd.DataFrame(requests.get('https://ftx.com/api/futures'+'/'+ asset).json())
    futures = futures.drop(['success'], axis = 1)
    return futures

#make the orders on FTX
def placeOrders(asset, side, price, size) -> dict:
    client = FTX_Class.FtxClient(api_key="", api_secret="")
    result = c.place_order(asset, side, price, size, "1243")
    return result
