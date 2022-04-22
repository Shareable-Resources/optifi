import React from 'react';

// Charka
import { Box } from '@chakra-ui/react';

type TooltipProps = {
  title: string;
  description: string;
  isDelta?: boolean;
  isPut?: boolean;
  isStrike?: boolean;
};
export const Tooltip = ({
  title,
  description,
  isPut = false,
}: TooltipProps) => {
  return (
    <Box
      className="tooltip-text"
      left={isPut ? 'initial' : '0'}
      right={isPut ? '0' : 'initial'}
      padding="12px"
      backgroundColor="#364051"
      width="144px"
      maxWidth="144px"
      borderRadius="4px"
      marginTop="10px"
      whiteSpace="normal"
      textTransform="initial"
      fontFamily="almarai"
      textAlign="left"
    >
      <Box
        marginBottom="4px"
        fontWeight="700"
        fontSize="11px"
        lineHeight="13px"
        textColor="#9C7BEE"
      >
        {title}
      </Box>
      <Box
        margin="0"
        fontSize="11px"
        fontWeight="400"
        lineHeight="14px"
        textColor="white"
      >
        {description}
      </Box>
    </Box>
  );
};
