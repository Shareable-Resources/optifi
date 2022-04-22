import { extendTheme } from '@chakra-ui/react';
import { createBreakpoints } from '@chakra-ui/theme-tools';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const colors = {
  theme: {
    primary: '#9C7BEE',
  },
  primary: {
    100: '#50687E',
    200: '#182834',
    300: '#10DE82',
    400: '#0EBE6F',
    500: '#0CA25F',
    600: '#0A864F',
    700: '#086F42',
    800: '#075C37',
    900: '#0B2237',
  },
  button: {
    dark: '#00DBC6',
    light: '#009797',
    colorDark: '#0A1720',
    colorLight: '#FFFFFF',
  },
  header: {
    dark: '#182834',
    light: '#FFFFFF',
  },
  body: {
    dark: '#0A1720',
    light: '#E8EAF1',
  },
  text: {
    lightGray: '#C3D2E0',
    lightGreen: '#63FFDA',
    darkGreen: '#00A154',
    opaqueGray: '#7A91A7',
    moneyGreen: '#34DC9D',
    moneyRed: '#FF4574',
    grey: '#B2B0BC',
    white: '#FFFFFF',
    purple: '#9C7BEE',
  },
  border: {
    primary: '#4E5A71',
  },
  purpleCheckbox: {
    100: '#9C7BEE',
    200: '#9C7BEE',
    300: '#9C7BEE',
    400: '#9C7BEE',
    500: '#9C7BEE',
    600: '#9C7BEE',
    700: '#9C7BEE',
    800: '#9C7BEE',
  },
};

const shadows = {
  outline: 'none',
};

const fonts = {
  fonts: {
    heading: 'Open Sans',
    body: 'Open Sans',
    mono: 'Open Sans',
  },
};

const textStyles = {
  landingPage: {
    sectionTitle: {
      fontSize: '36px',
      fontWeight: '800',
      lineHeight: '40px',
    },
    description: {
      fontSize: '16px',
      lineHeight: '24px',
      color: 'text.grey',
    },
  },
};

const layerStyles = {
  button: {
    base: {
      color: '#ffffff',
      backgroundColor: 'theme.primary',
    },
  },
};
const breakpoints = createBreakpoints({
  sm: '320px',
  md: '768px',
  lg: '960px',
  xl: '1200px',
  '2xl': '1536px',
});

const customTheme = extendTheme({
  config,
  colors,
  fonts,
  textStyles,
  layerStyles,
  shadows,
  breakpoints,
});

export default customTheme;
