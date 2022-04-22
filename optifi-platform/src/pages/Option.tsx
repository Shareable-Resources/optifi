import React, { useState, useEffect, useContext } from 'react';
import moment from 'moment';
import fromExponential from 'from-exponential';
import * as anchor from '@project-serum/anchor';

// Charka
import { Box, Grid, GridItem } from '@chakra-ui/react';

// Sdk
import {
  getSerumMarket,
  settleSerumFundsIfAnyUnsettled,
} from '@optifi/optifi-sdk/lib/utils/serum';
import {
  OptifiMarket,
  OrderSide,
} from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';
import { findUserAccount } from '@optifi/optifi-sdk/lib/utils/accounts';
import { findOrCreateAssociatedTokenAccount } from '@optifi/optifi-sdk/lib/utils/token';
import { isUserInitializedOnMarket } from '@optifi/optifi-sdk/lib/utils/market';
import cancelOrder from '@optifi/optifi-sdk/lib/instructions/cancelOrder';
import {
  formatExplorerAddress,
  SolanaEntityType,
} from '@optifi/optifi-sdk/lib/utils/debug';
import { formOrderContext } from '@optifi/optifi-sdk/lib/utils/orders';
import placeOrder from '@optifi/optifi-sdk/lib/instructions/placeOrder';
import initUserOnOptifiMarket from '@optifi/optifi-sdk/lib/instructions/initUserOnOptifiMarket';
import { initializeUserIfNotInitializedOnMarket } from '@optifi/optifi-sdk/lib/utils/market';

import { PublicKey, TransactionSignature } from '@solana/web3.js';

// Components
import OptionTable from '../components/OptionTable';
import { PositionOrder } from '../components/PositionOrder';
import { MyBalance, BalanceInterface } from '../components/MyBalance';
import { CoinTabProps } from '../components/CoinTab';
import { Position } from '../components/PositionItem';
import { OptionsFilters } from '../components/OptionsFilters';
import RecentTrades, { Trade } from '../components/RecentTrades';
import OrderHistory from '../components/OrderHistory';
import { HeaderV2 } from '../components/HeaderV2';

// Assets
import bitcoinLogo from '../assets/icons/bitcoin-logo.svg';
import ethLogo from '../assets/icons/eth-logo.svg';
import GlobalContext from '../contexts/globalContext';
import { cancelOpenOrder } from '../utils/Operations';
import { compose } from '@chakra-ui/utils';
import { OptionByDate } from '../components/OptionTable';
import { BuySellOrderModal } from '../components/BuySellOrderModal';

// context
import TradeContext from '../contexts/tradeContext';
import { format } from 'date-fns';

const coinTabs: CoinTabProps[] = [
  {
    name: 'BTC',
    price: 41412.25,
    DVOL: 75.19,
    gaining: true,
    logo: bitcoinLogo,
  },
  {
    name: 'ETH',
    price: 3412.25,
    DVOL: 83.43,
    gaining: false,
    logo: ethLogo,
  },
];

const positionsData: Position[] = [
  // {
  //   value: 92.12,
  //   profitYield: 15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Futures',
  // },
  // {
  //   value: 92.12,
  //   profitYield: 15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Options',
  // },
  // {
  //   value: 92.12,
  //   profitYield: 15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Options',
  // },
  // {
  //   value: 92.12,
  //   profitYield: 15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Options',
  // },
  // {
  //   value: 92.12,
  //   profitYield: 15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Options',
  // },
  // {
  //   value: 92.12,
  //   profitYield: 15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Futures',
  // },
  // {
  //   value: 92.12,
  //   profitYield: -15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Futures',
  // },
  // {
  //   value: 92.12,
  //   profitYield: 15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Futures',
  // },
  // {
  //   value: 92.12,
  //   profitYield: 15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Futures',
  // },
  // {
  //   value: 92.12,
  //   profitYield: 15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Futures',
  // },
  // {
  //   value: 92.12,
  //   profitYield: 15.19,
  //   maintenance: 1123.4567,
  //   positionValue: 2345.8766,
  //   entryPrice: 9.1,
  //   currentPrice: 5.6788,
  //   date: new Date(),
  //   leverage: 100,
  //   coinName: 'BTC',
  //   coinAmount: 150,
  //   longShort: 'Long',
  //   optionsOrFutures: 'Futures',
  // },
];

const callOpts: Trade[] = [
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
];
const putOpts: Trade[] = [
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Buy',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
  {
    side: 'Sell',
    options: 'BTC-220121-52000-C',
    price: 123,
    filled: 0.0002,
    time: new Date(),
  },
];

