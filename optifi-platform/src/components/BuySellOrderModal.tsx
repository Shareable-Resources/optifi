import { Button } from '@chakra-ui/button';
import { Image } from '@chakra-ui/image';
import { Box, Flex, Grid } from '@chakra-ui/layout';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/modal';
import React, { Dispatch, SetStateAction } from 'react';
import UpArrowGreen from '../assets/icons/call_icon_16x16.svg';
import DownArrowRed from '../assets/icons/put_icon_16x16.svg';
import Close from '../assets/icons/close_icon_28x28.svg';

type BuySellOrderModalProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  isBuy: boolean;
};
export const BuySellOrderModal = ({
  isOpen,
  setIsOpen,
  isBuy,
}: BuySellOrderModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} isCentered>
      <ModalOverlay />
      <ModalContent maxWidth="388px" backgroundColor="#293141">
        <Flex alignItems="center" padding="32px">
          <ModalHeader
            fontWeight="800"
            fontSize="20px"
            lineHeight="28px"
            padding="0"
          >
            Confirm
          </ModalHeader>

          <Button
            onClick={() => setIsOpen(false)}
            padding="0"
            backgroundColor="transparent"
            marginLeft="auto"
            _hover={{ border: 'none' }}
            _active={{ border: 'none' }}
          >
            <Image src={Close} backgroundColor="white" />
          </Button>
        </Flex>
        <ModalBody paddingX="32px" paddingTop="0" paddingBottom="32px">
          <Flex fontSize="14px" lineHeight="16px" marginBottom="32px">
            <Box marginRight="12px" textColor="#B2B0BC">
              <Flex marginBottom="12px">Instrument</Flex>
              <Flex marginBottom="12px">Order Type</Flex>
              <Flex marginBottom="12px">Side </Flex>
              <Flex marginBottom="12px">Size</Flex>
              <Flex marginBottom="12px">Price</Flex>
            </Box>
            <Box fontWeight="700">
              <Flex marginBottom="12px">
                <Box>BTC-220212-30000-P</Box>
                {isBuy ? (
                  <Image src={UpArrowGreen} />
                ) : (
                  <Image src={DownArrowRed} />
                )}
              </Flex>
              <Box marginBottom="12px">Limit</Box>
              <Box
                marginBottom="12px"
                textColor={isBuy ? 'text.moneyGreen' : 'text.moneyRed'}
              >
                {' '}
                {isBuy ? 'Buy' : 'Sell'}
              </Box>
              <Box marginBottom="12px">1.0</Box>
              <Box marginBottom="12px">0.0005</Box>
            </Box>
          </Flex>
          <Grid templateColumns="2fr 3fr" gridGap="12px">
            <Button
              backgroundColor="#4E5A71"
              borderRadius="4px"
              lineHeight="20px"
              size="14px"
              fontWeight="700"
              paddingY="14px"
              paddingX="20px"
            >
              Cancel
            </Button>
            <Button
              backgroundColor={isBuy ? 'text.moneyGreen' : 'text.moneyRed'}
              borderRadius="4px"
              lineHeight="20px"
              size="14px"
              fontWeight="700"
              paddingY="14px"
              paddingX="20px"
            >
              Create a {isBuy ? 'Buy' : 'Sell'} Order
            </Button>
          </Grid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
