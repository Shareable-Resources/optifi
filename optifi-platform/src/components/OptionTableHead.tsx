import { Image } from '@chakra-ui/image';
import { Box, Flex, Grid } from '@chakra-ui/layout';
import React, { useState, useEffect } from 'react';
import callIcon from '../assets/icons/call_icon.svg';
import putIcon from '../assets/icons/put_icon.svg';
import moment from 'moment';
import { Tooltip } from './Tooltip';

type OptionTableHeadProps = {
  indexPrice: number;
  dateSelected: Date;
  expiryDate: Date;
};

const calculateDaysRemaining = (timeLeft: number): any => {
  var delta = timeLeft;
  var days = Math.floor(delta / 86400);
  delta -= days * 86400;
  var hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;

  var minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;

  var seconds = delta % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

export const OptionTableHead = ({
  indexPrice,
  dateSelected,
  expiryDate,
}: OptionTableHeadProps) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTimeRemaining(
      Math.abs(moment(dateSelected).unix() - moment(expiryDate).unix())
    );
  }, [dateSelected, expiryDate]);

  return (
    <>
      <Grid
        borderBottom="1px solid #4E5A71"
        paddingTop="24px"
        paddingBottom="12px"
        gridTemplateColumns="auto auto auto"
        gridTemplateRows={{ base: 'auto auto', md: '1fr' }}
        minWidth="1000px"
      >
        <Flex
          marginLeft="24px"
          marginTop="auto"
          gridRow={{ base: '2/3', md: '1/2' }}
        >
          <Image src={callIcon} maxHeight="28px" maxWidth="28px" />
          <Box
            marginLeft="9px"
            fontSize="16px"
            fontWeight="800"
            lineHeight="28px"
            whiteSpace="nowrap"
          >
            Call Options
          </Box>
        </Flex>
        <Grid
          gridColumn={{ base: '1/4', md: '2/3' }}
          gridTemplateColumns={{ base: '1fr', lg: '1fr auto 1fr' }}
          fontSize="16"
          lineHeight="28px"
          width="full"
          textAlign="center"
          alignItems="center"
          justifyContent="center"
        >
          <Flex
            justifyContent={{ base: 'center', lg: 'right' }}
            alignItems="center"
            marginRight={{ base: '', lg: '36px' }}
            textColor="text.grey"
          >
            Index Price
            <Flex marginLeft="8px" textColor="white" fontWeight="700">
              {indexPrice}
            </Flex>
          </Flex>
          <Flex
            justifyContent="center"
            alignItems="center"
            textColor="theme.primary"
            fontWeight="800"
            fontSize="22px"
          >
            {moment(dateSelected).format('YYYY - MM - DD')}
          </Flex>
          <Flex
            justifyContent={{ base: 'center', lg: 'start' }}
            alignItems="center"
            marginLeft={{ base: '', lg: '36px' }}
            textColor="text.grey"
          >
            Expiry Date
            <Flex marginLeft="8px" textColor="white" fontWeight="700">
              {calculateDaysRemaining(timeRemaining)}
            </Flex>
          </Flex>
        </Grid>
        <Flex
          marginRight="24px"
          marginLeft="auto"
          marginTop="auto"
          gridRow={{ base: '2/3', md: '1/2' }}
          gridColumn={{ base: '3/4' }}
        >
          <Box
            marginRight="9px"
            fontSize="16px"
            fontWeight="800"
            lineHeight="28px"
            whiteSpace="nowrap"
          >
            Put Options
          </Box>
          <Image src={putIcon} maxHeight="28px" maxWidth="28px" />
        </Flex>
      </Grid>
    </>
  );
};
