import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { Box } from '@chakra-ui/layout';
import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import { Tab, TabList, Tabs } from '@chakra-ui/tabs';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { useEffect, useState } from 'react';
import { OpenOrder, OpenOrderItem } from './OpenOrderItem';
import { Position, PositionItem } from './PositionItem';
import spinner, { Spinner } from '@chakra-ui/spinner';

type Order = Position | OpenOrder;

type OrderListProps = {
  isWalletConnected: Boolean;
  showPositions: Boolean;
  list: Order[] | undefined;
};

const OrderList = ({
  isWalletConnected,
  showPositions,
  list,
}: OrderListProps) => {
  if (!isWalletConnected)
    return (
      <Box
        height="209px"
        paddingLeft="16px"
        paddingTop="25px"
        lineHeight="16px"
        fontSize="12px"
        textColor="text.grey"
      >
        Please connect your wallet.
      </Box>
    );

  if (list === undefined)
    return (
      <Flex minHeight="209px" justifyContent="center" alignItems="center">
        <Spinner />
      </Flex>
    );

  if (showPositions)
    return (
      <Box maxHeight="209px" overflowY="scroll">
        {list?.map((position, id) => {
          return <PositionItem position={position as Position} key={id} />;
        })}
      </Box>
    );

  return (
    <Box maxHeight="209px" overflowY="scroll">
      {list?.map((order, id) => {
        return <OpenOrderItem order={order as OpenOrder} key={id} />;
      })}
    </Box>
  );
};

type PositionOrderProps = {
  positions: Position[] | undefined;
  openOrders: OpenOrder[] | undefined;
};

export const PositionOrder = ({
  positions,
  openOrders,
}: PositionOrderProps) => {
  const options = ['All', 'Options', 'Futures'];
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [filteredPositions, setFilteredPositions] = useState(positions);
  const [filteredOpenOrders, setFilteredOpenOrders] = useState<
    OpenOrder[] | undefined
  >(openOrders ? openOrders : []);
  const wallet = useWallet();
  const [showPositions, setShowPositions] = useState(true);

  // Dropdown Filter for both positions & open orders
  useEffect(() => {
    const positionFilterChange = () => {
      switch (selectedFilter) {
        case 'Options':
          return positions?.filter(position => position.strike);
        case 'Futures':
          return positions?.filter(position => position.strike === undefined);
        default:
          return positions;
      }
    };
    const orderFilterChange = () => {
      if (openOrders) {
        switch (selectedFilter) {
          case 'Options':
            return openOrders.filter(pos => pos.strike > 0);
          case 'Futures':
            return openOrders.filter(pos => pos.strike === undefined);
          default:
            return openOrders;
        }
      }
    };
    if (showPositions) {
      setFilteredPositions(positionFilterChange());
    } else {
      setFilteredOpenOrders(orderFilterChange());
    }
  }, [selectedFilter, positions, openOrders, showPositions]);

  return (
    <Box overflow="hidden">
      <Flex>
        <Tabs variant="unstyled" _selected={{ boxShadow: 'none' }}>
          <TabList fontSize="16px" fontWeight="700" lineHeight="28px">
            <Flex>
              <Tab
                onClick={() => setShowPositions(true)}
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
                <Box>Positions</Box>
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
                {positions?.length ?? 0}
              </Flex>
            </Flex>
            <Flex>
              <Tab
                onClick={() => setShowPositions(false)}
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
                <Box>Open Orders</Box>
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
                {openOrders ? openOrders.length : '0'}
              </Flex>
            </Flex>
          </TabList>
        </Tabs>
        <Menu>
          {({ isOpen }) => (
            <>
              <MenuButton
                marginLeft="auto"
                marginRight="18px"
                textAlign="left"
                marginTop="18px"
                padding="6px 8px"
                width="90px"
                _hover={{ backgroundColor: '#293141', boxShadow: 'none' }}
                _active={{ backgroundColor: '#293141' }}
                _visited={{ backgroundColor: '#293141', boxShadow: 'none' }}
                _focus={{ backgroundColor: '#293141', boxShadow: 'none' }}
                borderRadius="4px"
                backgroundColor="#293141"
                maxHeight="24px"
                border="1px solid #4E5A71"
                lineHeight="12px"
                fontSize="12px"
                isActive={isOpen}
                as={Button}
                rightIcon={
                  isOpen ? (
                    <TriangleUpIcon
                      textColor="theme.primary"
                      marginLeft="17px"
                    />
                  ) : (
                    <TriangleDownIcon
                      marginLeft="17px"
                      textColor="theme.primary"
                    />
                  )
                }
              >
                <Box lineHeight="12px">{selectedFilter}</Box>
              </MenuButton>
              <MenuList
                minWidth="0"
                width="90px"
                border="1px solid #4E5A71"
                backgroundColor="#293141"
                paddingTop="6px"
                paddingBottom="0"
              >
                {options.map(option => {
                  return (
                    <MenuItem
                      key={option}
                      _hover={{ backgroundColor: '#4E5A71' }}
                      _focus={{ backgroundColor: '#4E5A71' }}
                      marginBottom="10px"
                      paddingY="6px"
                      paddingTop="8px"
                      fontWeight="700"
                      fontSize="12px"
                      lineHeight="12px"
                      textColor={
                        selectedFilter === option ? 'text.grey' : '#fff'
                      }
                      onClick={() => setSelectedFilter(option)}
                    >
                      {option}
                    </MenuItem>
                  );
                })}
              </MenuList>
            </>
          )}
        </Menu>
      </Flex>
      <OrderList
        isWalletConnected={wallet.connected}
        showPositions={showPositions}
        list={showPositions ? filteredPositions : filteredOpenOrders}
      />
    </Box>
  );
};
