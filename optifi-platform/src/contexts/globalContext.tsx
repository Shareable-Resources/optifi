import React, { Dispatch, SetStateAction } from 'react';

// types
import Context from '@optifi/optifi-sdk/lib/types/context';
import { Chain } from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';
import { PublicKey } from '@solana/web3.js';

type GlobalContextType = {
  userWallet: any;
  setUserWallet: Dispatch<SetStateAction<any>>;
  userAccountAddress: PublicKey;
  context: Context;
  setContext: Dispatch<SetStateAction<any>>;
  markets: Array<any>,
  setMarkets: Dispatch<SetStateAction<any>>,
  userWalletName: string;
  setUserWalletName: Dispatch<SetStateAction<any>>;
  callOptions: Array<Chain>;
  setCallOptions: Dispatch<SetStateAction<any>>;
  putOptions: Array<Chain>;
  setPutOptions: Dispatch<SetStateAction<any>>;
  futureOptions: Array<Chain>;
  setFutureOptions: Dispatch<SetStateAction<any>>;
  isAllAccountsInitialized: boolean;
};

const GlobalContext = React.createContext<GlobalContextType>({
  userWallet: {},
  setUserWallet: () => {},
  userAccountAddress: null as unknown as PublicKey,
  context: {} as Context,
  setContext: () => {},
  markets: [],
  setMarkets: () => {},
  userWalletName: '',
  setUserWalletName: () => {},
  callOptions: [],
  setCallOptions: () => {},
  putOptions: [],
  setPutOptions: () => {},
  futureOptions: [],
  setFutureOptions: () => {},
  isAllAccountsInitialized: false
});

export default GlobalContext;
