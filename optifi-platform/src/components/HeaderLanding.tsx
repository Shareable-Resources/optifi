import React from 'react';
import { chakra, Box, Button, Flex, Image } from '@chakra-ui/react';

import StartTradingButton from './StartTradingButton';

import OptifiLogoImg from '../assets/icons/optifi-logo-text.png';

export default function HeaderLanding() {
  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      mx="80px"
      p="22px 64px"
    >
      <Image src={OptifiLogoImg} alt="optifi-logo" />
      <StartTradingButton width="136px" height="36px">
        <chakra.span fontWeight="800" fontSize="14px" lineHeight="20px">
          Start Trading
        </chakra.span>
      </StartTradingButton>
    </Flex>
  );
}
