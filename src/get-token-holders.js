
const getTokenHolders = async () => {
    try {
      const netWork = "https://patient-fittest-meadow.solana-mainnet.quiknode.pro/6b4d510e85db2b74aff949b2c493a937a2353f13/";
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
