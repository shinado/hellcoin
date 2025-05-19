import {
  Connection,
  PublicKey,
} from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { walletAddress } = req.query;

  if (!walletAddress) {
    return res.status(400).json({ message: 'Wallet address is required' });
  }

  try {
    const netWork = "https://patient-fittest-meadow.solana-mainnet.quiknode.pro/6b4d510e85db2b74aff949b2c493a937a2353f13/";
    const connection = new Connection(netWork, "confirmed");
    const mintPubKey = new PublicKey("oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump");
    const walletPubKey = new PublicKey(walletAddress);

    const tokenAccount = await getAssociatedTokenAddress(
      mintPubKey,
      walletPubKey
    );

    const balance = await connection.getTokenAccountBalance(tokenAccount);
    res.status(200).json({ balance: balance.value.uiAmount });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    res.status(500).json({ message: 'Error fetching token balance' });
  }
} 