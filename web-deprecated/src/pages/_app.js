import "@/styles/globals.css";
import { useMemo, useEffect } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { MyPhantomWalletAdapter } from "@/adapter/MyPhantomWalletAdapter";
import { Toaster } from "react-hot-toast";
import Head from "next/head";

// You must import the CSS somewhere to use the pre-built React UI components
require("@solana/wallet-adapter-react-ui/styles.css");

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
  const wallets = useMemo(() => [new MyPhantomWalletAdapter(), new SolflareWalletAdapter()], [network]);

  return (
    <>
      <Head>
        <title>Hellcoin, Digial Hell money used in underworld</title>
        <meta name="description" content="To the dead. Solve hyperinflation in hell once and for all." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:title" content="$HELL Token - Burn to Earn" />
        <meta property="og:description" content="Solve hyperinflation in hell once and for all." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hellcoin.money" />
        <meta property="og:image" content="https://hellcoin.money/hellcoin_bg.jpg" />
      </Head>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Component {...pageProps} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>


  );
}

export default App;
