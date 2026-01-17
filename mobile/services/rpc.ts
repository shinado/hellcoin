// Direct Solana RPC calls service

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  AccountLayout,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { RPC_ENDPOINT, MINT_ADDRESS as FALLBACK_MINT_ADDRESS, TOKEN_DECIMALS } from '../config/solana';
const MINT_ADDRESS = FALLBACK_MINT_ADDRESS; // Alias for clarity

export interface TokenHolder {
  address: string;
  owner: string;
  amount: number;
}

export interface PrepareTransferResponse {
  transaction: Transaction;
  recentBlockhash: string;
}

class RPCService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
  }

  private getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get all token holders for the HELL token
   */
  async getTokenHolders(mintAddress?: string): Promise<TokenHolder[]> {
    try {
      const connection = this.getConnection();
      const address = mintAddress || MINT_ADDRESS;
      const mintPubKey = new PublicKey(address);

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
                bytes: mintPubKey.toBase58(),
              },
            },
          ],
        }
      );

      // Process the accounts to get holder information
      const holders = tokenAccounts.map((account) => {
        const accountData = AccountLayout.decode(account.account.data);
        const amount = Number(accountData.amount) / 10 ** TOKEN_DECIMALS;
        const owner = new PublicKey(accountData.owner).toString();

        return {
          owner,
          amount,
          address: account.pubkey.toString(),
        };
      });

      // Filter out zero balance accounts
      const activeHolders = holders.filter((holder) => holder.amount > 0);

      // Sort by amount (descending)
      activeHolders.sort((a, b) => b.amount - a.amount);

      return activeHolders;
    } catch (error: any) {
      console.error('Error fetching token holders:', error);
      throw new Error(`Failed to fetch token holders: ${error.message}`);
    }
  }

  /**
   * Get token balance for a specific wallet address
   */
  async getTokenBalance(walletAddress: string, mintAddress?: string): Promise<number> {
    try {
      const connection = this.getConnection();
      const address = mintAddress || MINT_ADDRESS;
      const mintPubKey = new PublicKey(address);
      const walletPubKey = new PublicKey(walletAddress);

      const tokenAccount = await getAssociatedTokenAddress(
        mintPubKey,
        walletPubKey,
        true // allowOwnerOffCurve - enable PDAs support
      );

      try {
        const balance = await connection.getTokenAccountBalance(tokenAccount);
        return balance.value.uiAmount || 0;
      } catch (error) {
        // Token account doesn't exist, return 0 balance
        return 0;
      }
    } catch (error: any) {
      console.error('Error fetching token balance:', error);
      throw new Error(`Failed to fetch token balance: ${error.message}`);
    }
  }

  /**
   * Prepare a token transfer transaction
   */
  async prepareTransfer(
    senderAddress: string,
    recipientAddress: string,
    amount: number,
    mintAddress?: string
  ): Promise<PrepareTransferResponse> {
    try {
      const connection = this.getConnection();
      const address = mintAddress || MINT_ADDRESS;
      const mintPubKey = new PublicKey(address);
      const fromPubkey = new PublicKey(senderAddress);
      const toPubkey = new PublicKey(recipientAddress);

      const fromAssociatedTokenAddress = await getAssociatedTokenAddress(
        mintPubKey,
        fromPubkey,
        true // allowOwnerOffCurve - enable PDAs support
      );

      const destinationAssociatedTokenAddress =
        await getAssociatedTokenAddress(
          mintPubKey,
          toPubkey,
          true // allowOwnerOffCurve - enable PDAs support
        );

      const destination = await connection.getAccountInfo(
        destinationAssociatedTokenAddress
      );

      const tx = new Transaction();

      // Create destination token account if it doesn't exist
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
      const amountBigInt = BigInt(Math.round(amount * 10 ** TOKEN_DECIMALS));

      const splTransferIx = createTransferInstruction(
        fromAssociatedTokenAddress,
        destinationAssociatedTokenAddress,
        fromPubkey,
        amountBigInt
      );

      tx.add(splTransferIx);

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash('max');
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPubkey;

      return {
        transaction: tx,
        recentBlockhash: blockhash,
      };
    } catch (error: any) {
      console.error('Error preparing transfer:', error);
      throw new Error(`Failed to prepare transfer: ${error.message}`);
    }
  }
}

export const rpcService = new RPCService();
