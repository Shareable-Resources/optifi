import React from 'react';
import { useHistory } from "react-router-dom";
import { Button } from '@chakra-ui/react';

type StartTradingButtonProps = {
  width: string;
  height: string;
  bgColor?: string;
  children: JSX.Element;
};

export default function StartTradingButton({
  width,
  height,
  bgColor,
  children,
}: StartTradingButtonProps) {
  const history = useHistory();
  return (
    <Button
      layerStyle={'button.base'}
      w={width}
      h={height}
      borderRadius="4px"
      backgroundColor={bgColor}
      onClick={()=>{history.push("/options");}}
    >
      {children}
    </Button>
  );
}
