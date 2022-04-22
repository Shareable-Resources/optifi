import { Button } from '@chakra-ui/button';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Spinner, Text } from '@chakra-ui/react';
import { Box, Flex } from '@chakra-ui/layout';
import moment from 'moment';
import { stringify } from 'querystring';
import React, { useContext, useState } from 'react';
import GlobalContext from '../contexts/globalContext';
import { capitalizeFirstLetter, formatToUSD } from '../utils/formatters';
import { cancelOpenOrder } from '../utils/Operations';
import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

import ErrorSuccessPopUp from './ErrorSuccessPopUp';

export type OpenOrder = {
  assets: undefined;
  clientId: anchor.BN;
  duration: string;
  expiryDate: string;
  feeTier: number;
  instrumentType: 'call' | 'put';
  marketAddress: PublicKey;
  openOrdersAddress: PublicKey;
  openOrdersSlot: number;
  orderId: anchor.BN;
  price: string; // float
  priceLots: anchor.BN;
  side: 'buy' | 'sell';
  size: number;
  sizeLots: anchor.BN;
  start: string;
  strike: number;
};

type OpenOrdersProps = {
  order: OpenOrder;
};
export const OpenOrderItem = ({ order }: OpenOrdersProps) => {
  const { context } = useContext(GlobalContext);
  const [showMore, setShowMore] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [success, setSuccess] = useState<any>('');
  const dateStringArray = order.expiryDate.split(' ');

  return (
    <Flex padding="0 15px 0 16px" backgroundColor={showMore ? '#293141' : ''}>
      <Flex borderBottom="1px solid #4E5A71" width="full">
        <Box
          fontSize="13px"
          fontWeight="700"
          lineHeight="16px"
          marginTop="24px"
        >
          <Box marginBottom={!showMore ? '24px' : '12px'}>
            <Flex
              marginBottom="4px"
              fontSize="13px"
              lineHeight="16px"
              textColor="#FFF"
              fontWeight="400"
              flexDirection={{ base: 'column', sm: 'row' }}
            >
              {capitalizeFirstLetter(order.side)}{' '}
              <Box fontWeight="800" marginLeft={{ base: '0px', sm: '3px' }}>
                SOL {order.strike ? `$${order.strike}` : ''}{' '}
                {order.instrumentType}
              </Box>
              <Box textColor="#B2B0BC" marginLeft={{ base: '0px', sm: '3px' }}>
                {moment(new Date(order.expiryDate)).format('DD MMM')}
              </Box>{' '}
              <Box fontWeight="800" marginLeft={{ base: '0px', sm: '3px' }}>
                at {order.price}
              </Box>
            </Flex>
            <Box textColor="theme.primary">
              {order.size > 0 ? 'Option' : 'Future'}
            </Box>
          </Box>
          {showMore && (
            <Box fontSize="13px" lineHeight="16px" fontWeight="400">
              <Flex marginBottom="2px">
                InitialMargin
                <Box fontWeight="700" marginLeft="8px">
                  {formatToUSD(1123)}
                </Box>
              </Flex>
              <Flex>
                TradeValue
                <Box fontWeight="700" marginLeft="8px">
                  {formatToUSD(1123)}
                </Box>
              </Flex>
            </Box>
          )}
        </Box>

        <Flex
          flexDir="column"
          marginLeft="auto"
          textAlign="right"
          textColor="white"
        >
          <Flex
            marginTop="30px"
            marginBottom="26px"
            fontSize="13px"
            fontWeight="700"
            marginLeft="auto"
            alignItems="center"
          >
            {order.openOrdersSlot} remaining
            {showMore ? (
              <ChevronUpIcon
                textColor="text.white"
                fontSize="18px"
                onClick={() => setShowMore(false)}
              />
            ) : (
              <ChevronDownIcon
                textColor="text.white"
                fontSize="18px"
                onClick={() => setShowMore(true)}
              />
            )}
          </Flex>
          {showMore && (
            <Box marginBottom="20px" fontSize="13px" lineHeight="16px">
              <Button
                height="30px"
                backgroundColor="theme.primary"
                textColor="text.white"
                fontSize="13px"
                fontWeight="800"
                lineHeight="18px"
                padding="0px 17px"
                disabled={disabled}
                onClick={() => {
                  setDisabled(true);
                  cancelOpenOrder(order, context, setSuccess, setDisabled);
                }}
              >
                {!disabled ? <Text>Close Order</Text> : <Spinner />}
              </Button>
            </Box>
          )}
        </Flex>
      </Flex>
      {/* success */}
      <ErrorSuccessPopUp
        message={'Your Order Was Cancelled'}
        fail={false}
        open={success}
        onClose={() => {
          setDisabled(false);
          setSuccess('');
        }}
      />
    </Flex>
  );
};
