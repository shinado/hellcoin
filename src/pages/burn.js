import React, { useState, useEffect, forwardRef } from "react";
import { Tooltip } from "flowbite-react";
import Link from "next/link";
import ReactPlayer from "react-player";
import i18next from "./i18n";
import LoadingText from "./LoadingText";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

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
} from "@solana/spl-token";

const Burn = forwardRef((props, ref) => {
  const wallet = useWallet();
  const [playVideo, setPlayVideo] = useState(false);

  const [personName, setPersonName] = useState("");
  const [mingAmount, setMingAmount] = useState("");

  const [loading, setLoading] = useState(false);

  const bs58 = require("bs58");

  const transformToFixedBase58 = (original) => {
    const text = original
      .replaceAll("l", "1")
      .replaceAll("L", "1")
      .replaceAll("0", "o")
      .replaceAll("O", "o");

    const base58Chars =
      "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let isBase58Only = text
      .split("")
      .every((char) => base58Chars.includes(char));

    let output = "DEAD";

    if (isBase58Only) {
      // If the input contains only Base58 characters
      output += text;
    } else {
      // If the input contains non-Base58 characters, encode it to Base58
      const bytesText = Buffer.from(text, "utf8");
      const encodedText = bs58.encode(bytesText);
      output += encodedText;
    }

    // Add "DEAD" repeatedly until the output is 44 characters long
    while (output.length < 44) {
      output += "4";
    }

    const address = output.slice(0, 44);
    return findValidAddress(address);
  };

  const findValidAddress = (address) => {
    let hexChars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let currentIndex = address.length - 1;

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
      const publicKey = transformToFixedBase58(personName);
      console.log("send to address: ", publicKey);

      const recipientAddress = publicKey;
      const mintAddress = "BjNni3M1rsKD9Q36RhARJJfqvSNmxvS69p4LjdYLmNuz";

      await sendSPLToken(
        wallet.publicKey,
        //  Centra1BankofUnderWor1d444444444444444444444
        // 'HExZDErmg9cgvETA8vnLgAYoMzeHtxrAbzpZjJgd4BxP',
        // '7SttTKZbN1XKnjnbFEFtx8uHSQTUW94Z4Je2uAxWMHJh',
        recipientAddress,
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
      const connection = new Connection(netWork, "recent");

      const decimals = 10000000;
      const mintPubKey = new PublicKey(mintAddress);
      const fromPubkey = new PublicKey(senderAddress);
      const toPubkey = new PublicKey(recipientAddress);

      //获得发送者的associated token address
      const fromAssociatedTokenAddress = await getAssociatedTokenAddress(
        mintPubKey,
        fromPubkey
      );

      //获得接收者的associated token address
      const destinationAssociatedTokenAddress = await getAssociatedTokenAddress(
        mintPubKey,
        toPubkey
      );

      const destination = await connection.getAccountInfo(
        destinationAssociatedTokenAddress
      );

      const tx = new Transaction(); // 建一个交易单

      if (!destination) {
        /**
         * 如果接收者没有associated token address，也就是他不持有这个代币，则要在transaction里面帮他创建这个地址，创建费用由发送者承担
         * @param payer                    Payer of the initialization fees
         * @param associatedToken          New associated token account
         * @param owner                    Owner of the new account
         * @param mint                     Token mint account
         */
        tx.add(
          createAssociatedTokenAccountInstruction(
            fromPubkey, //发送者承担创建费用
            destinationAssociatedTokenAddress, //接收者的associated token address
            toPubkey, //这里才是接收者的地址
            mintPubKey //代币地址
          )
        );
        console.log("create associated token account: ", tx);
      }

      /**
       *
       * @param source       Source account
       * @param destination  Destination account
       * @param owner        Owner of the source account
       * @param amount       Number of tokens to transfer
       */
      const splTransferIx = createTransferInstruction(
        fromAssociatedTokenAddress, //发送者的associated token address
        destinationAssociatedTokenAddress, //接收者的associated token address
        fromPubkey, //发送者的地址
        BigInt(amount) * BigInt(decimals) //数量
      );

      //加入到transation
      tx.add(splTransferIx);
      tx.recentBlockhash = (
        await connection.getLatestBlockhash("max")
      ).blockhash;
      tx.feePayer = fromPubkey; // 付款人

      const signedTransaction = await wallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await connection.confirmTransaction({
        signature: signature,
        strategy: "confirmed", // or another strategy as per the documentation
      });

      console.log("Transaction sent:", signature);
    } catch (e) {
      console.log(e);
    }
  }

  const baseClassName = " relative flex justify-center items-center h-full";
  const className = " bg-slate-900 px-4 sm:px-6 lg:px-8 py-10" + baseClassName;
  return (
    <div ref={ref} className="relative h-full md:h-screen">
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          overflow: "hidden", // Prevent content from spilling out when height is 0
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
        //help me GPT: set the div's height to 100% of the parent
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
              i18next.t("burning.loading.1"),
              i18next.t("burning.loading.2"),
              i18next.t("burning.loading.3"),
              i18next.t("burning.loading.4"),
              i18next.t("burning.loading.5"),
            ]}
            style={{
              position: "relative",
            }}
          />
        </div>
      )}

      <div className={(playVideo ? "fadeOut" : "fadeIn") + className}>
        {/* set max width for this div */}
        <div className="w-full max-w-3xl text-center">
          <h2 className="text-5xl font-extrabold text-white">
            {i18next.t("home.burn.title")}
          </h2>
          <p className="mt-4 text-lg text-white">
            {i18next.t("home.burn.sub")}
          </p>
          <p className="text-base text-white-500">
            {i18next.t("home.burn.content.dk")}
            <Link href="/deaderboard">
              {i18next.t("home.burn.content.deaderboard")}
            </Link>
          </p>

          <div className="mt-8">
            <p className="mt-1 text-md font-bold text-white text-left">
              {i18next.t("home.burn.form.name")}
            </p>
            <input
              type="text"
              placeholder={i18next.t("home.burn.form.name.hint")}
              // className="border border-gray-300 rounded-md shadow-sm text-white"
              className="mt-2 p-3 text-sm rounded-lg block w-full bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-primary-500 focus:border-primary-500"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />
            {personName && (
              <p className="text-left text-sm">
                烧给地址: {transformToFixedBase58(personName)}
              </p>
            )}

            <p className="mt-4 text-md font-bold text-white text-left">
              {i18next.t("home.burn.form.amount")}
            </p>
            <input
              type="number"
              placeholder="444444"
              className="mb-6 mt-2 p-3 text-sm rounded-lg block w-full bg-gray-600 border-gray-500 placeholder-gray-400 text-white focus:ring-primary-500 focus:border-primary-500"
              // className="mt-2 p-3 block w-full border border-gray-300 rounded-md shadow-sm text-white"
              value={mingAmount}
              onChange={(e) => setMingAmount(e.target.value)}
            />

            {!wallet.connected && <WalletMultiButton className="mt-8" />}
            <p>
              {wallet.connected && (
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => handleBurnClick()}
                >
                  燃烧冥币
                </button>
              )}
            </p>

            {/* <div className="flex justify-center items-center ">
              <Tooltip
                className="mt-2 text-center max-w-3xl"
                content={i18next.t("home.burn.form.learn.desc")}
                trigger="hover"
              >
                <p className="mt-2 text-center text-sm text-gray-400 cursor-pointer">
                  {i18next.t("home.burn.form.learn")}
                </p>
              </Tooltip>
            </div> */}
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
