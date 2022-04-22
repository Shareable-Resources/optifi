import { Image } from '@chakra-ui/image';
import { Box, Flex, Grid } from '@chakra-ui/layout';
import { Table, Tbody, Td, Thead, Tr } from '@chakra-ui/table';
import callIcon from '../assets/icons/call_icon.svg';
import putIcon from '../assets/icons/put_icon.svg';
import '../assets/scss/_orderHistory.scss';
import PositionsTable from './PositionsTable';
import TradeHistoryTable from './TradeHistoryTable';
import OpenOrdersTable from './OpenOrdersTable';
import OrderHistoryTable from './OrderHistoryTable';

import React, { ReactElement, ReactNode, useState } from 'react';
import { Tabs, TabList, Tab } from '@chakra-ui/react';

export type PositionsProps = {
  instrument: string;
  size: number;
  value: number;
  avgP: number | string;
  marketP: number | string;
  liqP: number;
  pnl: number;
  initMargin: number;
  maintenanceMargin: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
};

const data: PositionsProps[] = [
  {
    instrument: 'BTC-220121-38000-C',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-P',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-C',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-P',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-C',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-P',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-C',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-P',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-C',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-P',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-C',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
  {
    instrument: 'BTC-220121-38000-P',
    size: 12.5,
    value: 12.5,
    avgP: '0.0007 BTC',
    marketP: '0.0007 BTC',
    liqP: 12.5,
    pnl: 0.0259,
    initMargin: 0,
    maintenanceMargin: 0,
    delta: 0.96,
    gamma: 0.00005,
    vega: 1.85,
    theta: -82.32,
    rho: 0.99,
  },
];
const headers = [
  'Instrument',
  'Size',
  'Value',
  'Avg. Price',
  'Market Price',
  'Est. Liq Price',
  'PNL (ROI%)',
  'Initial Margin',
  'Maintenance Margin',
  'Delta',
  'Vega',
  'Gamma',
  'Theta',
  'Rho',
  'Close',
];

const OrderHistory = () => {
  const [view, setView] = useState<string>('positions');
  const renderView = (table: string): any => {
    switch (table) {
      case 'open orders':
        return <OpenOrdersTable />;
      case 'order history':
        return <OrderHistoryTable />;
      case 'trade history':
        return <TradeHistoryTable />;
      default:
        return <PositionsTable headers={headers} data={data} />;
    }
  };

  return (
    <Box>
      <Tabs variant="unstyled" _selected={{ boxShadow: 'none' }}>
        <TabList fontSize="16px" fontWeight="700" lineHeight="28px">
          <Tab
            className="tab"
            padding="16px 0 4px 0"
            marginLeft="16px"
            fontSize="16px"
            fontWeight="700"
            textColor="GrayText"
            lineHeight="28px"
            borderBottom="2px solid transparent"
            onClick={() => setView('positions')}
            _selected={{
              borderBottom: '2px solid #9C7BEE',
              boxShadow: 'none',
              textColor: '#FFF',
            }}
          >
            Positions(BTC)
          </Tab>
          <Tab
            padding="16px 0 4px 0"
            marginLeft="16px"
            fontSize="16px"
            fontWeight="700"
            textColor="GrayText"
            lineHeight="28px"
            borderBottom="2px solid transparent"
            onClick={() => setView('open orders')}
            _selected={{
              borderBottom: '2px solid #9C7BEE',
              boxShadow: 'none',
              textColor: '#FFF',
            }}
          >
            Open Orders(BTC Options)
          </Tab>
          <Tab
            padding="16px 0 4px 0"
            marginLeft="16px"
            fontSize="16px"
            fontWeight="700"
            textColor="GrayText"
            lineHeight="28px"
            borderBottom="2px solid transparent"
            onClick={() => setView('order history')}
            _selected={{
              borderBottom: '2px solid #9C7BEE',
              boxShadow: 'none',
              textColor: '#FFF',
            }}
          >
            Order History (BTC Options)
          </Tab>
          <Tab
            padding="16px 0 4px 0"
            marginLeft="16px"
            fontSize="16px"
            fontWeight="700"
            textColor="GrayText"
            lineHeight="28px"
            borderBottom="2px solid transparent"
            onClick={() => setView('trade history')}
            _selected={{
              borderBottom: '2px solid #9C7BEE',
              boxShadow: 'none',
              textColor: '#FFF',
            }}
          >
            Trade History(BTC Options)
          </Tab>
        </TabList>
      </Tabs>
      <Flex maxH={'295px'} overflow={'auto'}>
        {renderView(view)}
      </Flex>
    </Box>
  );
};
export default OrderHistory;
