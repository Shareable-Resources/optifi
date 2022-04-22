import React from 'react';
import {
  Box,
  Flex,
  Image,
} from '@chakra-ui/react';

import OptifiLogoImg from '../assets/icons/optifi-logo-text.png';

export default function Footer() {
  return (
    <Flex justifyContent="space-between" alignItems="center" mx="80px" p="40px 64px 100px 64px">
      <Image src={OptifiLogoImg} alt="optifi-logo" />
      <Box
        fontFamily="Montserrat"
        fontWeight="500"
        fontSize="14px"
        lineHeight="18px"
      >
        Copyright © 2021 Optifi. All Rights Reserved
      </Box>
    </Flex>
  );
}
