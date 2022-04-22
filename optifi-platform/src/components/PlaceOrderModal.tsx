import React, { useState, useEffect, useContext } from 'react';
import { PlaceOrderHeader } from './CreateOrderHeader';
import '../assets/scss/_placeOrderModal.scss';
import { Position } from '../components/PositionItem';
import { PositionOrder } from '../components/PositionOrder';
import { MyBalance, BalanceInterface } from '../components/MyBalance';
import ErrorSuccessPopUp from './ErrorSuccessPopUp';

import {
  chakra,
  Center,
  Box,
  Button,
  Flex,
  HStack,
  NumberInput,
  NumberInputField,
  Modal,
  GridItem,
  Table,
  Tbody,
  Td,
  Thead,
  Tr,
  Th,
  Grid,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Text,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Checkbox,
  Spinner,
} from '@chakra-ui/react';
import {
  ChevronDownIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from '@chakra-ui/icons';

// instruction
import placeOrder from '@optifi/optifi-sdk/lib/instructions/placeOrder';
import { deposit } from '@optifi/optifi-sdk';
import { initializeUserIfNotInitializedOnMarket } from '@optifi/optifi-sdk/lib/utils/market';
import {
  settleSerumFundsIfAnyUnsettled,
  getSerumMarket,
} from '@optifi/optifi-sdk/lib/utils/serum';
import { formOrderContext } from '@optifi/optifi-sdk/lib/utils/orders';

// type
import { OrderSide } from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';
import { OptifiMarket } from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';
import { TransactionSignature } from '@solana/web3.js';
// debug
import {
  formatExplorerAddress,
  SolanaEntityType,
} from '@optifi/optifi-sdk/lib/utils/debug';

import GlobalContext from '../contexts/globalContext';
import { AsyncLocalStorage } from 'async_hooks';

type PlaceOrderModalProp = {
  isOpen: boolean;
  onClose: () => void;
  selectedOption: any;
  userOpenOrder?: any[] | undefined;
  positions?: any[] | undefined;
};
const dummyData2 = [
  { price: 282.54, amount: 0.2703, time: '2022-01-17 10:00:50' },
  { price: 282.54, amount: 0.2703, time: '2022-01-17 10:00:50' },
  { price: 282.54, amount: 0.2703, time: '2022-01-17 10:00:50' },
  { price: 282.54, amount: 0.2703, time: '2022-01-17 10:00:50' },
  { price: 282.54, amount: 0.2703, time: '2022-01-17 10:00:50' },
  { price: 282.54, amount: 0.2703, time: '2022-01-17 10:00:50' },
  { price: 282.54, amount: 0.2703, time: '2022-01-17 10:00:50' },
  { price: 282.54, amount: 0.2703, time: '2022-01-17 10:00:50' },
  { price: 282.54, amount: 0.2703, time: '2022-01-17 10:00:50' },
];

const myBalanceData: BalanceInterface = {
  amountEquity: 8907.523,
  netUnrealizedPNL: -977.4561,
  totalMaintanenceMargin: 1322.9439,
  totalInitialMargin: 0.0,
  liquidationBuffer: 7584.58,
  small: true,
};

const PlaceOrderDialog = ({ selectedOption }: any) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [cryptoPrice, setCryptoPrice] = useState<any>('0.00000');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingSell, setIsLoadingSell] = useState<boolean>(false);
  const [sliderValue, setSliderValue] = useState<number>(25);
  const [timeForce, setTimeForce] = useState<String>('GTC');
  const [reduce, setReduce] = useState<boolean>(false);
  const [post, setPost] = useState<boolean>(false);
  const [showFail, setShowFail] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<String>('Error Message');
  const [successMessage, setSuccessMessage] =
    useState<String>('Success Message');

  const { context } = useContext(GlobalContext);

  const handleQuantityChange = (valueString: string) => {
    if (valueString !== '') {
      setQuantity(parseInt(valueString));
    } else {
      setQuantity(0);
    }
  };

  const handleCryptoPriceChange = (valueString: string) => {
    if (valueString !== '') {
      setCryptoPrice(valueString);
    } else {
      setCryptoPrice('');
    }
  };

  const order = async (orderType: string) => {
    console.log(orderType);
    let marketAddress = selectedOption.marketAddress;
    let side = orderType === 'bid' ? OrderSide.Bid : OrderSide.Ask;

    // it won't return res
    await initializeUserIfNotInitializedOnMarket(context, marketAddress);
    formOrderContext(context, marketAddress, side)
      .then((orderContext: any) => {
        // console.log('Serum market is ',formatExplorerAddress(context,orderContext.serumMarket.toString(),SolanaEntityType.Account));
        // console.log('Open orders account is ',formatExplorerAddress(context,orderContext.openOrders.toString(),SolanaEntityType.Account));
        context.connection
          .getTokenAccountBalance(orderContext.userMarginAccount)
          .then(tokenAmount => {
            let limit =
                parseFloat(cryptoPrice) * 10 ** tokenAmount.value.decimals,
              maxCoinQty = quantity;
            let maxPcQty = limit * quantity;
            console.log({
              context,
              market: marketAddress,
              side,
              limit,
              maxCoinQty,
              maxPcQty,
            });
            placeOrder(
              context,
              marketAddress,
              side,
              limit,
              maxCoinQty,
              maxPcQty
            )
              .then(async res => {
                console.log('Placed order ', res);
                if (res.successful) {
                  setSuccessMessage('Success');
                  setShowSuccess(true);
                  console.log(
                    formatExplorerAddress(
                      context,
                      res.data as TransactionSignature,
                      SolanaEntityType.Transaction
                    )
                  );
                  setTimeout(() => {
                    settleSerumFundsIfAnyUnsettled(context, marketAddress).then((res) => {
                      console.log("Got res!");
                    }).catch((err) => {
                      console.error(err);
                    })
                  }, 5000);
                }
              })
              .catch(err => {
                setErrorMessage(
                  'Place order failed. Please make sure you have enough USDC.'
                );
                setShowFail(true);
                console.error('placeOrder err', err);
              });
          })
          .catch(err => {
            setShowFail(true);
            console.error('formOrderContext err', err);
          });
      })
      .catch(err => {
        console.error('getTokenAccountBalance err', err);
        if (err.resultType === 1) {
          // show err msg pop-up
          // pass err message
          setErrorMessage(
            'The process of initializing user account on this market is ongoing. Please try again after a few seconds'
          );
          setShowFail(true);
        }
      });
  };

  return (
    <>
      <Flex direction="column" padding={'16px'} maxW={'284px'}>
        <Box
          fontWeight="800"
          fontSize="16px"
          lineHeight="28px"
          paddingBottom="16px"
        >
          Place Order
          {console.log(context)}
        </Box>
        <Box paddingBottom={'16px'}>
          <Text className="input">Quantity</Text>
          <NumberInput
            maxHeight={'32px'}
            value={quantity}
            onChange={valueString => handleQuantityChange(valueString)}
          >
            <NumberInputField />
          </NumberInput>
        </Box>
        <Box paddingBottom={'16px'}>
          <Text className="input">Limit Price</Text>
          <NumberInput
            maxHeight={'32px'}
            value={cryptoPrice}
            precision={2}
            onChange={valueString => handleCryptoPriceChange(valueString)}
          >
            <NumberInputField />
          </NumberInput>
        </Box>
        <Box paddingX={'10px'} paddingBottom={'20px'}>
          <Slider
            aria-label="slider-ex-6"
            onChange={val => setSliderValue(val)}
            step={25}
          >
            <SliderMark className="slider" value={0} mt="1" ml="-2.5">
              0%
            </SliderMark>
            <SliderMark className="slider" value={50} mt="1" ml="-2.5">
              50%
            </SliderMark>
            <SliderMark className="slider" value={100} mt="1" ml="-2.5">
              100%
            </SliderMark>
            <SliderTrack bg={'#4E5A71'}>
              <SliderFilledTrack bg={'#9C7BEE'} />
            </SliderTrack>
            <SliderThumb boxSize={4} backgroundColor={'#9C7BEE'}></SliderThumb>
          </Slider>
        </Box>
        <Box paddingBottom={'16px'}>
          <Text className="input">Total</Text>
          <NumberInput
            className="number-input"
            isDisabled
            maxHeight={'32px'}
            value={cryptoPrice * quantity}
            precision={2}
            onChange={valueString => handleCryptoPriceChange(valueString)}
          >
            <NumberInputField />
          </NumberInput>
        </Box>
        <Box>
          <Text
            fontSize={'13px'}
            lineHeight={'16px'}
            fontWeight={'400'}
            paddingBottom={'8px'}
            color={'white'}
          >
            Time In Force
          </Text>
          <HStack>
            <Menu>
              <MenuButton
                backgroundColor={'#293141'}
                border={'1px solid #4E5A71'}
                as={Button}
                rightIcon={<TriangleDownIcon color={'#9C7BEE'} />}
              >
                <Text paddingRight={'20px'} textColor={'#FFFFFF'}>
                  {timeForce}
                </Text>
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => setTimeForce('GTC')}>GTC</MenuItem>
                <MenuItem onClick={() => setTimeForce('GTD')}>GTD</MenuItem>
                <MenuItem onClick={() => setTimeForce('FOK')}>FOK</MenuItem>
                <MenuItem onClick={() => setTimeForce('IOC')}>IOC</MenuItem>
              </MenuList>
            </Menu>
            <Checkbox
              paddingLeft={'12px'}
              colorScheme="purple"
              onChange={() => setReduce(prev => !prev)}
            >
              <Text fontSize={'13px'}>Reduce</Text>
            </Checkbox>
            <Checkbox
              colorScheme="purple"
              onChange={() => setPost(prev => !prev)}
            >
              <Text fontSize={'13px'}>Post</Text>
            </Checkbox>
          </HStack>
        </Box>
        {context.connection ? (
          <HStack
            spacing="12px"
            marginTop="24px"
            marginBottom={'16px'}
            justifyContent={'space-between'}
          >
            <Button
              width={'120px'}
              height={'48px'}
              bg="#34DC9D"
              disabled={isLoadingSell || isLoading}
              onClick={() => {
                setIsLoading(true);
                order('bid');
              }}
            >
              {isLoading ? <Spinner /> : 'Buy'}
            </Button>
            <Button
              width={'120px'}
              height={'48px'}
              bg="#FF4574"
              disabled={isLoadingSell || isLoading}
              onClick={() => {
                setIsLoadingSell(true);
                order('ask');
              }}
            >
              {isLoadingSell ? <Spinner /> : 'Sell'}
            </Button>
          </HStack>
        ) : (
          <Button
            marginTop="24px"
            marginBottom={'16px'}
            height={'48px'}
            bg="#34DC9D"
            bgColor={'#9C7BEE'}
          >
            <Text fontWeight={800} fontSize={'14px'} lineHeight={'20px'}>
              Connect Wallet
            </Text>
          </Button>
        )}
        <HStack justifyContent={'space-between'}>
          <Text fontWeight={400} fontSize={'13px'}>
            Buy Margin
          </Text>
          <Text fontWeight={400} fontSize={'13px'}>
            Sell Margin
          </Text>
        </HStack>
        <HStack justifyContent={'space-between'} paddingBottom={'24px'}>
          <Text fontWeight={700} fontSize={'13px'} color={'white'}>
            0.45874
          </Text>
          <Text fontWeight={700} fontSize={'13px'} color={'white'}>
            0.3943
          </Text>
        </HStack>
        <Box>
          <Text
            fontWeight={700}
            fontSize={'14px'}
            color={'white'}
            lineHeight={'15.62px'}
          >
            Contract Details
            <ChevronDownIcon />
          </Text>
        </Box>
      </Flex>
      <ErrorSuccessPopUp
        message={errorMessage}
        fail={true}
        open={showFail}
        onClose={() => {
          setShowFail(false);
          setIsLoadingSell(false);
          setIsLoading(false);
          setErrorMessage('Error Message');
        }}
      />
      <ErrorSuccessPopUp
        message={successMessage}
        fail={false}
        open={showSuccess}
        onClose={() => {
          setIsLoadingSell(false);
          setIsLoading(false);
          setShowSuccess(false);
          setSuccessMessage('Your Order Was Executed!');
        }}
      />
    </>
  );
};

