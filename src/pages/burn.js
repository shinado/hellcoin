import React, { useState, useEffect, forwardRef } from "react";
import ReactPlayer from "react-player";
import LoadingText from "./LoadingText";
import { useWallet } from "@solana/wallet-adapter-react";
import { HiCheck, HiExclamation, HiExclamationCircle, HiX } from "react-icons/hi";

import { Toast } from "flowbite-react";

import { Program, AnchorProvider, BN } from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
  TransactionInstruction,
  // LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  AccountLayout
} from "@solana/spl-token";
import BurnSucceedDialog from "./BurnSucceedDialog";
import pinyinUtil from "../pinyin/pinyinUtil";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { Toaster, toast } from "react-hot-toast";
import dynamic from 'next/dynamic';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Create a dynamic import for WalletMultiButton with ssr disabled
const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const Burn = forwardRef((props, ref) => {
  const nameMappings = {
    "7GqFL3YoxcbAsxPYAJW9qfMjbB16E2uV2R2DS4FYus6U": {
      name: "pump.fun Pool",
      color: "#FF6384"
    },
    "DEADCentra1BankofUnderwor1dooooooopoDEADRiP": {
      name: "Central Bank of Underworld",
      color: "#36A2EB"
    }
  }

  const getTokenHolders = async () => {
    try {
      const netWork = "https://wiser-evocative-season.solana-mainnet.quiknode.pro/c703e8fe265b859cdde46e6b89f792b5573a3b98/";
      const connection = new Connection(netWork, "confirmed");
      const mintPubKey = new PublicKey(mintAddress);

      // Get all token accounts for this mint
      const tokenAccounts = await connection.getProgramAccounts(
        TOKEN_PROGRAM_ID,
        {
          filters: [
            {
              dataSize: 165, // Size of token account data
            },
            {
              memcmp: {
                offset: 0, // Offset of mint address in token account data
                bytes: mintPubKey.toBase58(), // Mint address to filter by
              },
            },
          ],
        }
      );

      // Process the accounts to get holder information
      const holders = tokenAccounts.map(account => {
        const accountData = AccountLayout.decode(account.account.data);
        const amount = Number(accountData.amount) / (10 ** 6); // Adjust decimals as needed
        const owner = new PublicKey(accountData.owner).toString();

        return {
          owner,
          amount,
          address: account.pubkey.toString()
        };
      });

      // Filter out zero balance accounts
      const activeHolders = holders.filter(holder => holder.amount > 0);

      // Sort by amount (descending)
      activeHolders.sort((a, b) => b.amount - a.amount);
      return activeHolders;
    } catch (error) {
      console.error('Error fetching token holders:', error);
      return [];
    }
  };


  const mintAddress = "oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump";
  const wallet = useWallet();
  const [playVideo, setPlayVideo] = useState(false);
  const [signature, setSignature] = useState("");

  const [personName, setPersonName] = useState("");
  // const [recipientAddress, setRecipientAddress] = useState("");
  const [mingAmount, setMingAmount] = useState("");
  const [showBurnSucceedDialog, setShowBurnSucceedDialog] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Add new state for transformed address
  const [transformedAddress, setTransformedAddress] = useState("");

  // Add new state for token balance
  const [tokenBalance, setTokenBalance] = useState(null);

  // Add state for distribution data
  const [distributionData, setDistributionData] = useState(null);

  // Add new state for top holders
  const [topHolders, setTopHolders] = useState([]);

  useEffect(() => {
    setIsWalletConnected(wallet.connected);
  }, [wallet.connected]);

  const bs58 = require("bs58");

  // Move transformation logic into useEffect
  useEffect(() => {
    if (personName) {
      const address = transformToFixedBase58(personName);
      setTransformedAddress(address);
    }
  }, [personName]); // Only run when personName changes

  // Add function to process holder distribution
  const processHolderDistribution = (holders) => {
    const pumpFunAddress = "7GqFL3YoxcbAsxPYAJW9qfMjbB16E2uV2R2DS4FYus6U";

    let pumpFunAmount = 0;
    let underworldAmount = 0;
    let realWorldAmount = 0;

    holders.forEach(holder => {
      if (holder.owner === pumpFunAddress) {
        pumpFunAmount += holder.amount;
      } else if (holder.owner.startsWith('DEAD') && holder.owner.endsWith('DEADRiP')) {
        underworldAmount += holder.amount;
      } else {
        realWorldAmount += holder.amount;
      }
    });

    console.log("pumpFunAmount: ", pumpFunAmount);
    console.log("underworldAmount: ", underworldAmount);
    console.log("realWorldAmount: ", realWorldAmount);

    const total = pumpFunAmount + underworldAmount + realWorldAmount;

    return {
      labels: ['pump.fun Pool', 'Underworld Holdings', 'Real World Holdings'],
      datasets: [{
        data: [
          (pumpFunAmount / total) * 100,
          (underworldAmount / total) * 100,
          (realWorldAmount / total) * 100
        ],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56'
        ],
        borderColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56'
        ],
        borderWidth: 1,
      }]
    };
  };

  // Modify your existing useEffect to include distribution calculation and top holders
  useEffect(() => {
    const getHolders = async () => {
      const holders = await getTokenHolders();
      console.log("holders: ", holders);

      // Set top 10 holders
      setTopHolders(holders.slice(0, 10));

      const distribution = processHolderDistribution(holders);
      setDistributionData(distribution);
    }
    getHolders();
  }, []);

  // Add function to fetch token balance
  const fetchTokenBalance = async () => {
    if (!wallet.publicKey) return;

    try {
      const netWork = "https://wiser-evocative-season.solana-mainnet.quiknode.pro/c703e8fe265b859cdde46e6b89f792b5573a3b98/";
      const connection = new Connection(netWork, "confirmed");
      const mintPubKey = new PublicKey(mintAddress);
      const tokenAccount = await getAssociatedTokenAddress(
        mintPubKey,
        wallet.publicKey
      );

      const balance = await connection.getTokenAccountBalance(tokenAccount);
      setTokenBalance(balance.value.uiAmount);
    } catch (error) {
      console.error("Error fetching token balance:", error);
      setTokenBalance(null);
    }
  };

  // Add useEffect to fetch balance when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      fetchTokenBalance();
    } else {
      setTokenBalance(null);
    }
  }, [wallet.connected]);

  const transformToFixedBase58 = (original) => {
    const pinyin = pinyinUtil.getPinyin(original).replaceAll(" ", "");
    console.log("pinyin: ", pinyin);

    const text = pinyin
      .replaceAll("l", "1")
      .replaceAll("L", "1")
      .replaceAll("I", "i")
      .replaceAll("0", "o")
      .replaceAll("O", "o");

    const base58Chars =
      "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let isBase58Only = text
      .split("")
      .every((char) => base58Chars.includes(char));

    let output = "DEAD"; // Start with DEAD

    if (isBase58Only) {
      output += text;
    } else {
      text.split("").forEach(char => {
        if (base58Chars.includes(char)) {
          output += char;
        } else {
          const bytesText = Buffer.from(char, "utf8");
          const encodedText = bs58.encode(bytesText);
          output += encodedText;
        }
      });

    }

    // Fill with zeros and end with DEAD to make it 44 characters
    while (output.length < 36) { // 40 = 44 - len("DEAD")
      output += "o";
    }
    output += "DEADRiP";

    const address = output.slice(0, 44);
    const publicKey = findValidAddress(address);

    return publicKey;
  };

  const findValidAddress = (address) => {
    let hexChars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let currentIndex = address.length - 9;

    function tryNextChar(index) {
      if (index < 0) return false; // Exhausted all characters, no solution found.

      let currentChar = address[index];
      let nextCharIndex = hexChars.indexOf(currentChar) + 1;

      // Try replacing the current character with each possible hex character
      while (nextCharIndex < hexChars.length) {
        let newAddress =
          address.substring(0, index) +
          hexChars[nextCharIndex] +
          address.substring(index + 1);
        if (PublicKey.isOnCurve(newAddress)) {
          return newAddress; // Found a valid address
        }
        nextCharIndex++;
      }

      // Current character exhausted, move to the previous character
      address =
        address.substring(0, index) + "0" + address.substring(index + 1); // Reset current char to '0' and move to the previous
      return tryNextChar(index - 1); // Recurse with the previous character
    }

    return tryNextChar(currentIndex);
  };

  const handleBurnClick = async () => {
    setLoading(true);

    try {
      await sendSPLToken(
        wallet.publicKey,
        transformedAddress,
        mintAddress,
        mingAmount
      );
      setLoading(false);

      //finished
    } catch (error) {
      console.log("Transaction failed:", error);
      setLoading(false);
    }
  };

  async function sendSPLToken(
    senderAddress,
    recipientAddress,
    mintAddress,
    amount
  ) {
    try {
      const netWork =
        "https://wiser-evocative-season.solana-mainnet.quiknode.pro/c703e8fe265b859cdde46e6b89f792b5573a3b98/"; //主网
      const connection = new Connection(netWork, "confirmed");

      const decimals = 6;
      const mintPubKey = new PublicKey(mintAddress);
      const fromPubkey = new PublicKey(senderAddress);
      const toPubkey = new PublicKey(recipientAddress);

      const fromAssociatedTokenAddress = await getAssociatedTokenAddress(
        mintPubKey,
        fromPubkey
      );

      const destinationAssociatedTokenAddress = await getAssociatedTokenAddress(
        mintPubKey,
        toPubkey
      );

      const destination = await connection.getAccountInfo(
        destinationAssociatedTokenAddress
      );

      const tx = new Transaction();

      if (!destination) {
        /**
         * @param payer                    Payer of the initialization fees
         * @param associatedToken          New associated token account
         * @param owner                    Owner of the new account
         * @param mint                     Token mint account
         */
        tx.add(
          createAssociatedTokenAccountInstruction(
            fromPubkey, //fee payer
            destinationAssociatedTokenAddress,
            toPubkey,
            mintPubKey
          )
        );
        console.log("create associated token account: ", tx);
      }

      // Convert the amount to a BigInt, scaling up to preserve the desired number of decimals
      const amountBigInt = BigInt(Math.round(amount * 10 ** decimals));

      /**
       *
       * @param source       Source account
       * @param destination  Destination account
       * @param owner        Owner of the source account
       * @param amount       Number of tokens to transfer
       */
      const splTransferIx = createTransferInstruction(
        fromAssociatedTokenAddress,
        destinationAssociatedTokenAddress,
        fromPubkey,
        amountBigInt
      );

      tx.add(splTransferIx);
      tx.recentBlockhash = (
        await connection.getLatestBlockhash("max")
      ).blockhash;
      tx.feePayer = fromPubkey;

      const signedTransaction = await wallet.signTransaction(tx);

      setPlayVideo(true);
      const sig = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await connection.confirmTransaction({
        signature: sig,
        strategy: "confirmed", // or another strategy as per the documentation
      });
      setPlayVideo(false);
      setSignature(sig);

      setShowBurnSucceedDialog(true);
      console.log("Transaction sent:", sig);
    } catch (e) {
      setPlayVideo(false);
      // show error
      console.log(e);
    }
  }

  // Add chart options
  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white'
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.label}: ${context.raw.toFixed(2)}%`;
          }
        }
      }
    }
  };

  const baseClassName = " relative flex justify-center items-center h-full";
  const className = " bg-slate-900 px-4 sm:px-6 lg:px-8 py-10" + baseClassName;
  return (
    <div>
      <div ref={ref} className="relative h-[85vh]">
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
          className={playVideo ? "fadeIn" : "fadeOut"}
        >
          {playVideo && (
            <div className="video-container">
              <ReactPlayer
                url="/burning-fire.mp4"
                playing={playVideo}
                loop
                className="react-player"
              />
            </div>
          )}
        </div>

        {playVideo && (
          <div
            className={baseClassName}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden", // Prevent content from spilling out when height is 0
            }}
          >
            <LoadingText
              textArray={[
                "Transfering to the dead...",
                "Waiting for Bank of Hell to confirm the transaction...",
                "Bank of Hell confirmed the transaction...",
                "Waiting for transaction confirmation...",
              ]}
              style={{
                position: "relative",
              }}
            />
          </div>
        )}

        <div className={(playVideo ? "fadeOut" : "fadeIn") + className}>
          <div
            className="relative w-screen h-screen bg-cover bg-center"
            style={{ backgroundImage: `url('/hellcoin_bg.jpg')` }}
          >
            <div className="absolute inset-0 bg-[#000800] opacity-80"></div>

            {/* Content */}
            <div className="relative w-screen flex h-[90vh] justify-center items-center text-center">
              <div className="w-full max-w-xl text-center px-4 sm:px-6 lg:px-8">
                <h1 className="mt-10 text-8xl font-extrabold text-white">Hellcoin</h1>
                <p className="mt-4 text-lg text-white mt-[-10px]">
                  The meme coin burning hyperinflation in hell 🔥
                  {/* To the dead. Solve hyperinflation in hell once and for all. */}
                </p>

                <p className="mt-0 text-md text-gray-400 text-[14px]">
                  Don&apos;t have Hellcoin Yet? Get $HELL from {" "}
                  <a
                    className="text-blue-500"
                    href="https://pump.fun/coin/oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump"
                    target="_blank"
                  >
                    pump.fun
                  </a>
                </p>

                <div className="mt-8 px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center gap-2">
                    <p className="mt-1 text-md font-bold text-white text-left">
                      Transfer to
                    </p>
                    <div className="relative group">
                      <HiExclamationCircle
                        className="w-5 h-5 text-gray-400 hover:text-white cursor-help"
                      />
                      <div className="absolute text-left left-0 w-72 p-4 bg-gray-800 text-sm text-gray-300 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10 mt-1 shadow-lg border border-gray-700">
                        <p>
                          The name will be transformed into a Solana address,
                          starting with &quot;DEAD&quot; and ending with &quot;DEADRiP&quot;, owned by NO ONE ALIVE.
                        </p>
                        <p className="mt-2">
                          The $HELL you send will be no longer in circulation which causes deflation, resulting in a higher price.
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Kobe Bryant RIP🕯️"
                    className="mt-2 p-3 text-sm rounded-lg block w-full bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-primary-500 focus:border-primary-500"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                  />
                  {personName && (
                    <p className="text-left text-sm mt-2">
                      Address: {transformedAddress}
                    </p>
                  )}

                  <p className="mt-6 text-md font-bold text-white text-left">
                    Amount
                  </p>

                  <input
                    type="number"
                    placeholder="100,000"
                    className="mt-2 p-3 text-sm rounded-lg block w-full bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-primary-500 focus:border-primary-500"
                    // className="mt-2 p-3 block w-full border border-gray-300 rounded-md shadow-sm text-white"
                    value={mingAmount}
                    onChange={(e) => setMingAmount(e.target.value)}
                  />
                  {isWalletConnected && (
                    <p className="mt-2 text-left text-sm text-white">
                      Your Balance: {tokenBalance !== null ? `${tokenBalance} $HELL` : 'Loading...'}
                    </p>
                  )}

                  {!isWalletConnected && <WalletMultiButtonDynamic className="mt-8" />}
                  <p>
                    {isWalletConnected && (
                      <div>
                        <button
                          disabled={loading || !personName || !mingAmount}
                          className="mt-6 bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                          onClick={() => handleBurnClick()}
                        >
                          Transfer
                        </button>
                      </div>
                    )}
                  </p>

                </div>
              </div>
            </div>
          </div>
        </div>


        <BurnSucceedDialog
          open={showBurnSucceedDialog}
          name={personName}
          addr={transformedAddress}
          amount={mingAmount}
          tx={signature}
          handleClose={() => {
            setShowBurnSucceedDialog(false);
          }}
        />

      </div>

      {/* Add this before the YouTube section */}
      <div className="bg-[#002200] py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Token Distribution</h2>
          <div className="w-full max-w-md mx-auto mb-12">
            {distributionData ? (
              <Pie data={distributionData} options={chartOptions} />
            ) : (
              <p className="text-white text-center">Loading distribution data...</p>
            )}
          </div>

          {/* Add Top Holders Section */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white text-center mb-6">Top 10 Holders</h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden overflow-x-auto">
              {/* Mobile view */}
              <div className="md:hidden">
                {topHolders.map((holder, index) => {
                  const mappingResult = nameMappings[holder.owner];
                  let category, categoryColor;

                  if (mappingResult) {
                    category = mappingResult.name;
                    categoryColor = mappingResult.color;
                  } else {
                    if (holder.owner.startsWith('DEAD') && (holder.owner.endsWith('DEADRiP') || holder.owner.endsWith('DEADDEAD'))) {
                      category = "Underworld Holdings";
                      categoryColor = "#36A2EB";
                    } else {
                      category = "Real World Holdings";
                      categoryColor = "#FFCE56";
                    }
                  }

                  return (
                    <div key={holder.address} className="p-4 border-b border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 font-medium">#{index + 1}</span>
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            backgroundColor: `${categoryColor}20`,
                            color: categoryColor,
                            border: `1px solid ${categoryColor}`
                          }}
                        >
                          {category}
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm break-all mb-2">
                        {holder.owner}
                      </div>
                      <div className="text-gray-300 text-right font-medium">
                        {holder.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop view */}
              <table className="min-w-full divide-y divide-gray-700 hidden md:table">
                <thead className="bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-20">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {topHolders.map((holder, index) => {
                    let category, categoryColor;
                    const mappingResult = nameMappings[holder.owner];

                    if (mappingResult) {
                      category = mappingResult.name;
                      categoryColor = mappingResult.color;
                    } else {
                      if (holder.owner.startsWith('DEAD') && (holder.owner.endsWith('DEADRiP') || holder.owner.endsWith('DEADDEAD'))) {
                        category = "Underworld Holdings";
                        categoryColor = "#36A2EB";
                      } else {
                        category = "Real World Holdings";
                        categoryColor = "#FFCE56";
                      }
                    }

                    return (
                      <tr key={holder.address}>
                        <td className="px-6 py-4 text-sm text-gray-300 w-20">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            <span className="break-all">{holder.owner}</span>
                            <span
                              className="px-2 py-1 text-xs rounded-full"
                              style={{
                                backgroundColor: `${categoryColor}20`,
                                color: categoryColor,
                                border: `1px solid ${categoryColor}`
                              }}
                            >
                              {category}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300 text-right">
                          <div className="break-words">
                            {holder.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add YouTube Videos Section */}
      <div className="bg-[#002800] py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center">What does Hellcoin do?</h2>
          <div className="text-center text-l">BUNR. DONNOT HODL. Every &#36;HELL you offered to the underworld causes &#36;HELL deflation, resulting in a higher price. </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="aspect-w-16 aspect-h-9">
              <ReactPlayer
                url="https://www.youtube.com/watch?v=URYG34BYWUw"
                width="100%"
                height="100%"
                controls={true}
              />
            </div>
            <div className="aspect-w-16 aspect-h-9">
              <ReactPlayer
                url="https://www.youtube.com/watch?v=zjVpfO-ybTw"
                width="100%"
                height="100%"
                controls={true}
              />
            </div>
            <div className="aspect-w-16 aspect-h-9">
              <ReactPlayer
                url="https://www.youtube.com/watch?v=TsdSxk-qxZE"
                width="100%"
                height="100%"
                controls={true}
              />
            </div>
          </div>
        </div>
      </div>

    </div>

  );
});

/**
 * Your code shows that you are using the forwardRef API in React and assigning it to a constant named Burn.
 * This approach is generally correct, but the error you're encountering suggests that the component might be
 *  missing an explicit display name, which is particularly important when using higher-order components or
 * APIs like forwardRef.
 * To resolve this, you can explicitly set the displayName property on your component.
 * Here's how you can modify your code:
 */
Burn.displayName = "Burn";
export default Burn;
