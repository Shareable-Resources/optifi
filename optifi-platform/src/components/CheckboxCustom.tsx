import { Image } from '@chakra-ui/image';
import { Box, Flex } from '@chakra-ui/layout';
import React, { Dispatch, SetStateAction } from 'react';
import check from '../assets/icons/check.svg';

type CheckboxCustomProps = {
  checked: boolean;
  setChecked: Dispatch<SetStateAction<boolean>>;
  title: string;
};
export const CheckboxCustom = ({
  checked,
  setChecked,
  title,
}: CheckboxCustomProps) => {
  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      onClick={() => (checked ? setChecked(false) : setChecked(true))}
    >
      {checked ? (
        <Flex
          width="20px"
          height="20px"
          alignItems="center"
          justifyContent="center"
          border="1px solid #4E5A71"
          backgroundColor="#9C7BEE"
          borderRadius="2px"
        >
          <Image src={check} />
        </Flex>
      ) : (
        <Flex
          width="20px"
          height="20px"
          alignItems="center"
          justifyContent="center"
          border="1px solid #4E5A71"
          backgroundColor="#293141"
          borderRadius="2px"
        ></Flex>
      )}
      <Box
        ml="5px"
        lineHeight="20px"
        fontSize="13px"
        textColor="text.white"
        whiteSpace="nowrap"
      >
        {title}
      </Box>
    </Flex>
  );
};
