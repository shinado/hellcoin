import "@/styles/globals.css";
import { useMemo, useEffect } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolletWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { MyPhantomWalletAdapter } from "./MyPhantomWalletAdapter";


// You must import the CSS somewhere to use the pre-built React UI components
require('@solana/wallet-adapter-react-ui/styles.css');

function App({ Component, pageProps }) {
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (/Expected server HTML to contain a matching/.test(args[0])) {
        return;
      }
      originalConsoleError(...args);
    };
  }, []);

  // Setup the network to use. Change to 'mainnet-beta' as needed.
  const network = WalletAdapterNetwork.Devnet;

  // Memoize the configuration to prevent unnecessary re-renders
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      new MyPhantomWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;