import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Text,
  Td,
  TableCaption,
  Button,
  Image,
  Box,
  Flex,
} from '@chakra-ui/react';
import '../assets/scss/_orderHistory.scss';
import putIcon from '../assets/icons/put_icon.svg';
import callIcon from '../assets/icons/call_icon.svg';
import { text } from 'stream/consumers';

type OpenOrderProps = {
  side: string;
  instrument: string;
  size: number;
  priceUSD: number | string;
  priceBTC: number | string;
  iv: number | string;
  type: string;
  orderId: number;
  undMark: number | string;
  tradeId: number;
  fees: number;
  index: string | number;
  date: string;
};

const data: OpenOrderProps[] = [
  {
    side: 'SELL',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    priceUSD: '$4,554.26',
    priceBTC: '0.1020 BTC',
    iv: '500%',
    type: 'Limit/Reduce',
    orderId: 9118613228,
    undMark: '$44,649.59',
    tradeId: 9602277750,
    fees: 0.00075,
    index: '$44,681.06',
    date: '2022-01-17 10:00:50',
  },
  {
    side: 'BUY',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    priceUSD: '$4,554.26',
    priceBTC: '0.1020 BTC',
    iv: '500%',
    type: 'Limit',
    orderId: 9118613228,
    undMark: '$44,649.59',
    tradeId: 9602277750,
    fees: 0.00075,
    index: '$44,681.06',
    date: '2022-01-17 10:00:50',
  },
  {
    side: 'SELL',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    priceUSD: '$4,554.26',
    priceBTC: '0.1020 BTC',
    iv: '500%',
    type: 'Limit',
    orderId: 9118613228,
    undMark: '$44,649.59',
    tradeId: 9602277750,
    fees: 0.00075,
    index: '$44,681.06',
    date: '2022-01-17 10:00:50',
  },
  {
    side: 'BUY',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    priceUSD: '$4,554.26',
    priceBTC: '0.1020 BTC',
    iv: '500%',
    type: 'Limit',
    orderId: 9118613228,
    undMark: '$44,649.59',
    tradeId: 9602277750,
    fees: 0.00075,
    index: '$44,681.06',
    date: '2022-01-17 10:00:50',
  },
];

const headers: string[] = [
  'Side',
  'Instrument',
  'Size',
  'Price (USD)',
  'Price (BTC)',
  'IV',
  'Type',
  'Order ID',
  'Und. Mark',
  'Trade ID',
  'Fees',
  'Index',
  'Date',
];

function TradeHistoryTable() {
  return (
    <Table
      overflow={'auto'}
      variant={'unstyled'}
      className={'purchase-history-table'}
    >
      <Thead>
        <Tr>
          {headers.map((header, index) => {
            if (header === 'Side' || header === 'Instrument') {
              return (
                <Th
                  key={index}
                  fontWeight={400}
                  fontFamily={'Almarai'}
                  fontSize={'13px'}
                  textTransform={'none'}
                  lineHeight={'16px'}
                  color={'#B2B0BC'}
                >
                  {header}
                </Th>
              );
            }
            return (
              <Th
                key={index}
                fontWeight={400}
                fontFamily={'Almarai'}
                fontSize={'13px'}
                textTransform={'none'}
                lineHeight={'16px'}
                color={'#B2B0BC'}
                textAlign={'right'}
              >
                {header}
              </Th>
            );
          })}
        </Tr>
      </Thead>
      <Tbody>
        {data.map((cell, index) => (
          <OrderCells key={index} data={cell} />
        ))}
      </Tbody>
    </Table>
  );
}

const OrderCells = ({ data }: any) => {
  return (
    <Tr
      height={'30px'}
      _hover={{
        background: '#364051',
      }}
    >
      {data.side === 'SELL' ? (
        <Td textAlign={'left'} color={'text.moneyGreen'}>
          <Text textAlign={'left'}>{data.side}</Text>
        </Td>
      ) : (
        <Td color={'text.moneyRed'}>
          <Text textAlign={'left'}>{data.side}</Text>
        </Td>
      )}

      <Td>
        <Flex>
          <Text>{data.instrument}</Text>
          {data.instrument.slice(-1) === 'C' ? (
            <Image src={callIcon} maxH={'18px'}></Image>
          ) : (
            <Image src={putIcon} maxH={'18px'}></Image>
          )}
        </Flex>
      </Td>
      <Td>{data.size}</Td>
      <Td>{data.priceUSD}</Td>
      <Td>{data.priceBTC}</Td>
      <Td>{data.iv}</Td>
      <Td>{data.type}</Td>
      <Td>{data.orderId}</Td>
      <Td>{data.undMark}</Td>
      <Td>{data.tradeId}</Td>
      <Td>{data.fees}</Td>
      <Td>{data.index}</Td>
      <Td>{data.date}</Td>
    </Tr>
  );
};

export default TradeHistoryTable;
