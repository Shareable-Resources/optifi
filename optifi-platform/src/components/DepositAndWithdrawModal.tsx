import React, {
  Dispatch,
  FormEvent,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Box, Flex, Text } from '@chakra-ui/layout';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  Button,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
} from '@chakra-ui/react';

import X from '../assets/icons/x.svg';
import walletIcon from '../assets/icons/wallet.svg';
import { formatToUSD } from '../utils/formatters';
import { ProgressSlider } from './ProgressSlider';
import { useWallet } from '@solana/wallet-adapter-react';
import GlobalContext from '../contexts/globalContext';
import { deposit, withdraw } from '@optifi/optifi-sdk';
import { findUserUSDCAddress } from '@optifi/optifi-sdk/lib/utils/accounts';
import WalletButton from '../components/WalletButton';
import SuccessPopup from './SuccessPopup';
import ErrorPopup from './ErrorPopup';
import { getUserBalance } from './MyBalance';
import ErrorSuccessPopUp from './ErrorSuccessPopUp';

type DepositAndWithdrawModalProps = {
  isDeposit: boolean;
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  accountBalance: number | null;
  setAccountBalance: Dispatch<SetStateAction<number | null>>;
};
export const DepositAndWithdrawModal = ({
  isDeposit,
  isModalOpen,
  setIsModalOpen,
  accountBalance,
  setAccountBalance,
}: DepositAndWithdrawModalProps) => {
  const [amount, setAmount] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFail1, setShowFail1] = useState(false);
  const [showFail2, setShowFail2] = useState(false);
  const [percentWallet, setPercentWallet] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const { context, userWallet } = useContext(GlobalContext);
  const wallet = useWallet();

  // get Wallet Balance
  useEffect(() => {
    const getAccBal = async () => {
      if (
        userWallet.wallet.name !== '' &&
        userWallet.wallet.name !== null &&
        Object.getOwnPropertyNames(context).length !== 0
      ) {
        findUserUSDCAddress(context).then(([userUSDCAddress, _]) => {
          context.connection
            .getTokenAccountBalance(userUSDCAddress)
            .then(tokenAmount => {
              setWalletBalance(tokenAmount.value.uiAmount);
            })
            .catch(err => {
              console.log(err);
              setWalletBalance(null);
            });
        });
      }
      setWalletBalance(null);
    };
    getAccBal();
  }, [userWallet, context]);

  // set deposit amount based on slider
  useEffect(() => {
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
  }, [percentWallet, walletBalance, accountBalance, isDeposit]);

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onDepositWithdrawClick();
    setIsLoading(true);
  };

  const depositWithdrawButton = (
    <Button
      isDisabled={amount === '0' || amount === '' || isLoading ? true : false}
      _disabled={{
        textColor: '#B2B0BC',
        backgroundColor: '#4E5A71',
        pointerEvents: 'none',
      }}
      type="submit"
      width="full"
      _hover={{ backgroundColor: '' }}
      fontWeight="800"
      fontSize="14px"
      lineHeight="20px"
      borderRadius="8px"
      textColor={'#FFF'}
      backgroundColor={'theme.primary'}
    >
      {isLoading ? <Spinner /> : isDeposit ? 'Deposit' : 'Withdraw'}
    </Button>
  );

  const onDepositWithdrawClick = async () => {
    if (amount) {
      const amountInput = parseFloat(amount);
      if (!isNaN(amountInput) && amountInput > 0) {
        if (isDeposit) {
          try {
            const response = await deposit(context, amountInput);
            if (response.successful) {
              setShowSuccess(true);
              if (accountBalance !== null) {
                setAccountBalance(accountBalance + amountInput);
              }
            }
            onClose();
          } catch (err: any) {
            console.log(err);
            onClose();
            if (err.resultType === 1) {
              // Insufficient Fund
              setShowFail1(true);
            } else if (err.resultType === 2) {
              // user reject the tx request
              setShowFail2(true);
            }
          }
        } else {
          try {
            const response = await withdraw(context, amountInput);
            if (response.successful) {
              setShowSuccess(true);
              if (accountBalance !== null) {
                setAccountBalance(accountBalance - amountInput);
              }
            }
            onClose();
          } catch (err: any) {
            console.log(err);
            onClose();
            if (err.resultType === 1) {
              // Insufficient Fund
              setShowFail1(true);
            } else if (err.resultType === 2) {
              // user reject the tx request
              setShowFail2(true);
            }
          }
        }
      }
    }
  };

  const depositBalance =
    walletBalance !== null ? formatToUSD(walletBalance) : '--';
  const withdrawBalance =
    accountBalance !== null ? formatToUSD(accountBalance) : '--';

  const onClose = () => {
    setAmount('');
    setPercentWallet(0);
    setIsModalOpen(false);
    setIsLoading(false);
  };

  const walletNotConnectedButton = (
    <Box onClick={() => onClose()} width="100%">
      <WalletButton depositButton={true} />
    </Box>
  );
  return (
    <>
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent
            paddingY="32px"
            backgroundColor="#293141"
            borderRadius="8px"
          >
            <form onSubmit={e => onFormSubmit(e)}>
              <Flex justifyContent="center" marginBottom="24px" marginX="32px">
                <Box fontWeight="800" fontSize="20px" lineHeight="28px">
                  {isDeposit ? 'Deposit' : 'Withdraw'} Funds
                </Box>
                <Image
                  cursor="pointer"
                  onClick={() => setIsModalOpen(false)}
                  marginLeft="auto"
                  src={X}
                ></Image>
              </Flex>
              <Flex
                padding="18px 37px"
                backgroundColor="#364051"
                alignItems="center"
                marginBottom="16px"
              >
                <Flex>
                  <Image src={walletIcon} marginRight="19px" />
                  <Box>
                    <Box fontSize="22px" lineHeight="28px" fontWeight="800">
                      {isDeposit ? depositBalance : withdrawBalance}
                    </Box>
                    <Box fontSize="14px" lineHeight="16px" fontWeight="700">
                      Wallet Balance
                    </Box>
                  </Box>
                </Flex>
              </Flex>
              <Box marginBottom="16px" marginX="32px">
                <Text
                  marginBottom="8px"
                  lineHeight="16px"
                  fontSize="13px"
                  textColor="white"
                >
                  Enter {isDeposit ? 'Deposit' : 'Withdraw'} amount
                </Text>
                <InputGroup textColor="#B2B0BC">
                  <Input
                    type="number"
                    onChange={e => setAmount(e.target.value)}
                    value={amount}
                    placeholder="0.000000"
                    _placeholder={{ color: '#B2B0BC' }}
                    padding="8px"
                  />
                  <InputRightElement
                    textColor="#B2B0BC"
                    fontSize="15px"
                    lineHeight="20px"
                    marginRight="6px"
                  >
                    USD
                  </InputRightElement>
                </InputGroup>
              </Box>
              <Flex marginX="32px" justifyContent="center" marginBottom="24px ">
                <ProgressSlider
                  progress={percentWallet}
                  setProgress={setPercentWallet}
                  amount={amount}
                  setAmount={setAmount}
                  walletBalance={walletBalance}
                  accountBalance={accountBalance}
                  isDeposit={isDeposit}
                />
              </Flex>
              <Box marginX="32px">
                {wallet.connected
                  ? depositWithdrawButton
                  : walletNotConnectedButton}
              </Box>
            </form>
          </ModalContent>
        </Modal>
      )}
      <SuccessPopup open={showSuccess} onClose={() => setShowSuccess(false)} />
      <ErrorSuccessPopUp
        open={showFail1}
        onClose={() => setShowFail1(false)}
        fail={true}
        message="Insufficient Funds"
      />
      <ErrorPopup open={showFail2} onClose={() => setShowFail2(false)} />
    </>
  );
};

const DepositWithdrawWalletButton = () => {
  return;
  <WalletButton />;
};
