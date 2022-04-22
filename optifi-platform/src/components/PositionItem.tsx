import React, { useState } from 'react';
import { Box, Flex } from '@chakra-ui/layout';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import moment from 'moment';
import { Button } from '@chakra-ui/button';
import { capitalizeFirstLetter, formatToUSD } from '../utils/formatters';
import upArrow from '../assets/icons/UpArrowGreen.svg';
import downArrow from '../assets/icons/DownArrowRed.svg';
import { Image } from '@chakra-ui/image';
import { OptionsFilters } from './OptionsFilters';
import { Modal, useDisclosure } from '@chakra-ui/react';
import ClosePositionModal from './ClosePositionModal';

export interface Position {
  //   value: number;
  //   profitYield: number;
  //   maintenance: number;
  //   positionValue: number;
  //   entryPrice: number;
  //   currentPrice: number;
  //   date: Date;
  //   leverage: number;
  //   coinName: string;
  //   coinAmount: number;

  //   longShort: 'Long' | 'Short';
  //   optionsOrFutures: 'Futures' | 'Options';
  asset: number;
  instrumentType: string;
  marketId: string;
  positionType: string;
  size: number;
  strike: string;
  expiryDate: string;
}

type PositionProps = {
  position: Position;
};

export const PositionItem = ({ position }: PositionProps) => {
  const [showMore, setShowMore] = useState(false);
  const profit = 50;
  const { isOpen, onOpen, onClose } = useDisclosure();

  // const momentDate = moment(position.date).format('DD MMM  hh:mm A');
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
            <Box marginBottom="4px">
              {capitalizeFirstLetter(position.positionType)} 100x BTC
              {/* {position.longShort} {position.leverage}x {position.coinName}{' '} */}
              {/* {position.coinAmount} Call */} {position.strike}{' '}
              {capitalizeFirstLetter(position.instrumentType)}
            </Box>
            <Box
              marginBottom="4px"
              fontWeight="400"
              textColor="text.grey"
              textTransform="uppercase"
            >
              {position.expiryDate}
            </Box>
            <Box textColor="theme.primary">
              {position.strike ? 'Option' : 'Future'}
            </Box>
          </Box>
          {showMore && (
            <Box fontSize="13px" lineHeight="16px" fontWeight="400">
              <Flex marginBottom="2px">
                Position value
                <Box fontWeight="700" marginLeft="8px">
                  {formatToUSD(1234.12)}
                </Box>
              </Flex>
              <Flex marginBottom="2px">
                Entry Price
                <Box fontWeight="700" marginLeft="8px">
                  {formatToUSD(1234.12)}
                </Box>
              </Flex>
              <Flex marginBottom="2px">
                Current Price
                <Box fontWeight="700" marginLeft="8px">
                  {formatToUSD(1234.12)}
                </Box>
              </Flex>
              <Flex marginBottom="2px">
                Size
                <Box fontWeight="700" marginLeft="8px">
                  {position.size}
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
            justifyContent="end"
            alignItems="center"
            marginTop="44px"
            marginBottom="32px"
            fontSize="13px"
            textColor={profit >= 0 ? 'text.moneyGreen' : 'text.moneyRed'}
          >
            {profit >= 0 ? (
              <Image src={upArrow} height="15px" />
            ) : (
              <Image src={downArrow} height="15px" />
            )}
            <Flex lineHeight="16px">
              {formatToUSD(1412.44)} ({profit >= 0 ? '+' + profit : profit})
            </Flex>
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
            <Box marginBottom="24px" fontSize="13px" lineHeight="16px">
              <Box fontWeight="700">No Liquidation Risk</Box>
              <Flex marginBottom="16px">
                Maintenance{' '}
                <Box marginLeft="8px" fontWeight="700">
                  {formatToUSD(1234.12)}
                </Box>
              </Flex>
              <Button
                height="30px"
                backgroundColor="theme.primary"
                textColor="text.white"
                fontSize="13px"
                fontWeight="800"
                lineHeight="18px"
                padding="0px 17px"
              >
                Close Position
              </Button>
            </Box>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};
