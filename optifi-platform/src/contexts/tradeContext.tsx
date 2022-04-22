import React, { Dispatch, SetStateAction } from 'react';

type TradeContextType = {
  placeOrderOnMarket: (
    orderType: string,
    marketAddressString: string,
    cryptoPrice: string,
    quantity: number
  ) => any;
};

const TradeContext = React.createContext<TradeContextType>({
  placeOrderOnMarket: () => {},
});

export default TradeContext;
