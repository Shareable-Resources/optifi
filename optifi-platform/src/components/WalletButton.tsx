import React, { useState, useEffect, useContext } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import * as anchor from '@project-serum/anchor';

import { initializeContext } from '@optifi/optifi-sdk';

import GlobalContext from '../contexts/globalContext';
import de from 'date-fns/esm/locale/de/index.js';

require('@solana/wallet-adapter-react-ui/styles.css');

type WalletButtonProps = {
  depositButton?: boolean;
};

function WalletButton({ depositButton = false }: WalletButtonProps) {
  const wallet = useWallet();

  const styles = depositButton
    ? {
        marginRight: '0',
        width: '100%',
      }
    : {};

  const {
    userWallet,
    setUserWallet,
    userWalletName,
    setUserWalletName,
    context,
    setContext,
  } = useContext(GlobalContext);

  // when user connect to wallet, setUserWallet
  useEffect(() => {
    if (
      wallet != null &&
      wallet.publicKey !== null &&
      wallet.wallet !== undefined &&
      wallet.wallet !== null &&
      wallet.connected === true &&
      wallet.wallet.name !== userWalletName
    ) {
      setUserWalletName(wallet.wallet.name);
      setUserWallet(wallet);
      initializeOptifiContext(wallet);
    }
  }, [wallet]);

  useEffect(() => {
    initializeOptifiContext(wallet);
  }, []);

  const initializeOptifiContext = async (wallet?: any) => {
    let walletPublicKey: any;

    if (wallet && wallet.wallet != null) {
      // override dummy wallet if wallet exists
      walletPublicKey = wallet.wallet;
    }
    console.log(walletPublicKey);
    // remove if
    if (wallet && wallet.wallet != null) {
      const ctx = await initializeContext(
        walletPublicKey,
        'hjo3CZHSkssq4df3uhYPEuJMdAstA6qc3EEYNDXAxvW'
      );
      setContext(ctx);
    }
  };

  return (
    <div>
      <WalletMultiButton
        style={{ backgroundColor: '#9C7BEE', color: '#FFFFFF', ...styles }}
      />
    </div>
  );
}

export default WalletButton;
