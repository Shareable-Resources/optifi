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
  Image,
  Flex
} from '@chakra-ui/react';
import Checkbox from "../assets/pages/general/order-pop-up-executed.png";


type SuccessPopupProps = {
  open: boolean,
  onClose: () => void,
}

const SuccessPopup = ({open, onClose, }: SuccessPopupProps) => {
  const { colorMode } = useColorMode();

  return (
    <Modal isOpen={open} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent padding="36px 0">
        <ModalBody>
          <Flex direction="column" alignItems="center" justifyContent="center" marginBottom="20px">
            <Box marginTop="7px" marginBottom="23px">
              <Image src={Checkbox} alt="success-logo" width="10vh"/>
            </Box>
            <Box>
              <Text fontSize="18px" fontWeight="bold" lineHeight="20px">Your order was executed!</Text>
            </Box>
          </Flex>
        </ModalBody>
        <ModalFooter justifyContent="center">
          <Button width="30%" color={"white"} backgroundColor={"#9C7BEE"} borderRadius="4px" onClick={() => onClose()}>Got it!</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};



export default SuccessPopup;
