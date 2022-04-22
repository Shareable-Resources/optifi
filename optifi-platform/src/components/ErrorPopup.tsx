import React, { useState, useEffect } from "react";
import {
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Text,
  Image
} from '@chakra-ui/react';
import Checkbox from '../assets/icons/checkbox.png';


type ErrorPopupProps = {
  open: boolean,
  onClose: () => void,
}

const ErrorPopup = ({open, onClose, }: ErrorPopupProps) => {
  const { colorMode } = useColorMode();


  return (
    <Modal isOpen={open} onClose={onClose}>
      <ModalOverlay />
      <ModalContent width="40%">
        <ModalCloseButton />
        <ModalBody paddingLeft="1%" paddingRight="1%">
          <Box display="grid" justifyContent="center">
            <Box marginTop="20%" marginLeft="30%">
              <Image src={Checkbox} alt="success-logo" width="10vh"/>
            </Box>
            <Box marginTop="20%" marginBottom="5%">
              <Text>You don't have enough tokens for this transaction.</Text>
            </Box>
          </Box>
        </ModalBody>

        <ModalFooter justifyContent="center">
          <Button width="30%" color={"white"} backgroundColor={"#9C7BEE"} onClick={() => onClose()}>Got it!</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};



export default ErrorPopup;
