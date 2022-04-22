import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Text,
  Center,
  Image,
} from '@chakra-ui/react';
import Error from '../assets/icons/Error.svg';
import Success from '../assets/icons/Success.svg';

type ErrorPopupProps = {
  open: boolean;
  onClose: () => void;
  fail: boolean;
  message?: String;
};

const ErrorSuccessPopUp = ({
  open,
  onClose,
  fail,
  message,
}: ErrorPopupProps) => {
  return (
    <Modal isOpen={open} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent maxW="22.5rem" paddingTop={'32px'}>
        <ModalBody>
          <Box display="grid" justifyContent="center">
            <Center paddingBottom={'12%'}>
              {fail ? (
                <Image src={Error} width={'60px'} height={'60px'}></Image>
              ) : (
                <Image src={Success} width={'60px'} height={'60px'}></Image>
              )}
            </Center>
            <Box alignContent={'center'}>
              {fail ? (
                <Text
                  align={'center'}
                  fontWeight={700}
                  fontSize={'18px'}
                  lineHeight={'20px'}
                >
                  {message}
                </Text>
              ) : (
                <Text
                  align={'center'}
                  fontWeight={700}
                  fontSize={'18px'}
                  lineHeight={'20px'}
                >
                  {message}
                </Text>
              )}
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter justifyContent="center">
          <Button
            width="30%"
            color={'white'}
            backgroundColor={'#9C7BEE'}
            fontWeight={800}
            fontSize={'14px'}
            lineHeight={'20px'}
            onClick={() => onClose()}
          >
            {fail ? (
              <Text fontWeight={800} fontSize={'14px'} lineHeight={'20px'}>
                OK
              </Text>
            ) : (
              'Got It!'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ErrorSuccessPopUp;
