import { Image } from '@chakra-ui/image';
import { Box, Flex, Grid } from '@chakra-ui/layout';
import { Table, Tbody, Td, Thead, Tr } from '@chakra-ui/table';
import callIcon from '../assets/icons/call_icon.svg';
import putIcon from '../assets/icons/put_icon.svg';
import moment from 'moment';

import React from 'react';

export type Trade = {
  side: 'Buy' | 'Sell';
  options: string;
  price: number;
  filled: number;
  time: Date;
};

type RecentTradesProps = {
  callOptions: Trade[];
  putOptions: Trade[];
  call24HourVolume: number;
  put24HourVolume: number;
};
const RecentTrades = ({
  callOptions,
  putOptions,
  call24HourVolume,
  put24HourVolume,
}: RecentTradesProps) => {
  return (
    <Box borderTop="1px solid #4E5A71" minWidth="1000px">
      <Box
        fontWeight="800"
        fontSize="16px"
        lineHeight="28px"
        padding="16px"
        borderBottom="1px solid #4E5A71"
      >
        Recent Trades
      </Box>
      <Grid gridTemplateColumns={{ base: '1fr', xl: '1fr 1fr' }}>
        <Box borderRight={{ base: '', xl: '1px solid #4E5A71' }}>
          <Flex
            fontWeight="800"
            fontSize="16px"
            padding="16px 24px"
            alignItems="right"
          >
            <Image src={callIcon} marginTop="-5px" />
            <Flex lineHeight="28px">Call Options</Flex>
            <Flex
              fontSize="16px"
              lineHeight="28px"
              textColor="#B2B0BC"
              marginLeft="auto"
              fontWeight="400"
            >
              24h Volume
              <Box textColor="#FFF" marginLeft="8px" fontWeight="700">
                {call24HourVolume}
              </Box>
            </Flex>
          </Flex>
          <RecentTradeTable options={callOptions} />
        </Box>
        <Box borderLeft={{ base: '', xl: '1px solid #4E5A71' }}>
          <Flex
            fontWeight="800"
            fontSize="16px"
            justifyContent="end"
            padding="16px 24px"
          >
            <Flex
              fontSize="16px"
              lineHeight="28px"
              textColor="#B2B0BC"
              marginRight="auto"
              fontWeight="400"
            >
              24h Volume
              <Box textColor="#FFF" marginLeft="8px" fontWeight="700">
                {put24HourVolume}
              </Box>
            </Flex>
            <Flex>
              Put
              <Image src={putIcon} marginTop="-5px" />
            </Flex>
          </Flex>
          <RecentTradeTable options={putOptions} />
        </Box>
      </Grid>
    </Box>
  );
};

type RecentTradeTableProps = { options: Trade[] };
const RecentTradeTable = ({ options }: RecentTradeTableProps) => {
  const headers = ['Options', 'Price', 'Filled'];

  return (
    <Table>
      <Thead>
        <Tr textColor="#B2B0BC">
          <Td paddingY="0" paddingLeft="16px" fontSize="13px" lineHeight="16px">
            Side
          </Td>
          {headers.map(header => {
            return (
              <Td paddingY="0" key={header} fontSize="13px" lineHeight="16px">
                {header}
              </Td>
            );
          })}
          <Td
            paddingY="0"
            paddingRight="24px"
            fontSize="13px"
            lineHeight="16px"
          >
            Side
          </Td>
        </Tr>
      </Thead>
      <Tbody>
        {options.map((option, index) => {
          return (
            <Tr
              key={index}
              _odd={{ backgroundColor: '#262D3A' }}
              textColor="#FFF"
              fontSize="13px"
              fontWeight="700"
              lineHeight="16px"
              paddingY="0"
            >
              <Td
                paddingY="0"
                paddingLeft="16px"
                lineHeight="16px"
                textColor={
                  option.side === 'Buy' ? 'text.moneyGreen' : 'text.moneyRed'
                }
              >
                {option.side}
              </Td>
              <Td paddingY="0" whiteSpace="nowrap">
                {option.options}
              </Td>
              <Td
                paddingY="0"
                textColor={
                  option.side === 'Buy' ? 'text.moneyGreen' : 'text.moneyRed'
                }
              >
                {option.price}
              </Td>
              <Td paddingY="0">{option.filled}</Td>
              <Td paddingY="0" paddingRight="24px" whiteSpace="nowrap">
                {moment(option.time).format('YYYY-MM-DD HH:mm:ss')}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
export default RecentTrades;
