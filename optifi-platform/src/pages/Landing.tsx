import React, { useState, useEffect, useRef } from 'react';
import {
  chakra,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Image,
  Text,
} from '@chakra-ui/react';
import { Tween, Timeline } from 'react-gsap';
import ScrollMagic from 'scrollmagic';

import SolanaLogoImg from '../assets/pages/landing/background-solana-logo.png';
import BackgroundShowcaseImg from '../assets/pages/landing/background-showcase.png';
import VolumeSeparatorImg from '../assets/pages/landing/volume-separator.png';

import WhyTradeDecentralizedImg from '../assets/pages/landing/why-trade-decentralized.png';
import WhyTradePermissionlessImg from '../assets/pages/landing/why-trade-permissionless.png';
import WhyTradeNonCustodialImg from '../assets/pages/landing/why-trade-non-custodial.png';

import StartTradingBackgroundImg from '../assets/pages/landing/start-trading-background.png';

import HowItWorkCompletedIcon from '../assets/pages/landing/how-it-work-completed-icon.png';
import HowItWorkInProgressIcon from '../assets/pages/landing/how-it-work-in-progress-icon.png';
import HowItWorkStep01Img from '../assets/pages/landing/how-it-work-step-01.png';
import HowItWorkStep02Img from '../assets/pages/landing/how-it-work-step-02.png';
import HowItWorkStep03Img from '../assets/pages/landing/how-it-work-step-03.png';

// Components
import Accordion from '../components/Accordion';
import StartTradingButton from '../components/StartTradingButton';

import '../assets/scss/landing.scss';

type SectionBoxProps = {
  children: JSX.Element;
  section: string;
};

const SectionBox = ({ section, children }: SectionBoxProps) => {
  let boxStyle = {
    h: 'auto',
    mx: 20,
    p: '80px 64px',
    backgroundImage: '',
    backgroundColor: 'transparent',
    backgroundPosition: 'initial',
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto',
  };
  switch (section) {
    case 'volume':
      boxStyle = {
        ...boxStyle,
        p: '40px 64px',
      };
      break;
    case 'start-trading':
      boxStyle = {
        ...boxStyle,
        h: '288px',
        mx: 0,
        backgroundImage: StartTradingBackgroundImg,
        backgroundColor: 'theme.primary',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 288px',
      };
      break;
    default:
      break;
  }
  return <Box {...boxStyle}>{children}</Box>;
};

// Background
const Background = () => {
  return (
    <SectionBox section="background">
      <Flex
        direction="column"
        backgroundImage={BackgroundShowcaseImg}
        backgroundPosition="right"
        backgroundRepeat="no-repeat"
        h="540px"
        justify="center"
      >
        <Flex mb={4}>
          <chakra.span
            marginRight="12px"
            fontWeight="bold"
            fontSize="12px"
            lineHeight="24px"
          >
            POWERED BY
          </chakra.span>
          <Image src={SolanaLogoImg} alt="solana-logo" />
        </Flex>
        <Box fontWeight="800" fontSize="52px" lineHeight="58px" mb={4} w="60%">
          Optifi: The <chakra.span color="theme.primary">Best</chakra.span>{' '}
          Crypto Derivatives Trading Platform
        </Box>
        <Text textStyle="landingPage.description" mb={10}>
          Decentralized, permissionless, non-custodial, lightning-fast.
        </Text>
        <StartTradingButton width="212px" height="48px">
          <chakra.span fontWeight="800" fontSize="18px" lineHeight="20px">
            Start Trading
          </chakra.span>
        </StartTradingButton>
      </Flex>
    </SectionBox>
  );
};

// Volume
type VolumeItemProps = {
  type: String;
};

const VolumeItem = ({ type }: VolumeItemProps) => {
  return (
    <Flex
      direction="column"
      justify="center"
      align={type === 'cumulative-volume' ? 'flex-end' : 'flex-start'}
    >
      <chakra.span
        fontWeight="bold"
        fontSize="16px"
        lineHeight="24px"
        color="text.grey"
      >
        {type === 'cumulative-volume'
          ? 'Cumulative Volume'
          : '24hr Trading Volume'}
      </chakra.span>
      <chakra.span fontWeight="800" fontSize="40px" lineHeight="48px">
        $2,000,000.00
      </chakra.span>
    </Flex>
  );
};

const Volume = () => {
  return (
    <SectionBox section="volume">
      <Flex align="center" justify="center">
        <Flex>
          <VolumeItem type="cumulative-volume" />
          <Image
            src={VolumeSeparatorImg}
            alt="vertical-line-separator"
            mx="48px"
          />
          <VolumeItem type="24hr-volume" />
        </Flex>
      </Flex>
    </SectionBox>
  );
};

// Why Trade at Optifi
type WhyTradeItemProps = {
  imgSrc: string;
  imgAlt: string;
  title: string;
  description: string;
};