const myBalanceData: BalanceInterface = {
  amountEquity: 8907.523,
  netUnrealizedPNL: -977.4561,
  totalMaintanenceMargin: 1322.9439,
  totalInitialMargin: 0.0,
  liquidationBuffer: 7584.58,
};

function Option() {
  const [buySellModalIsOpen, setBuySellModalIsOpen] = useState(false);
  const [IVCheckbox, setIVCheckbox] = useState<boolean>(true);
  const [deltaCheckbox, setDeltaCheckbox] = useState<boolean>(true);
  const [sizeCheckbox, setSizeCheckbox] = useState<boolean>(true);
  const [positionCheckbox, setPositionCheckbox] = useState<boolean>(true);
  const [dateTab, setDateTab] = useState<string>('All');
  const { context, markets, userAccountAddress, callOptions, putOptions } =
    useContext(GlobalContext);
  const [optionsByDate, setOptionsByDate] = useState<Array<OptionByDate>>([]);
  const [filteredOptionsByDate, setFilteredOptionsByDate] = useState<
    Array<OptionByDate>
  >([]);
  const [dateList, setDateList] = useState<string[]>([]);

  const [userOpenOrders, setUserOpenOrders] = useState<Array<any> | undefined>(
    undefined
  );
  const [userPositions, setUserPositions] = useState<Array<any> | undefined>(undefined);

  useEffect(() => {
    console.log(userPositions);
  }, [userPositions]);

  const getOptionsByDate = () => {
    // combines callOptions and putOptions
    const options = callOptions.map(calls => {
      let combinedOptions = {};
      putOptions.map(puts => {
        if (
          puts.strike === calls.strike &&
          puts.expiryDate === calls.expiryDate
        ) {
          combinedOptions = {
            expiryDate: calls.expiryDate,
            callOptions: calls,
            putOptions: puts,
          };
        }
      });
      return combinedOptions;
    });

    //   divide the options by date
    let optionsByDateTemp: Array<any> = [];
    options.map((opt: any) => {
      if (
        !optionsByDateTemp.find((newOpt: any) => newOpt.id === opt.expiryDate)
      ) {
        optionsByDateTemp.push({ id: opt.expiryDate, options: [] });
      }
      let index = optionsByDateTemp.findIndex(
        (newOpt: any) => newOpt.id === opt.expiryDate
      );
      optionsByDateTemp[index].options.push(opt);
    });
    var optionsByDateAcendingTemp = optionsByDateTemp.sort((a, b) => {
      let da = new Date(a.id);
      let db = new Date(b.id);
      if (da === db) {
        return 0;
      }
      return da > db ? 1 : -1;
    });
    setOptionsByDate(optionsByDateAcendingTemp);
    setFilteredOptionsByDate(optionsByDateAcendingTemp);
  };

  const getCurrentUserPosition = async () => {
    let promises = markets.map(async (market: any) => {
      try {
        const isUserIniialized = await isUserInitializedOnMarket(
          context,
          market[1]
        );
        if (isUserIniialized === true) {
          const [longAcct, shortAcct] = await Promise.all([
            await findOrCreateAssociatedTokenAccount(
              context,
              market[0].instrumentLongSplToken,
              userAccountAddress
            ),
            await findOrCreateAssociatedTokenAccount(
              context,
              market[0].instrumentShortSplToken,
              userAccountAddress
            ),
          ]);
          const [longAmount, shortAmount] = await Promise.all([
            await context.connection.getTokenAccountBalance(longAcct),
            await context.connection.getTokenAccountBalance(shortAcct),
          ]);
          const instrument = await context.program.account.chain.fetch(
            market[0].instrument
          );
          
          const expiryDate = format(new Date(
            parseInt(instrument.expiryDate.toString()) * 1000
          ) , 'dd LLL hh:mm a');

          return {
            marketId: market[1].toString(),
            asset: instrument.asset,
            instrumentType: Object.keys(instrument.instrumentType)[0],
            expiryDate: expiryDate,
            strike: instrument.strike.toString(),
            longAmount: longAmount,
            shortAmount: shortAmount,
          };
        }
      } catch (err) {
        console.log(err);
      }
    });

    Promise.all(promises).then(
      positionsResolved => {
        // remove the markets which have no position
        let positions: Array<any> = positionsResolved.filter(
          (position: any) =>
            position !== undefined &&
            ((position.longAmount.value.uiAmount !== null &&
              position.longAmount.value.uiAmount !== 0) ||
              (position.shortAmount.value.uiAmount !== null &&
                position.shortAmount.value.uiAmount !== 0))
        );
        // re-strucuture the data for UI
        let positionItems: Array<any> = [];
        positions.map(position => {
          if (position.longAmount.value.uiAmount > 0) {
            let longPosition = {
              ...position,
              positionType: 'long',
              size: position.longAmount.value.uiAmount,
            };
            delete longPosition['longAmount'];
            delete longPosition['shortAmount'];
            positionItems.push(longPosition);
          }
          if (position.shortAmount.value.uiAmount > 0) {
            let shortPosition = {
              ...position,
              positionType: 'short',
              size: position.shortAmount.value.uiAmount,
            };
            delete shortPosition['longAmount'];
            delete shortPosition['shortAmount'];
            positionItems.push(shortPosition);
          }
        });
        setUserPositions(positionItems);
      },
      err => console.log(err)
    );
  };

  const getCurrentUserOpenOrder = async () => {
    let promises = markets.map(async (mkt: any) => {
      const serumMarket = await getSerumMarket(context, mkt[0].serumMarket);
      const myOrder: any = await serumMarket.loadOrdersForOwner(
        context.connection,
        userAccountAddress
      );
      if (myOrder.length > 0 && myOrder !== undefined) {
        let openOrders: Array<any> = [];
        await context.program.account.chain
          .fetch(mkt[0].instrument)
          .then(instrumentRes => {
            myOrder.map((order: any) => {
              order['marketAddress'] = mkt[1];
              order['price'] = fromExponential(myOrder[0].price);
              order['assets'] = Object.keys(instrumentRes.asset)[0];
              order['instrumentType'] = Object.keys(
                instrumentRes.instrumentType
              )[0];
              order['strike'] = instrumentRes.strike.toString();
              order['start'] = moment(
                parseInt(instrumentRes.start.toString()) * 1000
              ).format('MM DD YYYY');
              order['expiryDate'] = moment(
                parseInt(instrumentRes.expiryDate.toString()) * 1000
              ).format('MM DD YYYY');
              order['duration'] = instrumentRes.duration.toString();
              openOrders.push(order);
            });
          });
        return openOrders;
      }
    });
    Promise.all(promises).then(
      orders => {
        let ordersTemp: Array<any> = [];
        orders.map(order => {
          if (order !== undefined) {
            ordersTemp.push(order);
          }
        });
        let flattenArray: any | undefined = [];
        ordersTemp.forEach(order => {
          if (order !== undefined) {
            order.forEach((item: any) => {
              if (item) {
                flattenArray.push(item);
              }
            });
          }
        });
        setUserOpenOrders(flattenArray);
      },
      err => console.log(err)
    );
  };

  const placeOrderOnMarket = async (
    orderType: string,
    marketAddressString: string,
    cryptoPrice: string,
    quantity: number
  ) => {
    return new Promise(async (resolve, reject) => {
      let marketAddress = new PublicKey(marketAddressString);
      let side = orderType === 'bid' ? OrderSide.Bid : OrderSide.Ask;
      await initializeUserIfNotInitializedOnMarket(context, marketAddress);
      formOrderContext(context, marketAddress, side)
        .then((orderContext: any) => {
          context.connection
            .getTokenAccountBalance(orderContext.userMarginAccount)
            .then(tokenAmount => {
              let limit =
                  parseFloat(cryptoPrice) * 10 ** tokenAmount.value.decimals,
                maxCoinQty = quantity;
              let maxPcQty = limit * quantity;
              console.log({
                context,
                market: marketAddress,
                side,
                limit,
                maxCoinQty,
                maxPcQty,
              });
              placeOrder(
                context,
                marketAddress,
                side,
                limit,
                maxCoinQty,
                maxPcQty
              )
                .then(async res => {
                  console.log('Placed order ', res);
                  if (res.successful) {
                    setTimeout(() => {
                      settleSerumFundsIfAnyUnsettled(context, marketAddress)
                        .then(res => {
                          console.log('Got res!');
                        })
                        .catch(err => {
                          console.error(err);
                        });
                    }, 5000);
                  }
                  let transactionAddress = formatExplorerAddress(
                    context,
                    res.data as TransactionSignature,
                    SolanaEntityType.Transaction
                  );
                  resolve({
                    isSuccessful: true,
                    data: res.data,
                    transactionAddress,
                  });
                })
                .catch(err => {
                  if (err.resultType === 1) {
                    reject({
                      instruction: 'placeOrder',
                      resultType: err.resultType,
                      errorMessage:
                        'Place order failed. Please make sure you have enough USDC.',
                    });
                  }
                  reject(err);
                });
            })
            .catch(err => {
              console.error('formOrderContext err', err);
              resolve({
                ...err,
                instruction: 'formOrderContext',
              });
            });
        })
        .catch(err => {
          console.error('getTokenAccountBalance err', err);
          if (err.resultType === 1) {
            reject({
              instruction: 'getTokenAccountBalance',
              resultType: err.resultType,
              errorMessage:
                'The process of initializing user account on this market is ongoing. Please try again after a few seconds',
            });
          }
          resolve(err);
        });
    });
  };

  useEffect(() => {
    if (
      Object.getOwnPropertyNames(context).length !== 0 &&
      markets.length !== 0 &&
      userAccountAddress !== null
    ) {
      getCurrentUserOpenOrder();
      getCurrentUserPosition();
    }
  }, [context, markets, userAccountAddress]);

  useEffect(() => {
    getOptionsByDate();
  }, [callOptions, putOptions]);

  // filter Options on date tab clickChange
  useEffect(() => {
    setFilteredOptionsByDate(
      optionsByDate.filter(date => {
        if (dateTab === 'All') {
          return true;
        } else {
          return date.id === dateTab;
        }
      })
    );
  }, [dateTab]);

  // get all Dates from optionsByDate for Date Tabs
  useEffect(() => {
    const dates = optionsByDate.map(option => {
      return option.id;
    });
    setDateList(dates);
  }, [optionsByDate]);

  const tradeContextValue = {
    placeOrderOnMarket,
  };

  return (
    <>
      <TradeContext.Provider value={tradeContextValue}>
        <HeaderV2 coinTabs={coinTabs} />
        <Box>
          {/* <Tabs variant="unstyled" borderBottom="2px solid #4E5A71">
        <TabList>
          {coinTabs.map(coin => {
            return (
              <Tab
                _selected={{ bg: '#293141', boxShadow: 'none' }}
                padding="0"
                key={coin.name}
              >
                <CoinTab
                  name={coin.name}
                  price={coin.price}
                  DVOL={coin.DVOL}
                  gaining={coin.gaining}
                  logo={coin.logo}
                />
              </Tab>
            );
          })}
        </TabList>
      </Tabs> */}
          <Grid
            templateColumns={{ base: 'auto', md: 'auto 412px' }}
            borderBottom="2px solid #4E5A71"
          >
            <GridItem colSpan={1}>
              <PositionOrder
                positions={userPositions}
                openOrders={userOpenOrders}
              />
            </GridItem>
            <GridItem colSpan={1}>
              <MyBalance myBalance={myBalanceData} />
            </GridItem>
          </Grid>
          <OptionsFilters
            IVCheckbox={IVCheckbox}
            deltaCheckbox={deltaCheckbox}
            sizeCheckbox={sizeCheckbox}
            positionCheckbox={positionCheckbox}
            setIVCheckbox={setIVCheckbox}
            setDeltaCheckbox={setDeltaCheckbox}
            setSizeCheckbox={setSizeCheckbox}
            setPositionCheckbox={setPositionCheckbox}
            setDateTab={setDateTab}
            dateList={['All', ...dateList]}
          />
          <Box maxHeight="300px" overflowY="scroll">
            <OptionTable
              openOrder={userOpenOrders}
              positions={userPositions}
              optionsByDate={filteredOptionsByDate}
              dateTab={dateTab}
              showIV={IVCheckbox}
              showDelta={deltaCheckbox}
              showSize={sizeCheckbox}
            />
            <RecentTrades
              callOptions={callOpts}
              putOptions={putOpts}
              call24HourVolume={12.4759}
              put24HourVolume={10.7283}
            />
          </Box>
          <Box>
            <OrderHistory />
          </Box>
          {/* {userOpenOrders.map((order, index) => {
        return (
          <div key={index}>
            <span>Order: {`${order.orderId.toString()}`}</span>
            <Button
              onClick={() => {
                cancelOpenOrder(order, context);
              }}
            >
              Cancel
            </Button>
          </div>
        );
      })} */}
          {/* <Button
        onClick={() => {
          tempPlaceOrder();
        }}
      >
        Temp Place Order
      </Button> */}
        </Box>
        <BuySellOrderModal
          isBuy={false}
          isOpen={buySellModalIsOpen}
          setIsOpen={setBuySellModalIsOpen}
        />
      </TradeContext.Provider>
    </>
  );
}

export default Option;
