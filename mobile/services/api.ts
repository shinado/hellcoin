// API service using hybrid architecture
// - Direct Solana RPC calls for token holders, balance, transfers
// - Backend proxy for Jupiter API calls (price, quotes, swaps)

import { Transaction } from '@solana/web3.js';
import { rpcService } from './rpc';

// Backend API URL - configure for different environments
const getBackendUrl = () => {
  // Check for environment variable first
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  // Development default
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return 'http://localhost:3000';
  }
  // Production URL - Railway deployed backend
  return 'https://hellcoin-production-4fa8.up.railway.app';
};

const BACKEND_URL = getBackendUrl();

export interface TokenHolder {
  address: string;
  owner: string;
  amount: number;
}

export interface PrepareTransferResponse {
  transaction: Transaction;
  recentBlockhash: string;
}

export interface TokenBalanceResponse {
  balance: number;
}

export interface QuoteResponse {
  type: 'buy' | 'sell';
  inputAmount: number;
  outputAmount: number;
  inputMint: string;
  outputMint: string;
  priceImpactPct?: string;
  routePlan?: any[];
  testMode?: boolean;
}

export interface PrepareTradeResponse {
  transaction: Transaction;
  recentBlockhash: string;
  inputAmount: number;
  expectedOutput: number;
  inputMint: string;
  outputMint: string;
  testMode?: boolean;
}

class ApiService {
  private async fetchWithErrorHandling(url: string, options?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Get token holders list via backend
   */
  async getTokenHolders(): Promise<TokenHolder[]> {
    try {
      const response = await this.fetchWithErrorHandling(
        `${BACKEND_URL}/api/token-holders`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch token holders');
      }

      return result.data;
    } catch (error: any) {
      console.error('Error fetching token holders:', error);
      throw error;
    }
  }

  /**
   * Get token balance for a wallet address via backend
   */
  async getTokenBalance(walletAddress: string): Promise<TokenBalanceResponse> {
    try {
      const response = await this.fetchWithErrorHandling(
        `${BACKEND_URL}/api/token-balance/${walletAddress}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch token balance');
      }

      return result.data;
    } catch (error: any) {
      console.error('Error fetching token balance:', error);
      throw error;
    }
  }

  /**
   * Prepare a token transfer transaction via backend
   */
  async prepareTransfer(
    senderAddress: string,
    recipientAddress: string,
    amount: number
  ): Promise<PrepareTransferResponse> {
    try {
      const response = await this.fetchWithErrorHandling(
        `${BACKEND_URL}/api/prepare-transfer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            senderAddress,
            recipientAddress,
            amount,
          }),
        }
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to prepare transfer');
      }

      // Deserialize transaction from base64
      const transactionBuf = Buffer.from(result.data.transaction, 'base64');
      const transaction = Transaction.from(transactionBuf);

      return {
        transaction,
        recentBlockhash: result.data.recentBlockhash,
      };
    } catch (error: any) {
      console.error('Error preparing transfer:', error);
      throw error;
    }
  }

  /**
   * Get token price from backend (which calls Jupiter)
   */
  async getTokenPrice(): Promise<number> {
    try {
      const response = await this.fetchWithErrorHandling(
        `${BACKEND_URL}/api/token-price`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch token price');
      }

      return result.data.price;
    } catch (error: any) {
      console.error('Error fetching token price:', error);
      return 0;
    }
  }

  /**
   * Get swap quote from backend (which calls Jupiter)
   * @param type - 'buy' for SOL -> Token, 'sell' for Token -> SOL
   * @param amount - Amount to swap (in human-readable format)
   */
  async getQuote(type: 'buy' | 'sell', amount: number): Promise<QuoteResponse> {
    const params = new URLSearchParams({
      type,
      amount: amount.toString(),
    });

    const response = await this.fetchWithErrorHandling(
      `${BACKEND_URL}/api/quote?${params.toString()}`
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch quote');
    }

    return result.data;
  }

  /**
   * Prepare a buy transaction (SOL -> Token) via backend (which calls Jupiter)
   * @param walletAddress - User's wallet address
   * @param amount - Amount of SOL to spend (in human-readable format)
   */
  async prepareBuy(walletAddress: string, amount: number): Promise<PrepareTradeResponse> {
    const response = await this.fetchWithErrorHandling(
      `${BACKEND_URL}/api/prepare-buy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          amount,
        }),
      }
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to prepare buy transaction');
    }

    // Deserialize transaction from base64
    const transactionBuf = Buffer.from(result.data.transaction, 'base64');
    const transaction = Transaction.from(transactionBuf);

    return {
      transaction,
      recentBlockhash: result.data.recentBlockhash,
      inputAmount: result.data.inputAmount,
      expectedOutput: result.data.expectedOutput,
      inputMint: result.data.inputMint,
      outputMint: result.data.outputMint,
      testMode: result.data.testMode,
    };
  }

  /**
   * Prepare a sell transaction (Token -> SOL) via backend (which calls Jupiter)
   * @param walletAddress - User's wallet address
   * @param amount - Amount of tokens to sell (in human-readable format)
   */
  async prepareSell(walletAddress: string, amount: number): Promise<PrepareTradeResponse> {
    const response = await this.fetchWithErrorHandling(
      `${BACKEND_URL}/api/prepare-sell`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          amount,
        }),
      }
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to prepare sell transaction');
    }

    // Deserialize transaction from base64
    const transactionBuf = Buffer.from(result.data.transaction, 'base64');
    const transaction = Transaction.from(transactionBuf);

    return {
      transaction,
      recentBlockhash: result.data.recentBlockhash,
      inputAmount: result.data.inputAmount,
      expectedOutput: result.data.expectedOutput,
      inputMint: result.data.inputMint,
      outputMint: result.data.outputMint,
      testMode: result.data.testMode,
    };
  }
}

export const api = new ApiService();
export default api;
