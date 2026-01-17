import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { senderAddress, recipientAddress, amount } = req.body;

  console.log("senderAddress:", senderAddress);
  console.log("recipientAddress:", recipientAddress);
  console.log("amount:", amount);

  if (!senderAddress || !recipientAddress || !amount) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    const netWork = "https://patient-fittest-meadow.solana-mainnet.quiknode.pro/6b4d510e85db2b74aff949b2c493a937a2353f13/";
    const connection = new Connection(netWork, "confirmed");
    const decimals = 6;
    const mintPubKey = new PublicKey("oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump");
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
      tx.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey,
          destinationAssociatedTokenAddress,
          toPubkey,
          mintPubKey
        )
      );
    }

    // Convert the amount to a BigInt, scaling up to preserve the desired number of decimals
    const amountBigInt = BigInt(Math.round(amount * 10 ** decimals));

    const splTransferIx = createTransferInstruction(
      fromAssociatedTokenAddress,
      destinationAssociatedTokenAddress,
      fromPubkey,
      amountBigInt
    );

    tx.add(splTransferIx);
    tx.recentBlockhash = (await connection.getLatestBlockhash("max")).blockhash;
    tx.feePayer = fromPubkey;

    // Serialize the transaction
    const serializedTransaction = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64');

    res.status(200).json({
      transaction: serializedTransaction,
      recentBlockhash: tx.recentBlockhash,
      feePayer: fromPubkey.toString()
    });
  } catch (error) {
    console.error('Error preparing transfer:', error);
    res.status(500).json({ message: 'Error preparing transfer', error: error.message });
  }
} 