import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useColorMode } from '@chakra-ui/react';
import '../App.css';
import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGlobalState } from 'state-pool';
import { initializeContext, initializeUserAccount } from '@optifi/optifi-sdk';
import {
  findExchangeAccount,
  findUserAccount,
  getDexOpenOrders,
  userAccountExists,
} from '@optifi/optifi-sdk/lib/utils/accounts';
import {
  findOptifiMarkets,
} from '@optifi/optifi-sdk/lib/utils/market';
import {
  getSerumMarket,
} from '@optifi/optifi-sdk/lib/utils/serum';
import {
  findAssociatedTokenAccount,
  findOrCreateAssociatedTokenAccount,
} from '@optifi/optifi-sdk/lib/utils/token';
import { PublicKey } from '@solana/web3.js';
import Context from '@optifi/optifi-sdk/lib/types/context';
import { OptifiMarket } from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';
import { USDC_TOKEN_MINT } from '@optifi/optifi-sdk/lib/constants';
import { Market } from '@project-serum/serum';
import { createUserAccountIfNotExist } from '@optifi/optifi-sdk/lib/utils/accounts';

require('@solana/wallet-adapter-react-ui/styles.css');

function toFixed(x: any) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1]);
    if (e) {
        x *= Math.pow(10,e-1);
        x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
        e -= 20;
        x /= Math.pow(10,e);
        x += (new Array(e+1)).join('0');
    }
  }
  return x;
}


