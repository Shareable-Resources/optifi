import React, { MouseEventHandler } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Flex, Image, Link, Text, Stack, useColorMode } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import WalletButton from './WalletButton';
import LogoImg from '../assets/icons/optifi-logo-text.png';

import HeaderLanding from './HeaderLanding';

type MenuToggleProps = {
  toggle: MouseEventHandler;
  isOpen: boolean;
};

type MenuItemProps = {
  children: string;
  isLast: boolean;
  to: string;
};
type MenuLinksProps = {
  isOpen: boolean;
};
type NavBarContainerProps = {
  children: JSX.Element;
  mode: string;
};

const NavBar = (props: any) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = () => setIsOpen(!isOpen);
  const { colorMode } = useColorMode();

  if (location.pathname === '/') {
    return <HeaderLanding />;
  } else {
    return (
      <NavBarContainer mode={colorMode} {...props}>
        <Link href="/">
          <Image src={LogoImg} alt="optifi-logo" />
        </Link>
        <MenuToggle toggle={toggle} isOpen={isOpen} />
        <MenuLinks isOpen={isOpen} />
      </NavBarContainer>
    );
  }
};

const CloseIcon = () => (
  <svg width="24" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <title>Close</title>
    <path
      fill="white"
      d="M9.00023 7.58599L13.9502 2.63599L15.3642 4.04999L10.4142 8.99999L15.3642 13.95L13.9502 15.364L9.00023 10.414L4.05023 15.364L2.63623 13.95L7.58623 8.99999L2.63623 4.04999L4.05023 2.63599L9.00023 7.58599Z"
    />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="24px"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    fill="white"
  >
    <title>Menu</title>
    <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
  </svg>
);

const MenuToggle = ({ toggle, isOpen }: MenuToggleProps) => {
  return (
    <Box display={{ base: 'block', md: 'none' }} onClick={toggle}>
      {isOpen ? <CloseIcon /> : <MenuIcon />}
    </Box>
  );
};

const MenuItem = ({ children, isLast, to = '/' }: MenuItemProps) => {
  return (
    <NavLink
      to={to}
      style={{ color: '#B2B0BC', padding: '8px' }}
      activeStyle={{
        color: '#ffffff',
        borderBottom: '3px solid #9C7BEE',
        marginBottom: '-3px',
      }}
    >
      <Text fontWeight="bold">{children}</Text>
    </NavLink>
  );
};

const MenuLinks = ({ isOpen }: MenuLinksProps) => {
  return (
    <Box
      display={{ base: isOpen ? 'block' : 'none', md: 'flex' }}
      flexBasis={{ base: '100%', md: '60%' }}
    >
      <Stack spacing={4} align="center" direction={['row', 'row']}>
        {/* <MenuItem isLast={false} to="/dashboard">
          Dashboard
        </MenuItem> */}
        <MenuItem isLast={false} to="/options">
          Options
        </MenuItem>
        {/* <MenuItem isLast={false} to="/wallet">
          Your Wallet
        </MenuItem> */}
        <MenuItem isLast={false} to="/dev">
          Development
        </MenuItem>
      </Stack>
      <Stack
        spacing={8}
        align="center"
        justify={['flex-end', 'flex-end']}
        direction={['row', 'row']}
        style={{ marginLeft: 'auto' }}
      >
        {/* <ColorModeSwitcher /> */}
        <WalletButton />
      </Stack>
    </Box>
  );
};

const NavBarContainer = ({ children, mode }: NavBarContainerProps) => {
  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      w="100%"
      p="22px 72px"
      bg={'#293141'}
      color={['white', 'white', 'primary.700', 'primary.700']}
    >
      {children}
    </Flex>
  );
};

export default NavBar;
