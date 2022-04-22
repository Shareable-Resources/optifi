import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Grid } from '@chakra-ui/layout';
import {
  Box,
  Image,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
} from '@chakra-ui/react';

import current from '../assets/icons/progressBar/current.svg';
import dot from '../assets/icons/progressBar/dot.svg';
import filled from '../assets/icons/progressBar/filled.svg';

type ProgressSliderProps = {
  progress: number;
  setProgress: Dispatch<SetStateAction<number>>;
  amount: string | undefined;
  setAmount: Dispatch<SetStateAction<string | undefined>>;
  isDeposit: boolean;
  walletBalance: any;
  accountBalance: any;
};
export const ProgressSlider = ({
  isDeposit,
  amount,
  setAmount,
  walletBalance,
  accountBalance,
}: ProgressSliderProps) => {
  const pct = (parseFloat(amount ? amount : '0') / walletBalance) * 100;
  const [progress, setProgress] = useState(amount ? pct : 0);
  const marks: number[] = [0, 25, 50, 75, 100];
  const slider = useRef(null);

  const sliderOnChange = (percentWallet: number) => {
    setProgress(percentWallet);
    let depositAmt;

    if (isDeposit) {
      depositAmt =
        walletBalance !== null ? (percentWallet / 100) * walletBalance : 0;
    } else {
      depositAmt =
        accountBalance !== null ? (percentWallet / 100) * accountBalance : 0;
    }

    if (depositAmt === 0) {
      setAmount('');
    } else {
      setAmount(`${depositAmt}`);
    }
  };

  useEffect(() => {
    if (isDeposit) {
      const pct = (parseFloat(amount ? amount : '0') / walletBalance) * 100;
      setProgress(pct);
    } else {
      const pct = (parseFloat(amount ? amount : '0') / accountBalance) * 100;
      setProgress(pct);
    }
  }, [amount, isDeposit, walletBalance, accountBalance]);

  return (
    <Box>
      <Slider
        aria-label="slider-ex-6"
        onChange={val => sliderOnChange(val)}
        className="progress-slider"
        width="375px"
        defaultValue={0}
        ref={slider}
        value={progress}
        focusThumbOnChange={false}
      >
        {marks.map((mark, index) => {
          return (
            <SliderMark value={mark} zIndex="11" mt="-5px" key={index}>
              {mark > progress ? (
                <Image src={dot} marginLeft="-6px" />
              ) : (
                <Image src={filled} marginLeft="-6px" />
              )}
              <Box
                fontSize="11px"
                lineHeight="6px"
                fontWeight="700"
                marginTop="6px"
                textColor="transparent"
              >
                %
              </Box>
            </SliderMark>
          );
        })}
        <SliderTrack className="progress-track">
          <SliderFilledTrack backgroundColor="#9c7bee" />
        </SliderTrack>
        <SliderThumb bgColor="transparent" zIndex="1000">
          <Image src={current} />
        </SliderThumb>
      </Slider>
      <Grid
        fontSize="11px"
        lineHeight="14px"
        fontWeight="700"
        gridTemplateColumns="1fr 1fr 1fr"
        marginTop="-5px"
      >
        <Box textAlign="left" marginLeft="-7px">
          0%
        </Box>
        <Box textAlign="center">50%</Box>
        <Box textAlign="right" marginRight="-8px">
          100%
        </Box>
      </Grid>
    </Box>
  );
};
