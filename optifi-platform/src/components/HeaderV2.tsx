import React, { Dispatch, SetStateAction, useState } from 'react';

// chakra UI
import { Box, Flex } from '@chakra-ui/layout';
import { Tab, TabList, Tabs } from '@chakra-ui/tabs';

import '../assets/scss/_headerV2.scss';
import trade from '../assets/icons/trade.svg';

// components
import { CoinTab, CoinTabProps } from './CoinTab';

// icons
import burger from '../assets/icons/burger.svg';
import { Image } from '@chakra-ui/image';
import WalletButton from './WalletButton';
import OptifiLogo from '../assets/icons/optifi-logo-text.png';
import { useHistory } from 'react-router';

type HeaderV2Props = { coinTabs: CoinTabProps[] };
export const HeaderV2 = ({ coinTabs }: HeaderV2Props) => {
  const [navIsOpen, setNavIsOpen] = useState(false);
  return (
    <>
      <Flex
        flexDir={{ base: 'column', md: 'row' }}
        borderBottom="2px solid #4E5A71"
        alignItems="center"
        justifyContent={{ base: 'center', md: 'start' }}
        paddingRight="16px"
      >
        <NavMenuButton openNav={setNavIsOpen} />
        <Tabs variant="unstyled" marginTop={{ base: '15px', md: '0' }}>
          <TabList>
            {coinTabs.map(coin => {
              return (
                <Tab
                  _selected={{ bg: '#293141', boxShadow: 'none' }}
                  padding="0"
                  key={coin.name}
                >
                  <CoinTab
                    name={coin.name}
                    price={coin.price}
                    DVOL={coin.DVOL}
                    gaining={coin.gaining}
                    logo={coin.logo}
                  />
                </Tab>
              );
            })}
          </TabList>
        </Tabs>
        <Flex
          marginLeft={{ base: '0', md: 'auto' }}
          marginY={{ base: '15px', md: '0' }}
        >
          <WalletButton />
        </Flex>
      </Flex>
      <NavMenuSidebar isOpen={navIsOpen} setIsOpen={setNavIsOpen} />
    </>
  );
};

type NavMenuButtonProps = {
  openNav: Dispatch<SetStateAction<boolean>>;
};
const NavMenuButton = ({ openNav }: NavMenuButtonProps) => {
  const history = useHistory();
  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      marginRight="22px"
      paddingLeft="19px"
      marginTop={{ base: '15px', md: '0' }}
    >
      <Box
        _hover={{ backgroundColor: '#364051' }}
        cursor="pointer"
        borderRadius="50%"
        padding="5px"
        onClick={() => openNav(true)}
      >
        <Image src={burger} height="30px" />
      </Box>
      <Box onClick={() => history.push('/')} cursor="pointer">
        <Image src={OptifiLogo} height="30px" marginLeft="23px" />
      </Box>
    </Flex>
  );
};

type NavMenuSidebarProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};
const NavMenuSidebar = ({ isOpen, setIsOpen }: NavMenuSidebarProps) => {
  const history = useHistory();
  const links = ['Futures', 'Options'];
  return (
    <>
      {isOpen && (
        <Flex
          width="100%"
          height="100%"
          backgroundOp
          position="fixed"
          top="0"
          zIndex="100"
        >
          <Box
            onClick={e => setIsOpen(false)}
            background="rgba(29, 36, 48, .7)"
            width="full"
            height="100%"
          ></Box>
        </Flex>
      )}
      <Box
        className={isOpen ? 'sidebar-menu open' : 'sidebar-menu'}
        zIndex="105"
        backgroundColor="#293141"
        height="100%"
        paddingY="48px"
      >
        <Flex
          fontSize="20px"
          lineHeight="24px"
          fontWeight="700"
          marginLeft="24px"
          marginBottom="16px"
        >
          <Image src={trade} />
          Trade
        </Flex>
        {links.map((link, index) => (
          <Box
            key={index}
            paddingLeft="48px"
            _hover={{ backgroundColor: '#364051' }}
            fontWeight="700"
            fontSize="16px"
            lineHeight="20px"
            paddingY="8px"
            cursor="pointer"
            onClick={() => {
              setIsOpen(false);
              history.push(`/${link.toLocaleLowerCase()}`);
            }}
          >
            {link}
          </Box>
        ))}
      </Box>
    </>
  );
};
