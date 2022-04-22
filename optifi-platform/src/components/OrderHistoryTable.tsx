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
  price: number | string;
  completed: number;
  status: string;
  avgP: number | string;
  orderId: number;
  date: string;
  fees: number;
  pnl: number;
  type: string;
  tif: string;
};

const data: OpenOrderProps[] = [
  {
    side: 'SELL',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    price: '0.2220 BTC',
    completed: 2.5,
    status: 'filled',
    avgP: '0.1020 BTC',
    orderId: 9118613228,
    date: '2022-01-17 10:00:50',
    fees: 0.00075,
    pnl: -0.098,
    type: 'Limit/Reduce',
    tif: 'GTC',
  },
  {
    side: 'BUY',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    price: '0.2220 BTC',
    completed: 2.5,
    status: 'filled',
    avgP: '0.1020 BTC',
    orderId: 9118613228,
    date: '2022-01-17 10:00:50',
    fees: 0.00075,
    pnl: -0.098,
    type: 'Limit',
    tif: 'GTC',
  },
  {
    side: 'SELL',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    price: '0.2220 BTC',
    completed: 2.5,
    status: 'filled',
    avgP: '0.1020 BTC',
    orderId: 9118613228,
    date: '2022-01-17 10:00:50',
    fees: 0.00075,
    pnl: -0.098,
    type: 'Limit',
    tif: 'GTC',
  },
  {
    side: 'BUY',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    price: '0.2220 BTC',
    completed: 2.5,
    status: 'filled',
    avgP: '0.1020 BTC',
    orderId: 9118613228,
    date: '2022-01-17 10:00:50',
    fees: 0.00075,
    pnl: -0.098,
    type: 'Limit',
    tif: 'GTC',
  },
];

const headers: string[] = [
  'Side',
  'Instrument',
  'Size',
  'Price',
  'Completed',
  'Status',
  'Order ID',
  'Date',
  'Fees',
  'PNL',
  'Type',
  'TIF',
];

function OrderHistoryTable() {
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
      <Td>{data.price}</Td>
      <Td>{data.completed}</Td>
      <Td>{data.status}</Td>
      <Td>{data.orderId}</Td>
      <Td>{data.date}</Td>
      <Td>{data.fees}</Td>
      {data.pnl > 1 ? (
        <Td color={'text.moneyGreen'}>{data.pnl}</Td>
      ) : (
        <Td color={'text.moneyRed'}>{data.pnl}</Td>
      )}
      <Td>{data.type}</Td>
      <Td>{data.tif}</Td>
    </Tr>
  );
};

export default OrderHistoryTable;
