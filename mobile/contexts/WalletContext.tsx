import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { PublicKey, Transaction, Connection, clusterApiUrl } from '@solana/web3.js';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  AuthorizationResult,
  AuthToken,
} from '@solana-mobile/mobile-wallet-adapter-protocol';
import bs58 from 'bs58';

const APP_IDENTITY = {
  name: 'Hellcoin',
  uri: 'https://hellcoin.money',
  icon: 'favicon.ico',
};

const CLUSTER = 'mainnet-beta';
const RPC_ENDPOINT = 'https://patient-fittest-meadow.solana-mainnet.quiknode.pro/6b4d510e85db2b74aff949b2c493a937a2353f13/';

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
  authorizeSession: (wallet: Web3MobileWallet) => Promise<AuthorizationResult>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKeyBase58, setPublicKeyBase58] = useState<string | null>(null);
  const authTokenRef = useRef<AuthToken | null>(null);

  const connection = useMemo(() => new Connection(RPC_ENDPOINT, 'confirmed'), []);

  // Derive PublicKey from base58 string to avoid serialization issues
  const publicKey = useMemo(() => {
    if (!publicKeyBase58) return null;
    try {
      return new PublicKey(publicKeyBase58);
    } catch {
      return null;
    }
  }, [publicKeyBase58]);

  const authorizeSession = useCallback(async (wallet: Web3MobileWallet): Promise<AuthorizationResult> => {
    const authResult = await wallet.authorize({
      chain: CLUSTER,
      identity: APP_IDENTITY,
    });
    
    return authResult;
  }, []);

  const connect = useCallback(async () => {
    if (connected || connecting) return;

    // Check if we're on a mobile platform
    if (Platform.OS === 'web') {
      console.warn('Mobile Wallet Adapter is not supported on web');
      return;
    }

    setConnecting(true);

    try {
      await transact(async (wallet: Web3MobileWallet) => {
        // Authorize the wallet
        const authResult = await authorizeSession(wallet);
        
        // Get the first account's public key as base58 string
        // MWA uses 'address' field for the public key
        const account = authResult.accounts[0];
        console.log('[DEBUG] Account object:', JSON.stringify(account));

        if (!account) {
          throw new Error('No account found in authorization result');
        }

        // The address is base64 encoded, need to decode and convert to base58
        const addressBase64 = account.address;
        if (!addressBase64) {
          throw new Error('Address is undefined in account object');
        }

        // Decode base64 to get the public key bytes, then encode to base58
        const addressBytes = Buffer.from(addressBase64, 'base64');
        const pubKeyBase58 = bs58.encode(addressBytes);
        console.log('[DEBUG] Public key (base58):', pubKeyBase58);
        
        setPublicKeyBase58(pubKeyBase58);
        authTokenRef.current = authResult.auth_token;
        setConnected(true);
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setConnected(false);
      setPublicKeyBase58(null);
      authTokenRef.current = null;
    } finally {
      setConnecting(false);
    }
  }, [connected, connecting, authorizeSession]);

  const disconnect = useCallback(() => {
    setConnected(false);
    setPublicKeyBase58(null);
    authTokenRef.current = null;
  }, []);

  const signAndSendTransaction = useCallback(async (transaction: Transaction): Promise<string> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    let signature = '';
    const currentPubKey = publicKey; // Capture current value

    await transact(async (wallet: Web3MobileWallet) => {
      // Re-authorize if needed - use ref to get current auth token
      let authResult: AuthorizationResult;
      const currentAuthToken = authTokenRef.current;
      
      try {
        if (currentAuthToken) {
          authResult = await wallet.reauthorize({ 
            auth_token: currentAuthToken, 
            identity: APP_IDENTITY 
          });
        } else {
          authResult = await authorizeSession(wallet);
        }
      } catch (reauthorizeError) {
        // If reauthorize fails, fall back to fresh authorization
        console.log('Reauthorize failed, doing fresh authorization:', reauthorizeError);
        authResult = await authorizeSession(wallet);
      }
      
      authTokenRef.current = authResult.auth_token;

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = currentPubKey;

      // Sign and send the transaction
      const signedTransactions = await wallet.signAndSendTransactions({
        transactions: [transaction],
      });

      signature = signedTransactions[0];
    });

    return signature;
  }, [connected, publicKey, connection, authorizeSession]);

  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        publicKey,
        connect,
        disconnect,
        signAndSendTransaction,
        authorizeSession,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