const WhyTradeItem = ({
  imgSrc,
  imgAlt,
  title,
  description,
}: WhyTradeItemProps) => {
  return (
    <Flex direction="column" w="25%" justifyContent="center">
      <Image src={imgSrc} alt={imgAlt} boxSize="100px" mb={4}></Image>
      <chakra.span fontWeight="800" fontSize="20px" lineHeight="28px" mb={2}>
        {title}
      </chakra.span>
      <chakra.span textStyle="landingPage.description">
        {description}
      </chakra.span>
    </Flex>
  );
};

const WhyTrade = () => {
  return (
    <SectionBox section="whyTrade">
      <Flex direction="column" align="center">
        <Box textStyle="landingPage.sectionTitle" mb={20}>
          Why Trade at <chakra.span color="theme.primary">Optifi</chakra.span>?
        </Box>
        <HStack
          spacing={9}
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <WhyTradeItem
            imgSrc={WhyTradeDecentralizedImg}
            imgAlt="decentralized-icon"
            title="Decentralized"
            description="OptiFi is built on Solana - today's most performant blockchain, allowing for all-encompassing on-chain functionalities and resulting in a purely decentralized solution for derivatives traders."
          />
          <WhyTradeItem
            imgSrc={WhyTradePermissionlessImg}
            imgAlt="permissionless-icon"
            title="Permissionless"
            description="All you'll ever need to start trading on OptiFi is a wallet containing crypto assets, that's it! We built an ecosystem for the inherent freedoms granted by the future of finance, and we're here to stay."
          />
          <WhyTradeItem
            imgSrc={WhyTradeNonCustodialImg}
            imgAlt="non-custodial-icon"
            title="Non-Custodial"
            description="Your assets will stay with you; you'll have sole control of your keys and cryptocurrencies, all along, as it should be."
          />
        </HStack>
      </Flex>
    </SectionBox>
  );
};

// How It Works?
type HowItWorkProgressItemProp = {
  id: number;
  title: string;
  currentPercentage: number;
  handleClick: () => void;
};

const HowItWorkProgressItem = ({
  id,
  title,
  currentPercentage,
  handleClick,
}: HowItWorkProgressItemProp) => {
  let itemPercentage = (id - 1) * 0.5; // item1=0, item2=0.5, item3=1
  let isActive: boolean = currentPercentage >= itemPercentage ? true : false;
  return (
    <Flex
      w="33%"
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
      _hover={{ cursor: 'pointer' }}
      onClick={() => {
        handleClick();
      }}
    >
      <Image
        src={isActive ? HowItWorkCompletedIcon : HowItWorkInProgressIcon}
        alt="progress-icon"
        boxSize={'16px'}
        mb="27px"
        transform={isActive ? 'scale(1.765)' : 'none'}
      />
      <Box
        textAlign="center"
        fontWeight="800"
        fontSize="16px"
        lineHeight="20px"
      >
        {title}
      </Box>
    </Flex>
  );
};

type currentStepProps = {
  id: number;
  description: string;
  image: string;
};

const HowItWork = () => {
  const progressItems: Array<{
    id: number;
    title: string;
    description: string;
    isActive: boolean;
    image: string;
  }> = [
    {
      id: 1,
      title: 'CONNECT WALLET',
      description: 'Connect your wallet and choose an underlying asset.',
      isActive: true,
      image: HowItWorkStep01Img,
    },
    {
      id: 2,
      title: 'GO TO THE OPTION CHAIN',
      description:
        'Go to the oprion chain, pick-and-choose strike, and maturity on a put or call option and complete the trade.',
      isActive: false,
      image: HowItWorkStep02Img,
    },
    {
      id: 3,
      title: 'UNLIMITED YIELD LIMITED LOSSES',
      description:
        "When a contract reaches maturity, receive unlimited yield if you're in-the-money, or absorb only limited losses if you're out-of-the-money.",
      isActive: false,
      image: HowItWorkStep03Img,
    },
  ];

  const [currentPercentage, setCurrentPercentage] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<currentStepProps>({
    id: 0,
    description: '',
    image: '',
  });

  // scrollmagic
  const [controller, setController] = useState<any>(null);
  const [scene, setScene] = useState<any>(null);

  // calculate currentStep object if currentPercentage change
  useEffect(() => {
    let currentStep;
    if (currentPercentage === 1) {
      currentStep = 3;
    } else if (currentPercentage >= 0.5 && currentPercentage < 1) {
      currentStep = 2;
    } else {
      currentStep = 1;
    }
    let item = progressItems[currentStep - 1];
    setCurrentStep(item);
  }, [currentPercentage]);

  const onStepClick = (id: number) => {
    let progress: number = -1;
    switch (id) {
      case 1:
        progress = 0;
        break;
      case 2:
        progress = 0.5;
        break;
      case 3:
        progress = 1;
        break;
      default:
        break;
    }
    controller.scrollTo(scene.triggerPosition() + progress * scene.duration());
    setCurrentPercentage((id - 1) * 0.5);
  };

  useEffect(() => {
    const scrollController = new ScrollMagic.Controller({
      globalSceneOptions: { triggerHook: 'onLeave' },
    });
    const scrollScene = new ScrollMagic.Scene({
      triggerElement: '#pin',
      duration: 2000,
      offset: -50,
    })
      .setPin('#pin')
      .on('progress', function (e: any) {
        console.log(e.progress);
        let progress = e.progress;
        setCurrentPercentage(progress);
      });
    scrollScene.addTo(scrollController);

    setController(scrollController);
    setScene(scrollScene);
    return () => {
      scrollController.removeScene(scrollScene);
    };
  }, []);

  return (
    <SectionBox section="howItWork">
      <Box>
        <div id="pin">
          <Timeline paused>
            <Tween>
              <Flex direction="column" alignItems="center">
                <Box textStyle="landingPage.sectionTitle" mb="60px">
                  How It <chakra.span color="theme.primary">Works?</chakra.span>
                </Box>
                <Flex
                  direction="column"
                  position="relative"
                  alignItems="center"
                  w="80%"
                >
                  <Box
                    position="absolute"
                    top="7px"
                    zIndex={-1}
                    left="17%"
                    right="17%"
                    height="1px"
                    backgroundColor="#6A6A6A"
                  >
                    <Box
                      className="check-progress"
                      width={`${currentPercentage * 100}%`}
                      position="absolute"
                      top={0}
                      bottom={0}
                      left={0}
                      backgroundColor="theme.primary"
                    />
                  </Box>
                  <Flex justifyContent="space-between" mb="85px" w="100%">
                    {progressItems.map(item => {
                      return (
                        <HowItWorkProgressItem
                          key={item.id}
                          id={item.id}
                          title={item.title}
                          currentPercentage={currentPercentage}
                          handleClick={() => {
                            onStepClick(item.id);
                          }}
                        />
                      );
                    })}
                  </Flex>
                </Flex>
                <div
                  key={currentStep.id}
                  data-aos="fade-up"
                  data-aos-delay="100"
                  data-aos-duration="1000"
                >
                  <Flex justifyContent="space-between" w="100%">
                    <Flex direction="column" w="40%" justifyContent="center">
                      <Box textStyle="landingPage.sectionTitle" mb="16px">
                        Step {currentStep.id}
                      </Box>
                      <Box fontSize="18px" lineHeight="26px" color="text.grey">
                        {currentStep.description}
                      </Box>
                    </Flex>
                    <Image
                      src={currentStep.image}
                      alt={`step-0${currentStep.id}-image`}
                    ></Image>
                  </Flex>
                </div>
              </Flex>
            </Tween>
          </Timeline>
        </div>
      </Box>
    </SectionBox>
  );
};

