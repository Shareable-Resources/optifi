import React, { useContext, useEffect, useState } from 'react';

import { findUserAccount } from '@optifi/optifi-sdk/lib/utils/accounts';
import Context from '@optifi/optifi-sdk/lib/types/context';

import { useWallet } from '@solana/wallet-adapter-react';

import { Grid } from '@chakra-ui/layout';
import { Button, Flex, Text } from '@chakra-ui/react';

import GlobalContext from '../contexts/globalContext';
import { formatToUSD } from '../utils/formatters';
import { DepositAndWithdrawModal } from './DepositAndWithdrawModal';

export interface BalanceInterface {
  amountEquity: number;
  netUnrealizedPNL: number;
  totalMaintanenceMargin: number;
  totalInitialMargin: number;
  liquidationBuffer: number;
  small?: Boolean;
}

type MyBalanceProps = {
  myBalance: BalanceInterface;
};

export const getUserBalance = async (ctx: Context) => {
  return findUserAccount(ctx).then(([userAccountAddress, _]) => {
    // Load the user account data from that address
    return ctx.program.account.userAccount
      .fetch(userAccountAddress)
      .then((userAccountRes: any) => {
        // Cast it to the right type
        // @ts-ignore
        let userAccount = userAccountRes as UserAccount;
        // Get the token balance
        return ctx.connection
          .getTokenAccountBalance(userAccount.userMarginAccountUsdc)
          .then((tokAmount: { context: any; value: any }) => {
            let userUSDCBalance: number = tokAmount.value.uiAmount;
            let netUnrealizedPNL: number =
              userAccountRes.tempPnl.amount.toString();
            let accountEquity: number = userUSDCBalance + netUnrealizedPNL;
            // hard code
            let totalMaintenanceMargin: number = 1322.9439;
            let totalInitialMargin: number = 0.0;
            let liquidationBuffer: number = 7584.58;

            return tokAmount.value.uiAmount;
          });
      });
  });
};

export const MyBalance = ({ myBalance }: MyBalanceProps) => {
  const wallet = useWallet();
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const { context, isAllAccountsInitialized } = useContext(GlobalContext);

  useEffect(() => {
    const init = async () => {
      if (isAllAccountsInitialized) {
        try {
          const balance = await getUserBalance(context);
          setAvailableBalance(balance);
        } catch (err) {
          console.log('getUserBalance err', err);
        }
      }
    };
    init();
  }, [context, isAllAccountsInitialized]);

  return (
    <>
      <Grid
        borderLeft="2px solid #4E5A71"
        templateRows="124px 136px"
        paddingLeft="17px"
        paddingRight="16px"
        flexDir="column"
        borderTop={{ base: '2px solid #4E5A71', md: 'none' }}
      >
        <Flex
          paddingBottom="24px"
          paddingTop="16px"
          borderBottom="1px solid #4E5A71"
        >
          <Flex flexDirection="column">
            <Text fontWeight="800" fontSize="16px">
              Available Balance
            </Text>
            <Text fontWeight="800" fontSize="24px" lineHeight="28px">
              {wallet.connected && availableBalance !== null
                ? formatToUSD(availableBalance)
                : '$--'}
            </Text>
          </Flex>
          <Flex flexDir="column" marginLeft="auto">
            {myBalance.small ? (
              <></>
            ) : (
              <Button
                height="32px"
                width="96px"
                backgroundColor="#4E5A71"
                marginBottom="12px"
                onClick={() => {
                  setIsDepositModalOpen(true);
                }}
              >
                <Text fontSize="14px">Deposit</Text>
              </Button>
            )}
            {myBalance.small ? (
              <></>
            ) : (
              <Button
                height="32px"
                width="96px"
                backgroundColor="#4E5A71"
                marginTop="auto"
                onClick={() => {
                  setIsWithdrawModalOpen(true);
                }}
              >
                <Text fontSize="14px">Withdraw</Text>
              </Button>
            )}
          </Flex>
        </Flex>
        <Flex
          flexDirection="column"
          spacing="4px"
          color="#B2B0BC"
          fontWeight="400"
          paddingTop="16px"
          paddingBottom="16px"
        >
          <Flex lineHeight="16px" marginBottom="6px">
            <Text fontSize="13px">Account Equity</Text>
            <ValueFormat value={myBalance.amountEquity} />
          </Flex>
          <Flex lineHeight="16px" marginBottom="6px">
            <Text fontSize="13px">Net Unredlized PNL</Text>
            <ValueFormat value={myBalance.netUnrealizedPNL} />
          </Flex>
          <Flex lineHeight="16px" marginBottom="6px">
            <Text fontSize="13px">Total Maintenance Margin</Text>
            <ValueFormat value={myBalance.totalMaintanenceMargin} />
          </Flex>
          <Flex lineHeight="16px" marginBottom="6px">
            <Text fontSize="13px">Total Initial Margin</Text>
            <ValueFormat value={myBalance.totalInitialMargin} />
          </Flex>
          <Flex lineHeight="16px">
            <Text fontSize="13px">Liquidation Buffer</Text>
            <ValueFormat value={myBalance.liquidationBuffer} />
          </Flex>
        </Flex>
      </Grid>
      <DepositAndWithdrawModal
        isDeposit={true}
        isModalOpen={isDepositModalOpen}
        setIsModalOpen={setIsDepositModalOpen}
        accountBalance={availableBalance}
        setAccountBalance={setAvailableBalance}
      />
      <DepositAndWithdrawModal
        isDeposit={false}
        isModalOpen={isWithdrawModalOpen}
        setIsModalOpen={setIsWithdrawModalOpen}
        accountBalance={availableBalance}
        setAccountBalance={setAvailableBalance}
      />
    </>
  );
};

const ValueFormat = ({ value }: any) => {
  const wallet = useWallet();
  return (
    <Text marginLeft="auto" fontSize="13px" textColor="white">
      {wallet.connected ? formatToUSD(value) : '$--'}
    </Text>
  );
};
