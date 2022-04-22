import { Flex, Box, Heading } from '@chakra-ui/layout';
import { Image } from '@chakra-ui/react';
import React from 'react';
import { formatToUSD } from '../utils/formatters';
import upArrow from '../assets/icons/UpArrowGreen.svg';
import downArrow from '../assets/icons/DownArrowRed.svg';

export type CoinTabProps = {
  name: string;
  price: number;
  gaining: boolean; // Price going up(true) price going down(false)
  DVOL: number;
  logo: string;
};

export const CoinTab = ({ name, price, gaining, DVOL, logo }: CoinTabProps) => {
  return (
    <Flex padding="14px 16px 12px 16px">
      <Image
        src={logo}
        marginBottom="auto"
        marginRight="8px"
        width="28px"
        height="28px"
      />
      <Flex flexDir="column" alignItems="start">
        <Heading
          as="h2"
          fontWeight="700"
          fontSize="16px"
          lineHeight="18px"
          marginBottom="4px"
        >
          {name}
        </Heading>
        <Flex fontSize="13px" lineHeight="16px" fontWeight="700">
          <Box marginRight="12px">
            {gaining ? (
              <Flex textColor="text.moneyGreen">
                {formatToUSD(price)}
                <Image src={upArrow} height="15px" marginLeft="2px" />
              </Flex>
            ) : (
              <Flex textColor="text.moneyRed">
                {formatToUSD(price)}
                <Image src={downArrow} height="15px" marginLeft="2px" />
              </Flex>
            )}
          </Box>
          <Box textColor="text.grey">DVOL {DVOL}</Box>
        </Flex>
      </Flex>
    </Flex>
  );
};
