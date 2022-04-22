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

type OpenOrderProps = {
  side: string;
  instrument: string;
  size: number;
  price: number | string;
  IV: number;
  USD: number;
  completed: number;
  remaining: number;
  avgP: number | string;
  initMar: number | string;
  orderId: number;
  type: string;
  tif: string;
  date: string;
};

const data: OpenOrderProps[] = [
  {
    side: 'SELL',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    price: '0.0007 BTC',
    IV: 99.5,
    USD: 4554.26,
    completed: 2.5,
    remaining: 2.6,
    avgP: '0.1020 BTC',
    initMar: 0.37575,
    orderId: 9118613228,
    type: 'Limit/Reduce',
    tif: 'GTC',
    date: '2022-01-17 10:00:50',
  },
  {
    side: 'BUY',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    price: '0.0007 BTC',
    IV: 99.5,
    USD: 4554.26,
    completed: 2.5,
    remaining: 2.6,
    avgP: '0.1020 BTC',
    initMar: 0.37575,
    orderId: 9118613228,
    type: 'Limit',
    tif: 'GTC',
    date: '2022-01-17 10:00:50',
  },
  {
    side: 'SELL',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    price: '0.0007 BTC',
    IV: 99.5,
    USD: 4554.26,
    completed: 2.5,
    remaining: 2.6,
    avgP: '0.1020 BTC',
    initMar: 0.37575,
    orderId: 9118613228,
    type: 'Limit',
    tif: 'GTC',
    date: '2022-01-17 10:00:50',
  },
  {
    side: 'BUY',
    instrument: 'BTC-220121-38000-C',
    size: 2.5,
    price: '0.0007 BTC',
    IV: 99.5,
    USD: 4554.26,
    completed: 2.5,
    remaining: 2.6,
    avgP: '0.1020 BTC',
    initMar: 0.37575,
    orderId: 9118613228,
    type: 'Limit',
    tif: 'GTC',
    date: '2022-01-17 10:00:50',
  },
];

const headers: string[] = [
  'Side',
  'Instrument',
  'Size',
  'Price',
  'IV',
  'USD',
  'Completed',
  'Remaining',
  'Avg. Price',
  'Initial Margin',
  'Order ID',
  'Type',
  'TIF',
  'Date',
  'Cancel All',
];

function OpenOrdersTable() {
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
      <Td>{data.IV}</Td>
      <Td>{data.USD}</Td>
      <Td>{data.completed}</Td>
      <Td>{data.remaining}</Td>
      <Td>{data.avgP}</Td>
      <Td>{data.initMar}</Td>
      <Td>{data.orderId}</Td>
      <Td>{data.type}</Td>
      <Td>{data.tif}</Td>
      <Td>{data.date}</Td>
      <Td paddingY={0}>
        <Button
          size={'xs'}
          paddingX={'24px'}
          paddingY={0}
          backgroundColor={'#4E5A71'}
        >
          <Text fontSize={'13px'}>Cancel</Text>
        </Button>
      </Td>
    </Tr>
  );
};

export default OpenOrdersTable;