const OrderBookData: React.FC<any> = ({ selectedOption }): JSX.Element => {
  type AskBidType = {
    price: number | String;
    size: number | String;
    total: number | String;
  };
  const { context } = useContext(GlobalContext);
  const [bids, setBids] = useState<Array<AskBidType>>([]);
  const [asks, setAsks] = useState<Array<AskBidType>>([]);
  const [loading, setLoading] = useState<Boolean>(true);

  useEffect(() => {
    const getOrderBookData = (): void => {
      if (Object.getOwnPropertyNames(selectedOption).length !== 0) {
        context.program.account.optifiMarket
          .fetch(selectedOption.marketId)
          .then(marketRes => {
            let optifiMarket = marketRes as OptifiMarket;
            getSerumMarket(context, optifiMarket.serumMarket).then(
              serumMarket => {
                serumMarket.loadBids(context.connection).then(bids => {
                  let bidsArr: Array<AskBidType> = [];
                  for (let [price, size] of bids.getL2(20)) {
                    bidsArr.push({
                      price,
                      size,
                      total: price * size,
                    });
                  }
                  if (bidsArr.length < 5) {
                    let remaining = 6 - bidsArr.length;
                    while (remaining > 0) {
                      bidsArr.push({ price: '--', size: '--', total: '--' });
                      remaining--;
                    }
                  }
                  setBids(bidsArr);
                });

                serumMarket.loadAsks(context.connection).then(asks => {
                  let asksArr: Array<AskBidType> = [];
                  for (let [price, size] of asks.getL2(20)) {
                    asksArr.push({
                      price,
                      size,
                      total: price * size,
                    });
                  }
                  if (asksArr.length < 5) {
                    let remaining = 6 - asksArr.length;
                    while (remaining > 0) {
                      asksArr.push({ price: '--', size: '--', total: '--' });
                      remaining--;
                    }
                  }
                  setAsks(asksArr);
                  setLoading(false);
                });
              }
            );
          });
      }
    };
    getOrderBookData();
  }, [selectedOption]);

  return (
    <>
      <Grid templateColumns="repeat(7, 1fr)">
        <GridItem colSpan={4} borderRight="2px solid #4E5A71">
          <Flex flexDir={'column'} maxHeight={'236px'}>
            <Text
              padding={'16px'}
              fontWeight={800}
              fontSize={'16px'}
              lineHeight={'28px'}
            >
              Order Book
            </Text>

            <Box overflowY={'scroll'} height={'216px'}>
              {loading ? (
                <Center paddingTop={'32px'}>
                  <Spinner />
                </Center>
              ) : (
                <Flex>
                  <Table className="order-table">
                    <Thead position="sticky">
                      <Tr>
                        <Th
                          paddingLeft={'16px'}
                          paddingRight={'4px'}
                          paddingY={'0px'}
                        >
                          Total
                        </Th>
                        <Th paddingX={'4px'} paddingY={'0px'}>
                          Bid Size
                        </Th>
                        <Th paddingX={'4px'} paddingY={'0px'}>
                          Bid Price
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {bids.map((bid, index) => {
                        return (
                          <Tr key={index}>
                            <Td>{bid.total}</Td>
                            <Td>{bid.size}</Td>
                            <Td color={'text.moneyGreen'}>{bid.price}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                  <Table className="order-table">
                    <Thead position="sticky">
                      <Tr>
                        <Th isNumeric paddingX={'4px'} paddingY={'0px'}>
                          Ask Price
                        </Th>
                        <Th isNumeric paddingX={'4px'} paddingY={'0px'}>
                          Ask Size
                        </Th>
                        <Th
                          isNumeric
                          paddingLeft={'4px'}
                          paddingRight={'16px'}
                          paddingY={'0px'}
                        >
                          Total
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {asks.map((ask, index) => {
                        return (
                          <Tr key={index}>
                            <Td color={'text.moneyRed'} isNumeric>
                              {ask.price}
                            </Td>
                            <Td isNumeric>{ask.size}</Td>
                            <Td isNumeric>{ask.total}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Flex>
              )}
            </Box>
          </Flex>
        </GridItem>
        <GridItem colSpan={3}>
          <Flex flexDir={'column'} maxHeight={'236px'}>
            <Text
              padding={'16px'}
              fontWeight={800}
              fontSize={'16px'}
              lineHeight={'28px'}
            >
              Recent Trades
            </Text>
            <Box overflowY={'scroll'} height={'216px'}>
              <Table className="order-table">
                <Thead position="sticky">
                  <Tr>
                    <Th
                      paddingLeft={'16px'}
                      paddingRight={'4px'}
                      paddingY={'0px'}
                    >
                      Price(USDC)
                    </Th>
                    <Th isNumeric paddingX={'4px'} paddingY={'0px'}>
                      Amount
                    </Th>
                    <Th
                      isNumeric
                      paddingLeft={'4px'}
                      paddingRight={'16px'}
                      paddingY={'0px'}
                    >
                      Time
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dummyData2.map((data, index) => (
                    <Tr key={index}>
                      <Td color={'text.moneyGreen'}>{data.amount}</Td>
                      <Td isNumeric>{data.price}</Td>
                      <Td isNumeric>{data.time}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Flex>
        </GridItem>
      </Grid>
    </>
  );
};

function PlaceOrderModal({
  userOpenOrder,
  isOpen,
  onClose,
  selectedOption,
  positions,
}: PlaceOrderModalProp) {
  // const { isOpen, onClose, selectedOption } = props;

  return (
    <>
      <Modal onClose={onClose} isOpen={isOpen}>
        <ModalOverlay />
        <ModalContent maxW="62.8rem" overflow={'auto'} className="header">
          <ModalHeader
            borderBottom="2px solid #4E5A71"
            paddingY={'18px'}
            paddingX={'16px'}
            // overflow={'auto'}
          >
            <HStack spacing="22px">
              <chakra.span fontWeight={800}>
                {selectedOption.asset === 1 ? 'BTC' : 'ETH'}
              </chakra.span>
              <chakra.span>
                <Menu>
                  {({ isOpen }) => (
                    <>
                      <MenuButton
                        className="drop-down"
                        fontSize={'20px'}
                        fontWeight={800}
                        isActive={isOpen}
                        as={Button}
                        variant={'unstyled'}
                        rightIcon={
                          isOpen ? (
                            <TriangleUpIcon
                              width={'32px'}
                              height={'16px'}
                              color={'#9C7BEE'}
                            />
                          ) : (
                            <TriangleDownIcon
                              width={'32px'}
                              height={'16px'}
                              color={'#9C7BEE'}
                            />
                          )
                        }
                        _hover={{ color: 'text.purple' }}
                      >
                        {selectedOption.expiryDate || '2022-01-21'}
                      </MenuButton>
                      <MenuList>
                        <MenuItem className="drop-down-item">
                          2022-01-14
                        </MenuItem>
                        <MenuItem className="drop-down-item">
                          2022-01-21
                        </MenuItem>
                        <MenuItem className="drop-down-item">
                          2022-01-28
                        </MenuItem>
                      </MenuList>
                    </>
                  )}
                </Menu>
              </chakra.span>
              <chakra.span>
                <Menu>
                  {({ isOpen }) => (
                    <>
                      <MenuButton
                        className="drop-down"
                        fontSize={'20px'}
                        fontWeight={800}
                        isActive={isOpen}
                        as={Button}
                        variant={'unstyled'}
                        rightIcon={
                          isOpen ? (
                            <TriangleUpIcon
                              width={'32px'}
                              height={'16px'}
                              color={'#9C7BEE'}
                            />
                          ) : (
                            <TriangleDownIcon
                              width={'32px'}
                              height={'16px'}
                              color={'#9C7BEE'}
                            />
                          )
                        }
                        _hover={{ color: 'text.purple' }}
                      >
                        {selectedOption.strike}
                      </MenuButton>
                      <MenuList>
                        <MenuItem className="drop-down-item">40000</MenuItem>
                        <MenuItem className="drop-down-item">40000</MenuItem>
                        <MenuItem className="drop-down-item">40000</MenuItem>
                        <MenuItem className="drop-down-item">40000</MenuItem>
                        <MenuItem className="drop-down-item">40000</MenuItem>
                        <MenuItem className="drop-down-item">40000</MenuItem>
                        <MenuItem className="drop-down-item">40000</MenuItem>
                      </MenuList>
                    </>
                  )}
                </Menu>
              </chakra.span>
              <chakra.span>
                <Menu>
                  {({ isOpen }) => (
                    <>
                      <MenuButton
                        className="drop-down"
                        fontSize={'20px'}
                        fontWeight={800}
                        isActive={isOpen}
                        as={Button}
                        variant={'unstyled'}
                        rightIcon={
                          isOpen ? (
                            <TriangleUpIcon
                              width={'32px'}
                              height={'16px'}
                              color={'#9C7BEE'}
                            />
                          ) : (
                            <TriangleDownIcon
                              width={'32px'}
                              height={'16px'}
                              color={'#9C7BEE'}
                            />
                          )
                        }
                        _hover={{ color: 'text.purple' }}
                      >
                        {selectedOption.instrumentType || 'Put'}
                      </MenuButton>
                      <MenuList>
                        <MenuItem className="drop-down-item">Call</MenuItem>
                        <MenuItem className="drop-down-item">Put</MenuItem>
                      </MenuList>
                    </>
                  )}
                </Menu>
              </chakra.span>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody padding={0}>
            <Flex flexDir={{ base: 'column', md: 'row', sm: 'row' }}>
              <PlaceOrderDialog selectedOption={selectedOption} />
              <Flex
                width={'full'}
                borderLeft="2px solid #4E5A71"
                flexDir={'column'}
                justifyContent={'space-between'}
              >
                <PlaceOrderHeader data={selectedOption} />
                <OrderBookData selectedOption={selectedOption} />
                <Flex
                  borderTop="2px solid #4E5A71"
                  justifyContent={'space-between'}
                  height="full"
                >
                  <Box minW={'438px'}>
                    <PositionOrder
                      positions={positions}
                      openOrders={userOpenOrder}
                    />
                  </Box>
                  <Box minW={'278px'}>
                    <MyBalance myBalance={myBalanceData} />
                  </Box>
                </Flex>
              </Flex>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default PlaceOrderModal;