const WalletButton = () => {
  const { colorMode } = useColorMode();
  const [walletName, setWalletName] = useState('');
  const [context, setContext] = useGlobalState('context');
  const [orders, setOrders] = useGlobalState('orders');
  const [positions, setPositions] = useGlobalState('positions');
  const [optifiMarkets, setOptifiMarkets] = useGlobalState('optifiMarkets');
  const [serumMarkets, setSerumMarkets] = useGlobalState("serumMarkets");
  const [readyForOrderbook, setReadyForOrderbook] = useGlobalState("readyForOrderbook");
  const [bids, setBids] = useGlobalState("bids")
  const [asks, setAsks] = useGlobalState("asks")
  const [userAddress, setUserAddress] = useGlobalState("userAddress");
  const [tempBids, setTempBids] = useState<{total: string, size: number, price: number }[]>([]);
  const [tempAsks, setTempAsks] = useState<{ask: number, askSize: number }[]>([]);
  const [last, setLast] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const wallet = useWallet();

  const initWallet = async () => {
    if (
      wallet !== null &&
      wallet.publicKey !== null &&
      wallet.wallet !== null &&
      wallet.wallet.name !== walletName
    ) {
      setWalletName(wallet.wallet.name);
      //Initialize Context
      const ctx = await initializeContext(
        wallet.wallet,
        'hjo3CZHSkssq4df3uhYPEuJMdAstA6qc3EEYNDXAxvW'
      );
      setContext(ctx);
      const [key, num] = await findExchangeAccount(ctx);

      //Initialize User Account and Associated Token Account
      ctx.program.account.exchange
        .fetch(key)
        .then(async (exchange: any) => {
          const [alreadyExists, acc] = await userAccountExists(ctx);
          if (!alreadyExists) {
            //setOpen(true);
            await createUserAccountIfNotExist(ctx);
            const [userAddress, _] = await findUserAccount(ctx);
            await findOrCreateAssociatedTokenAccount(
              ctx,
              new PublicKey(USDC_TOKEN_MINT[ctx.endpoint]),
              userAddress
            );

            const markets = await findOptifiMarkets(ctx);

            setOptifiMarkets(markets);
          } else {
            findUserAccount(ctx)
              .then(([userAddress, _]) => {
                setUserAddress(userAddress);
                findOrCreateAssociatedTokenAccount(
                  ctx,
                  new PublicKey(USDC_TOKEN_MINT[ctx.endpoint]),
                  userAddress
                ).then(e => {
                  //Find Optifi Markets and Get User Orders
                  findOptifiMarkets(ctx)
                    .then(async markets => {
                      markets.forEach(async function (obj, index, collection) {
                        setTimeout(async function () {
                          await ordersRequest(ctx, obj[0], userAddress);
                        }, 1000 * (index + 1));
                      });

                      setOptifiMarkets(markets);
                    })
                    .catch(e => console.log(e));
                });
              })
              .catch(e => console.log(e));
          }
        })
        .catch(e => console.log(e));
    }
  };

  const updateOrdersAndPositions = () => {
    const updateOrders: any = [];
    const updatePositions: any = [];
    optifiMarkets.forEach(async function (obj: any, index: number, collection: any) {
      setTimeout(async function () {
        const market = await getSerumMarket(context, obj[0].serumMarket);
        /* getDexOpenOrders(context, market.address, userAddress).then(
          async ([dexOpenOrders, bump]) => {
            const openOrders = await market.loadOrdersForOwner(
              context.connection,
              dexOpenOrders
            );
            updateOrders.push(openOrders)
            if(openOrders.length > 0) console.log(openOrders)
          }
        ); */
        await getPositions(context, obj[0], userAddress, market, true, updatePositions);
        if(index + 1 === optifiMarkets.length) {
          console.log('last')
            console.log(updatePositions)
            setPositions(updatePositions);
            //setOrders(updateOrders)
        }
      }, 1500 * (index + 1));
    });
  }

  async function ordersRequest(
    ctx: Context,
    el: OptifiMarket,
    userAddress: PublicKey,
  ) {
    return new Promise(async (resolve, reject) => {
      const market = await getSerumMarket(ctx, el.serumMarket);
      getDexOpenOrders(ctx, market.address, userAddress).then(
        async ([dexOpenOrders, bump]) => {
          const openOrders = await market.loadOrdersForOwner(
            ctx.connection,
            dexOpenOrders
          );
          //else setOrders((oldOrders: any) => [...oldOrders, openOrders])
          if(openOrders.length > 0) console.log(openOrders)
        }
      );

      await getPositions(ctx, el, userAddress, market, false, []);
    });
  }

  const getPositions = async (
    ctx: Context,
    optifiMarket: OptifiMarket,
    userAccountAddress: any,
    market: Market,
    update: boolean,
    updatePositions: any
  ) => {
    const tokenAcc = await findAssociatedTokenAccount(
      ctx,
      optifiMarket.instrumentLongSplToken,
      userAccountAddress
    );
    const shortTokenAcc = await findAssociatedTokenAccount(
      ctx,
      optifiMarket.instrumentShortSplToken,
      userAccountAddress
    );
    if (tokenAcc && shortTokenAcc) {
      try{
        Promise.all([
          await ctx.connection.getTokenAccountBalance(shortTokenAcc[0]),
          await ctx.connection.getTokenAccountBalance(tokenAcc[0]),
        ]).then(async ([shortBalance, longBalance])=>{
            if (shortBalance || longBalance) {        
              
              if(shortBalance.value.uiAmount && shortBalance.value.uiAmount > 0 || longBalance.value.uiAmount && longBalance.value.uiAmount > 0) {
                console.log(shortBalance, longBalance)    
                const asks = await market.loadAsks(ctx.connection);
                const bids = await market.loadBids(ctx.connection);
      
                const inst = await ctx.program.account.chain.fetch(
                  optifiMarket.instrument
                );
                const asset = Object.keys(inst.asset)[0];
                const instrumentType = Object.keys(inst.instrumentType)[0];
                const timeInSeconds = Math.floor(
                  parseInt(inst.expiryDate.toString()) * 1000
                );
                const date = new Date(timeInSeconds);
                const dateFormatted = `${date.getFullYear()}/${(date.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
                let bidsPrice = [];
                let asksPrice = [];
                let row = {
                  name: `${asset.toUpperCase()}-${instrumentType.toUpperCase()}-${dateFormatted}`,
                  size: 0,
                  avg: 0,
                  market: 0,
                };
                
                for (let order of bids) {
                  bidsPrice.push(toFixed(order.price));
                  row.size = order.size;
                }
                for (let order of asks) {
                  asksPrice.push(toFixed(order.price));
                }
                
                //row.avg = toFixed(average(...bidsPrice));
                const sum = bidsPrice.reduce((a, b) => a + b, 0);
                row.avg = toFixed((sum / bidsPrice.length)) || 0;
                let maxBid = toFixed(Math.max(...bidsPrice));
                let minAsk = toFixed(Math.min(...asksPrice));
                if (maxBid === Infinity || minAsk === Infinity || maxBid === -Infinity || minAsk === -Infinity) {
                    row.market = 0;
                } else {
                    let diff = Math.abs(minAsk - maxBid) / 2;
                    row.market = minAsk + diff;
                }
                
                if(update) {
                  updatePositions.push(row);
                }
                else {
                  setPositions([...positions, row ])
                }            
              }
            }
          })
          .catch(err => {
            /* console.log(err) */
          });
      } catch (e) {
        /* console.log(e) */
      }
    }
  };

  async function orderbookRequest(el: PublicKey, address: string) {
    const market = await getSerumMarket(context, el);
    const orderAsks = await market.loadAsks(context.connection);
    const orderBids = await market.loadBids(context.connection);

    for (let order of orderBids) {
      let row = {
        size: -1,
        price: -1,
      };
      row.price = toFixed(order.price);
      row.size = order.size;
      setTempBids((bids: any) => [...bids, row]);
    }

    for (let order of orderAsks) {
      let row = {
        ask: -1,
        askSize: -1,
      };
      row.ask = toFixed(order.price);
      row.askSize = order.size;
      setTempAsks((asks: any) => [...asks, row]);
    }
  }

  const getOrderbook = async () => {
    if (optifiMarkets !== null) {
      optifiMarkets.forEach(function (obj: any, index: any, collection: any) {
        setTimeout(async function () {
          const el = obj[0].serumMarket;
          await orderbookRequest(el, obj[1].toBase58());
          if (index + 1 === optifiMarkets.length) setLast(true);
        }, 1000 * (index + 1));
      });
    }
  };

  useEffect(() => {
    if (
      context !== null &&
      optifiMarkets !== null &&
      readyForOrderbook === true
    ) {
      getOrderbook();
      const interval = setInterval(() => {
        getOrderbook();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [context, optifiMarkets, readyForOrderbook]);

  useEffect(() => {
    if (last) {
      setBids(tempBids);
      setAsks(tempAsks);
      setTempAsks([]);
      setTempBids([]);
      setLast(false);
    }
  }, [last]);

  useEffect(() => {
    console.log("hihi")
    if (
      wallet !== null &&
      wallet.publicKey !== null &&
      wallet.wallet !== undefined &&
      wallet.wallet !== null &&
      wallet.wallet.name !== walletName
    ) {
      initWallet();
    }
  }, [wallet]);

  useEffect(() => {
    if(optifiMarkets) {
      const interval = setInterval(() => {
        updateOrdersAndPositions();
        console.log('getting positions')
      }, 65000);
      return () => clearInterval(interval);
    }
  }, [optifiMarkets])

  return (
    <div>
      {/* <BoostrapPopup onClose={bootStrapClose} open={isOpen}/> */}
      <WalletMultiButton
        style={{
          backgroundColor: "#9C7BEE",
          color: '#FFFFFF',
        }}
      />
    </div>
  );
};

export default WalletButton;
