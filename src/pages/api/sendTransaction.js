import {
  Connection,
} from "@solana/web3.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { signedTransaction } = req.body;

  if (!signedTransaction) {
    return res.status(400).json({ message: 'Signed transaction is required' });
  }

  try {
    const netWork = "https://patient-fittest-meadow.solana-mainnet.quiknode.pro/6b4d510e85db2b74aff949b2c493a937a2353f13/";
    const connection = new Connection(netWork, "confirmed");

    const sig = await connection.sendRawTransaction(signedTransaction);
    await connection.confirmTransaction({
      signature: sig,
      strategy: "confirmed",
    });

    res.status(200).json({ signature: sig });
  } catch (error) {
    console.error('Error sending transaction:', error);
    res.status(500).json({ message: 'Error sending transaction', error: error.message });
  }
} 