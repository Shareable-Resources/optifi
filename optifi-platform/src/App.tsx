import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import fromExponential from 'from-exponential';

import { store } from 'state-pool';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

// pages
import Landing from './pages/Landing';
import Option from './pages/Option';

import {
  WalletProvider,
  ConnectionProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  getSolflareWallet,
  getPhantomWallet,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import { Market } from '@project-serum/serum';

import './assets/scss/main.scss';
import GlobalContext from './contexts/globalContext';

// SDK related
import { initializeContext } from '@optifi/optifi-sdk';
import {
  findExchangeAccount,
  findUserAccount,
  getDexOpenOrders,
  userAccountExists,
} from '@optifi/optifi-sdk/lib/utils/accounts';
import { findOptifiMarkets } from '@optifi/optifi-sdk/lib/utils/market';
import { getSerumMarket } from '@optifi/optifi-sdk/lib/utils/serum';
import {
  findAssociatedTokenAccount,
  findOrCreateAssociatedTokenAccount,
} from '@optifi/optifi-sdk/lib/utils/token';
import { createUserAccountIfNotExist } from '@optifi/optifi-sdk/lib/utils/accounts';
import { USDC_TOKEN_MINT } from '@optifi/optifi-sdk/lib/constants';
import Context from '@optifi/optifi-sdk/lib/types/context';
import { OptifiMarket } from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';
import { Chain } from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';
import { UserAccount } from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';

const network = clusterApiUrl('devnet');
const wallets = [getPhantomWallet(), getSolflareWallet()];

store.setState('context', null);
store.setState('optifiMarkets', null);
store.setState('serumMarkets', []);
store.setState('account', null);
store.setState('user', null);
store.setState(
  'bids',
  new Array<{ total: string; size: number; price: number }>()
);
store.setState('asks', new Array<{ askSize: number; ask: number }>());
store.setState('readyForOrderbook', false);
store.setState('userAddress', null);
store.setState(
  'orders',
  new Array<{ name: string; size: number; avg: string; market: string }>()
);
store.setState(
  'positions',
  new Array<{ name: string; size: number; avg: string; market: string }>()
);

function App() {
  // **context values**
  // Defi related
  const [userWallet, setUserWallet] = useState({
    publicKey: '',
    wallet: {
      name: '',
    },
    connected: false,
  });
  const [userWalletName, setUserWalletName] = useState<string>('');
  const [userAccountAddress, setUserAccountAddress] = useState<any>(''); // type: PublicKey
  const [context, setContext] = useState<Context>({} as Context);
  const [markets, setMarkets] = useState<Array<Array<any>>>([]);
  const [callOptions, setCallOptions] = useState<Array<Chain>>([]);
  const [putOptions, setPutOptions] = useState<Array<Chain>>([]);
  const [futureOptions, setFutureOptions] = useState<Array<Chain>>([]);
  const [isAllAccountsInitialized, setIsAllAccountsInitialized] =
    useState<boolean>(false);

  const initializeOptifiMarkets: () => void = async () => {
    //Find Optifi Markets and Get User Orders
    // findOptifiMarkets(context)
    //   .then(async (mkt: Array<Array<any>>) => {
    //     setMarkets(mkt);
    //     await getOptions(context, mkt);
    //   })
    //   .catch(e => console.log(e));

    let market: any = [];
    let marketIds: any = [];
    // // 2022/02/23 - call at $1000
    let marketIdCall = new PublicKey(
      'HgRRCp5Dt18GFW8Gc9bp8hvYct37GrXnWzNUEAgetxMS'
    );
    // // 2022/03/16 - put at $1000
    let marketIdPut = new PublicKey(
      '7iVWtRYnmEctb5qau1UHUgqvU89j2AjLxDKXm6h1tLDt'
    );
    // // 2022/08/17 - call at $1000
    let marketIdCall2 = new PublicKey(
      '9qFPYPyGuNtVaZPvkHEniDjKKpTXSiJLwbbazND9PdaX'
    );
    // // 2022/08/17 - put at $1000
    let marketIdPut2 = new PublicKey(
      '9FvrJHkNggyLptsV1n546NyT6zG2ExVWyUVPpZPkpDfd'
    );

    marketIds.push(marketIdCall);
    marketIds.push(marketIdPut);
    marketIds.push(marketIdCall2);
    marketIds.push(marketIdPut2);

    const promises = marketIds.map((mktId: any) => {
      return context.program.account.optifiMarket
        .fetch(mktId)
        .then(async mkt => {
          market.push([mkt, mktId.toString()]);
        });
    });
    Promise.all(promises).then(async () => {
      setMarkets(market);
      await getOptions(context, market);
    });
  };

  const createRequiredAccounts = async (context: Context) => {
    // try {
    //   const [alreadyExists, acc] = await userAccountExists(context);
    //   if (alreadyExists) {
    //     const [userAddress, _] = await findUserAccount(context);
    //     setUserAccountAddress(userAddress);
    //     setIsAllAccountsInitialized(true);
    //   } else {
    //     const createUserAccountResult = await createUserAccountIfNotExist(
    //       context
    //     );
    //     const [userAddress, _] = await findUserAccount(context);
    //     setUserAccountAddress(userAddress);
    //     // create a margin account(aka, usdc vault) for the users to deposit funds into later
    //     const findOrCreateAssociatedTokenAccountResult =
    //       await findOrCreateAssociatedTokenAccount(
    //         context,
    //         new PublicKey(USDC_TOKEN_MINT[context.endpoint]),
    //         userAddress
    //       );
    //     console.log(findOrCreateAssociatedTokenAccountResult);
    //     setIsAllAccountsInitialized(true);
    //   }
    // } catch (err) {
    //   console.log(err);
    // }
    console.log("userAccountExists")
    userAccountExists(context)
      .then(([alreadyExists, acc]) => {
        if (alreadyExists) {
          console.log("findUserAccount")
          findUserAccount(context)
            .then(([userAddress, _]) => {
              setUserAccountAddress(userAddress);
              setIsAllAccountsInitialized(true);
            })
            .catch(err => console.log('findUserAccount err', err));
        } else {
          console.log("createUserAccountIfNotExist")
          createUserAccountIfNotExist(context)
            .then(createUserAccountResult => {
              console.log("findUserAccount");
              findUserAccount(context).then(([userAddress, _]) => {
                setUserAccountAddress(userAddress);
                // create a margin account(aka, usdc vault) for the users to deposit funds into later
                console.log("findUserAfindOrCreateAssociatedTokenAccountcount");
                findOrCreateAssociatedTokenAccount(
                  context,
                  new PublicKey(USDC_TOKEN_MINT[context.endpoint]),
                  userAddress
                )
                  .then(findOrCreateAssociatedTokenAccountResult => {
                    console.log(findOrCreateAssociatedTokenAccountResult);
                    setIsAllAccountsInitialized(true);
                  })
                  .catch(err =>
                    console.log('findOrCreateAssociatedTokenAccount err', err)
                  );
              }).catch(err=>console.log("findUserAccount err", err))
            })
            .catch(err => console.log('createUserAccountIfNotExist err', err));
        }
      })
      .catch(err => console.log('userAccountExists', err));
  };

  const getOptions = async (context: any, mkt: any) => {
    // get all Instrument
    const promises = mkt.map((marketItem: any) => {
      return context.program.account.chain
        .fetch(marketItem[0].instrument)
        .then((instrumentRes: any) => {
          // load bids and asks for each serum market
          return getSerumMarket(context, marketItem[0].serumMarket).then(
            serumMarket => {
              return Promise.all([
                serumMarket.loadAsks(context.connection),
                serumMarket.loadBids(context.connection),
              ]).then(([asks, bids]) => {
                // get serum market price
                let serumMarketPrice: number = 0;
                let bidOrders: number[] = [];
                let askOrders: number[] = [];
                for (let item of bids.items()) {
                  bidOrders.push(item.price);
                }
                for (let item of asks.items()) {
                  askOrders.push(item.price);
                }
                let maxBid = Math.max(...bidOrders);
                let minAsk = Math.min(...askOrders);
                if (
                  !(
                    maxBid === Infinity ||
                    minAsk === Infinity ||
                    maxBid === -Infinity ||
                    minAsk === -Infinity
                  )
                ) {
                  let diff = Math.abs(minAsk - maxBid) / 2;
                  serumMarketPrice = minAsk + diff;
                }
                // get expiry date
                const date = new Date(
                  Math.floor(
                    parseInt(instrumentRes.expiryDate.toString()) * 1000
                  )
                );
                const dateFormatted = `${date.getFullYear()}/${(
                  date.getMonth() + 1
                )
                  .toString()
                  .padStart(2, '0')}/${date
                  .getDate()
                  .toString()
                  .padStart(2, '0')}`;
                // @ts-ignore
                let chain = instrumentRes as Chain;
                // format the value to certain type
                let formattedChain: any = {
                  ...chain,
                  asset: '',
                  strike: '',
                  bidPrice: 0,
                  bidSize: 0,
                  bidOrderId: '',
                  askPrice: 0,
                  askSize: 0,
                  askOrderId: '',
                  volume: 0,
                  expiryDate: '',
                  marketAddress: '',
                  marketId: '',
                };
                formattedChain['instrumentType'] = Object.keys(
                  chain.instrumentType
                )[0];
                formattedChain['asset'] = chain.asset;
                formattedChain['strike'] = chain.strike.toString();
                for (let order of bids) {
                  formattedChain['bidPrice'] = fromExponential(order.price);
                  formattedChain['bidSize'] = order.size;
                  formattedChain['bidOrderId'] = order.orderId;
                }
                for (let order of asks) {
                  formattedChain['askPrice'] = fromExponential(order.price);
                  formattedChain['askSize'] = order.size;
                  formattedChain['askOrderId'] = order.orderId;
                }
                formattedChain['volume'] = serumMarketPrice;
                formattedChain['expiryDate'] = dateFormatted;
                formattedChain['marketAddress'] = marketItem[1];
                formattedChain['marketId'] = marketItem[1].toString();
                return formattedChain;
              });
            }
          );
        });
    });

    // version 1 - loop the promises
    let callArr: Array<any> = [];
    let putArr: Array<any> = [];
    let futureArr: Array<any> = [];
    for (let i = 0; i < promises.length; i++) {
      try {
        const val = await promises[i];
        switch (val.instrumentType) {
          case 'call':
            callArr.push(val);
            break;
          case 'put':
            putArr.push(val);
            break;
          case 'future':
            futureArr.push(val);
            break;
          default:
            break;
        }
      } catch (error) {
        console.log(error);
      }
    }
    setCallOptions(callArr);
    setPutOptions(putArr);
    setFutureOptions(futureArr);

    // version 2 - resolve all promises by once
    // Promise.all(promises)
    //   .then((results: Array<any>) => {
    //     let callArr: Array<any> = [];
    //     let putArr: Array<any> = [];
    //     let futureArr: Array<any> = [];
    //     results.map(opt => {
    //       switch (opt.instrumentType) {
    //         case 'call':
    //           callArr.push(opt);
    //           break;
    //         case 'put':
    //           putArr.push(opt);
    //           break;
    //         case 'future':
    //           futureArr.push(opt);
    //           break;
    //         default:
    //           break;
    //       }
    //     });
    //     setCallOptions(callArr);
    //     setPutOptions(putArr);
    //     setFutureOptions(futureArr);
    //   })
    //   .catch(e => {
    //     console.log(e);
    //   });
  };

  // Once user connect to wallet, get Context and Markets
  useEffect(() => {
    if (Object.getOwnPropertyNames(context).length !== 0) {
      initializeOptifiMarkets();
      createRequiredAccounts(context);
    }
  }, [context]);

  const globalContextValue = {
    userWallet,
    setUserWallet,
    userAccountAddress,
    context,
    setContext,
    markets,
    setMarkets,
    userWalletName,
    setUserWalletName,
    callOptions,
    setCallOptions,
    putOptions,
    setPutOptions,
    futureOptions,
    setFutureOptions,
    isAllAccountsInitialized,
  };

  return (
    <div>
      <Router>
        <ConnectionProvider endpoint={network}>
          <WalletProvider wallets={wallets} autoConnect={true}>
            <WalletModalProvider>
              <GlobalContext.Provider value={globalContextValue}>
                {/* <Header /> */}
                <Switch>
                  <Route exact path="/" component={Landing} />
                  <Route exact path="/options" component={Option} />
                </Switch>
                <Footer />
              </GlobalContext.Provider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </Router>
    </div>
  );
}

export default App;
