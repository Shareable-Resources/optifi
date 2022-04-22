import React, { useState, useContext } from 'react';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Input,
  Box,
  Button,
  InputGroup,
  InputRightElement,
  Text,
} from '@chakra-ui/react';

import TradeContext from '../contexts/tradeContext';

function ClosePositionModal({ position }: any) {
  const [def, setDef] = useState<any>(0);
  const [qty, setQty] = useState<any>(0);
  const { placeOrderOnMarket } = useContext(TradeContext);

  const onClosePosition = async () => {
    // you can pass props(e.g price/quantity/positionType etc) to this function
    try {
      let res = await placeOrderOnMarket(
        'ask', // if positionType = short, it will 'bid'.
        '9qFPYPyGuNtVaZPvkHEniDjKKpTXSiJLwbbazND9PdaX', // marketId of the that position
        '0.05', // the price from input
        100 // the quantity from input
      );
      console.log(res);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader paddingX={'32px'} paddingTop={'32px'}>
          <Text fontWeight={800} fontSize={'20px'} lineHeight={'28px'}>
            Close Position
          </Text>
          <Text
            fontWeight={700}
            fontSize={'15px'}
            lineHeight={'20px'}
            color={'#9C7BEE'}
          >
            {`${position.longShort} ${position.coinName} ${
              position.coinAmount
            } ${position.longShort === 'Long' ? 'Call' : 'Short'}`}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody paddingX={'32px'} paddingBottom={'32px'}>
          <Flex flexDir={'column'}>
            <Flex>
              <Text
                paddingBottom={'12px'}
                fontSize={'13px'}
                lineHeight={'16px'}
              >
                The default price below may result in reduced PnL. Customise the
                price and quantity of your closing order below.
              </Text>
            </Flex>
            <Flex
              fontWeight={400}
              fontSize={'13px'}
              justifyContent={'space-between'}
            >
              <Text>Price of Contract</Text>
              <Text color={'#B2B0BC'} pb={'8px'}>
                Entry Price ${position.entryPrice}0
              </Text>
            </Flex>
            <Flex>
              <InputGroup size="md">
                <Input
                  pr="4.5rem"
                  value={def}
                  onChange={e => {
                    setDef(e.target.value);
                  }}
                />
                <InputRightElement width="6rem">
                  <Box borderLeft="1px solid #4E5A71" minW={'84px'}>
                    <Button
                      variant={'unstyled'}
                      h="1.75rem"
                      size="sm"
                      paddingLeft={'14px'}
                      fontSize={'13px'}
                      fontWeight={700}
                    >
                      <Text _hover={{ color: '#9c7bee' }}>DEFAULT</Text>
                    </Button>
                  </Box>
                </InputRightElement>
              </InputGroup>
            </Flex>
            <Flex
              fontWeight={400}
              fontSize={'13px'}
              justifyContent={'space-between'}
              paddingTop={'16px'}
            >
              <Text>Qty of Contract</Text>
              <Text color={'#B2B0BC'} pb={'8px'}>
                Max Qty 0.000
              </Text>
            </Flex>
            <Flex>
              <InputGroup size="md">
                <Input
                  pr="4.5rem"
                  placeholder="0"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                />
                <InputRightElement width="6rem">
                  <Box borderLeft="1px solid #4E5A71" minW={'84px'}>
                    <Button
                      variant={'unstyled'}
                      h="1.75rem"
                      size="sm"
                      paddingLeft={'32px'}
                      fontSize={'13px'}
                      fontWeight={700}
                    >
                      <Text _hover={{ color: '#9c7bee' }}>MAX</Text>
                    </Button>
                  </Box>
                </InputRightElement>
              </InputGroup>
            </Flex>
            <Flex justifyContent={'space-between'} paddingBottom={'24px'}>
              <Flex flexDir={'column'}>
                <Text
                  paddingTop={'24px'}
                  paddingBottom={'4px'}
                  fontWeight={800}
                  fontSize="22px"
                  lineHeight={'28px'}
                >
                  $--
                </Text>
                <Text fontWeight={700} fontSize={'14px'}>
                  Estimated PnL
                </Text>
              </Flex>
              <Flex flexDir={'column'}>
                <Flex
                  justifyContent={'flex-end'}
                  paddingTop={'24px'}
                  paddingBottom={'4px'}
                  fontWeight={800}
                  fontSize="22px"
                  lineHeight={'28px'}
                  align={'left'}
                >
                  $--
                </Flex>
                <Flex
                  justifyContent={'flex-end'}
                  fontWeight={700}
                  fontSize={'14px'}
                >
                  Estimated Fees
                </Flex>
              </Flex>
            </Flex>
            <Button
              size={'lg'}
              backgroundColor={qty > 0 && def > 0 ? '#9c7bee' : '#4E5A71'}
            >
              <Text fontSize={'14px'} fontWeight={800}>
                Close Position
              </Text>
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </>
  );
}

export default ClosePositionModal;
