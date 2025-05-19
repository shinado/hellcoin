import {
  Connection,
  PublicKey,
} from "@solana/web3.js";
import { 
  AccountLayout,
  TOKEN_PROGRAM_ID 
} from "@solana/spl-token";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const netWork = "https://patient-fittest-meadow.solana-mainnet.quiknode.pro/6b4d510e85db2b74aff949b2c493a937a2353f13/";
    const connection = new Connection(netWork, "confirmed");
    const mintPubKey = new PublicKey("oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump");

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

    res.status(200).json(activeHolders);
  } catch (error) {
    console.error('Error fetching token holders:', error);
    res.status(500).json({ message: 'Error fetching token holders' });
  }
} 