import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Flex,
  Image,
  Grid,
  Button,
  GridItem,
} from '@chakra-ui/react';
import { Tab, TabList, Tabs } from '@chakra-ui/tabs';
import putIcon from '../assets/icons/put_icon.svg';
import callIcon from '../assets/icons/call_icon.svg';
import '../assets/scss/_placeOrderModal.scss';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PlaceOrderHeaderProps = {
  position: boolean;
};

const dummyData = {
  change: 0.0,
  volume: 0,
  leverage: 3,
  iPrice: '41,886.47',
  exRate: 1,
  expiraryDate: '02-22-22',
  delta: 1,
};

export const PlaceOrderHeader = ({ data }: any) => {
  const [header, setHeader] = useState<String>('');
  const scrollRight = () => {
    let scrollPosition = document.getElementById('header')?.scrollLeft;
    if (scrollPosition || scrollPosition === 0) {
      scrollPosition = scrollPosition + 800;
      document
        .getElementById('header')
        ?.scroll({ left: scrollPosition, behavior: 'smooth' });
    }
  };
  const scrollLeft = () => {
    let scrollPosition = document.getElementById('header')?.scrollLeft;
    if (scrollPosition || scrollPosition === 0) {
      scrollPosition = scrollPosition - 800;
      document
        .getElementById('header')
        ?.scroll({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    let header = '';
    const asset = data.asset === 1 ? 'BTC' : 'ETH' || 'BTC';
    let date = '220121';
    let strike = 300000;
    let instrument = 'P';
    if (data.expiryDate) {
      date = data.expiryDate.replaceAll('/', '').substring(2);
      strike = data.strike;
      instrument = data.instrumentType === 'call' ? 'C' : 'P';
    }
    header = `${asset}-${date}-${strike}-${instrument}`;
    setHeader(header);
  }, [data]);

  return (
    <Grid
      templateColumns="repeat(100, 1fr)"
      borderBottom="2px solid #4E5A71"
      paddingY={'10px'}
    >
      <GridItem colSpan={47}>
        <Flex paddingLeft={'16px'} paddingY={'6px'} paddingRight={0}>
          <Text
            fontWeight={800}
            fontSize={'16px'}
            lineHeight={'28px'}
            whiteSpace={'nowrap'}
          >
            {header}
          </Text>
          <Box paddingRight={'28px'}>
            {data.instrumentType === 'call' ? (
              <Image src={callIcon} maxHeight="28px" maxWidth="28px" />
            ) : (
              <Image src={putIcon} maxHeight="28px" maxWidth="28px" />
            )}
          </Box>
          <Text
            fontWeight={800}
            fontSize={'16px'}
            lineHeight={'28px'}
            paddingRight={'28px'}
          >
            $13,299.00
          </Text>
        </Flex>
      </GridItem>
      <GridItem colSpan={53} overflow={'auto'} className="header" id="header">
        <Box overflow={'none'} padding={0} className="left-button">
          {/* <Button onClick={() => scrollRight()}>{'>'}</Button> */}
        </Box>
        <Flex>
          <Flex flexDir={'column'} alignItems="start">
            <Text fontWeight={400} fontSize={'13px'} textColor={'text.grey'}>
              Change
            </Text>
            {dummyData.change >= 0 ? (
              <Text
                fontWeight={400}
                fontSize={'13px'}
                textColor="text.moneyGreen"
              >
                +{dummyData.change}.00%
              </Text>
            ) : (
              <Text
                fontWeight={400}
                fontSize={'13px'}
                textColor="text.moneyRed"
              >
                -{dummyData.change}.00%
              </Text>
            )}
          </Flex>
          <Flex flexDir={'column'} alignItems="start" paddingLeft={'26px'}>
            <Text
              fontWeight={400}
              fontSize={'13px'}
              textColor={'text.grey'}
              whiteSpace={'nowrap'}
            >
              24h Volume
            </Text>
            <Text
              whiteSpace={'nowrap'}
              fontWeight={700}
              fontSize={'13px'}
              textColor="text.white"
            >
              {dummyData.volume}.000 BTC
            </Text>
          </Flex>
          <Flex flexDir={'column'} alignItems="start" paddingLeft={'26px'}>
            <Text
              whiteSpace={'nowrap'}
              fontWeight={400}
              fontSize={'13px'}
              textColor={'text.grey'}
            >
              Leverage
            </Text>
            <Text fontWeight={700} fontSize={'13px'} textColor="text.white">
              {dummyData.leverage}x
            </Text>
          </Flex>
          <Flex flexDir={'column'} alignItems="start" paddingLeft={'26px'}>
            <Text
              whiteSpace={'nowrap'}
              fontWeight={400}
              fontSize={'13px'}
              textColor={'text.grey'}
            >
              Exchange Rate
            </Text>
            <Text fontWeight={700} fontSize={'13px'} textColor="text.white">
              {dummyData.exRate} BTCUSD
            </Text>
          </Flex>
          <Flex flexDir={'column'} alignItems="start" paddingLeft={'26px'}>
            <Text
              whiteSpace={'nowrap'}
              fontWeight={400}
              fontSize={'13px'}
              textColor={'text.grey'}
            >
              Expirary Date
            </Text>
            <Text fontWeight={700} fontSize={'13px'} textColor="text.white">
              {dummyData.expiraryDate}
            </Text>
          </Flex>
          <Flex flexDir={'column'} alignItems="start" paddingLeft={'26px'}>
            <Text
              whiteSpace={'nowrap'}
              fontWeight={400}
              fontSize={'13px'}
              textColor={'text.grey'}
            >
              Delta
            </Text>
            <Text
              paddingRight={'24px'}
              fontWeight={700}
              fontSize={'13px'}
              textColor="text.white"
            >
              {dummyData.delta}.000
            </Text>
            <Flex flexDir={'column'} alignItems="start" paddingLeft={'26px'}>
              {/* <Button onClick={() => scrollRight()}>{'>'}</Button> */}
            </Flex>
          </Flex>
        </Flex>
      </GridItem>
    </Grid>
  );
};

export const PositionsOpenOrders = () => {
  return (
    <Tabs>
      <TabList>
        <Tab
          padding="16px 0 4px 0"
          marginLeft="16px"
          fontSize="16px"
          fontWeight="700"
          textColor="GrayText"
          lineHeight="28px"
          borderBottom="2px solid transparent"
          _selected={{
            borderBottom: '2px solid #9C7BEE',
            boxShadow: 'none',
            textColor: '#FFF',
          }}
        >
          Positions
        </Tab>
        <Flex
          height="20px"
          width="23px"
          marginLeft="6px"
          marginBottom="10px"
          marginTop="auto"
          borderRadius="10px"
          alignItems="center"
          justifyContent="center"
          backgroundColor="#293141"
          lineHeight="16px"
          fontSize="13px"
        >
          8
        </Flex>
        <Tab
          padding="16px 0 4px 0"
          marginLeft="16px"
          fontSize="16px"
          fontWeight="700"
          textColor="GrayText"
          lineHeight="28px"
          borderBottom="2px solid transparent"
          _selected={{
            borderBottom: '2px solid #9C7BEE',
            boxShadow: 'none',
            textColor: '#FFF',
          }}
        >
          Open Orders
        </Tab>
      </TabList>
    </Tabs>
  );
};

export const AvailableBalance = () => {
  return (
    <Flex>
      <Flex flexDir={'column'}>
        <Box border={'1px solid #4E5A71'} fontSize={'16px'} fontWeight={800}>
          <Text marginTop={'28px'} marginX={'16px'}>
            Available Balance
          </Text>
          <Text marginX={'16px'} marginBottom={'16px'}>
            --
          </Text>
        </Box>
        <Box
          border={'1px solid #4E5A71'}
          fontSize={'16px'}
          fontWeight={800}
          width={'365px'}
          padding={'16px'}
          height={'205px'}
        >
          <Text
            fontSize="13px"
            fontWeight={'400'}
            textColor={'text.grey'}
            lineHeight={'16px'}
          >
            <Flex padding={'4px'} justifyContent={'space-between'}>
              <Text>Account Equity</Text>
              <Text>$--</Text>
            </Flex>
            <Flex padding={'4px'} justifyContent={'space-between'}>
              <Text>Net Unrealized PNL</Text>
              <Text>$--</Text>
            </Flex>
            <Flex padding={'4px'} justifyContent={'space-between'}>
              <Text>Total Maintenance Margin</Text>
              <Text>$--</Text>
            </Flex>
            <Flex padding={'4px'} justifyContent={'space-between'}>
              <Text>Total Initial Margin</Text>
              <Text>$--</Text>
            </Flex>
            <Flex padding={'4px'} justifyContent={'space-between'}>
              <Text>Liquidation Buffer</Text>
              <Text>$--</Text>
            </Flex>
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
};
