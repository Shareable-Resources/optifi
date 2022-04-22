// REACT
import { useContext } from 'react';

// SERUM
import * as anchor from '@project-serum/anchor';

// OPTIFI SDK
import { watchSettleSerumFunds } from '@optifi/optifi-sdk/lib/utils/serum';
import { OrderSide } from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';
import cancelOrder from '@optifi/optifi-sdk/lib/instructions/cancelOrder';
import {
  formatExplorerAddress,
  SolanaEntityType,
} from '@optifi/optifi-sdk/lib/utils/debug';
import { PublicKey, TransactionSignature } from '@solana/web3.js';
import Context from '@optifi/optifi-sdk/lib/types/context';

export const cancelOpenOrder = async (
  order: {
    marketAddress: PublicKey;
    side: string;
    orderId: anchor.BN;
  },
  context: Context,
  setSuccess: any,
  disabled: any
) => {
  let market = order.marketAddress;
  let side = order.side === 'buy' ? OrderSide.Bid : OrderSide.Ask;
  let orderId = order.orderId;
  console.log(market, side, orderId);
  cancelOrder(context, market, side, orderId)
    .then(async res => {
      console.log('Cancel order ', res);
      if (res.successful) {
        setSuccess(res);
        console.log(
          formatExplorerAddress(
            context,
            res.data as TransactionSignature,
            SolanaEntityType.Transaction
          )
        );
        // @ts-ignore
        if (side === OrderSide.Bid) {
          await watchSettleSerumFunds(context, market)
            .then(res => {
              console.log('Got res!');
            })
            .catch(err => {
              console.error(err);
            });
        }
      } else {
        console.error(res);
      }
    })
    .catch(err => {
      disabled(false);
      console.error(err);
    });
};