// FAQ
const Faq = () => {
  const faqs = [
    {
      id: 1,
      title: 'What is a call/put option?',
      description:
        'An option is a contract giving the buyer the right, but not the obligation, to buy (in the case of a call option contract) or sell (in the case of a put option contract) the underlying asset at a specific price on a certain date.',
    },
    {
      id: 2,
      title: 'How are options on OptiFi priced?',
      description:
        'Optify options are european and are priced by market makers. But usually, the reference mathematical model for options pricing is Standard black scholes model.<br/><br/>https://www.investopedia.com/articles/optioninvestor/07/options_beat_market.asp <br/><br/>All the margining and collateral valuation is done using black-scholes model.',
    },
    {
      id: 3,
      title: 'When is my option in profit (in-the-money)?',
      description:
        'A call option has unlimited potential profit (in-the-money) as the level of the underlying assets increases, and a potential loss limited to the premium paid for the call option contract. A put option has substantial potential profit (in-the-money) that increases as the level of the underlying asset decreases to zero, and a potential loss that is limited to the premium paid for the put option contract.',
    },
    {
      id: 4,
      title:
        'Do I need the capital to buy the underlying asset when exercising my options?',
      description:
        'No, OptiFi options do not pay out the underlying asset, rather just the difference between the price at the time of exercising and the strike price.',
    },
    {
      id: 5,
      title:
        'When can I exercise my option, and what happens when my option expires?',
      description:
        'OptiFi options are European style options, meaning that they can only be exercised when at maturity. If your contract is in-the-money, OptiFi will auto-exercise the contract and disburse the payoff to your wallet. If the contract matures out-of-the-money, the option will not be exercised and the contract will simply expire.',
    },
  ];
  return (
    <SectionBox section="faq">
      <Flex direction="column">
        <Box textStyle="landingPage.sectionTitle" textAlign="center" mb="60px">
          FAQ
        </Box>
        <Accordion items={faqs} />
      </Flex>
    </SectionBox>
  );
};

// Start Trading Options with Optifi Now.
const StartTrading = () => {
  return (
    <SectionBox section="start-trading">
      <Flex
        h="100%"
        direction="column"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box textStyle="landingPage.sectionTitle">
          Start Trading Derivatives with Optifi Now.
        </Box>
        <Box>
          <StartTradingButton width="212px" height="48px" bgColor="#081518">
            <chakra.span fontWeight="800" fontSize="18px" lineHeight="20px">
              Start Trading
            </chakra.span>
          </StartTradingButton>
        </Box>
      </Flex>
    </SectionBox>
  );
};

function Landing() {
  return (
    <Box>
      <Background />
      <Volume />
      <WhyTrade />
      <HowItWork />
      <Faq />
      <StartTrading />
    </Box>
  );
}

export default Landing;
