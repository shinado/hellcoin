import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  AccountLayout,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('  Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

app.use(cors({
  origin: '*', // In production, specify mobile app origin
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Constants
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://mainnet.helius-rpc.com/?api-key=2c795199-fdd7-4dd9-9eaf-d900a41016a3';
const MINT_ADDRESS = 'oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump'; // HELL token
const TOKEN_DECIMALS = 6;
const TEST_MODE = process.env.TEST_MODE === 'true';
const JUPITER_API_KEY = process.env.JUPITER_API_KEY;

// Initialize Solana connection
const connection = new Connection(RPC_ENDPOINT, 'confirmed');
const mintPubKey = new PublicKey(MINT_ADDRESS);

/**
 * GET /api/token-holders
 * Get all token holders for the HELL token
 */
app.get('/api/token-holders', async (req, res) => {
  try {
    // Use Helius getProgramAccountsv2 API with pagination
    const rpcUrl = new URL(RPC_ENDPOINT);
    const allHolders = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) { // Limit to 10 pages to prevent infinite loops
      const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getProgramAccounts",
        params: [
          TOKEN_PROGRAM_ID.toBase58(),
          {
            encoding: "base64",
            filters: [
              {
                dataSize: 165
              },
              {
                memcmp: {
                  offset: 0,
                  bytes: mintPubKey.toBase58()
                }
              }
            ],
            page: page,
            limit: 1000 // Helius pagination limit
          }
        ]
      };

      const response = await fetch(rpcUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Helius RPC error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const accounts = data.result || [];
      if (accounts.length === 0) {
        hasMore = false;
      } else {
        // Process the accounts
        for (const account of accounts) {
          const accountData = AccountLayout.decode(Buffer.from(account.account.data[0], 'base64'));
          const amount = Number(accountData.amount) / (10 ** TOKEN_DECIMALS);
          const owner = new PublicKey(accountData.owner).toString();

          allHolders.push({
            owner,
            amount,
            address: account.pubkey
          });
        }

        // If we got less than the limit, we've reached the end
        if (accounts.length < 1000) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    // Filter out zero balance accounts
    const activeHolders = allHolders.filter(holder => holder.amount > 0);

    // Sort by amount (descending)
    activeHolders.sort((a, b) => b.amount - a.amount);

    res.json({ success: true, data: activeHolders });
  } catch (error) {
    console.error('Error fetching token holders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/token-balance/:walletAddress
 * Get token balance for a specific wallet address
 */
app.get('/api/token-balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const walletPubKey = new PublicKey(walletAddress);

    const tokenAccount = await getAssociatedTokenAddress(
      mintPubKey,
      walletPubKey,
      true // allowOwnerOffCurve - enable PDAs support
    );

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );

    try {
      const balance = await Promise.race([
        connection.getTokenAccountBalance(tokenAccount),
        timeoutPromise
      ]);
      res.json({
        success: true,
        data: { balance: balance.value.uiAmount || 0 }
      });
    } catch (error) {
      // Token account doesn't exist or timeout, return 0 balance
      console.log('Token account not found or timeout:', error.message);
      res.json({ success: true, data: { balance: 0 } });
    }
  } catch (error) {
    console.error('Error fetching token balance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/prepare-transfer
 * Prepare a token transfer transaction
 * Body: { senderAddress, recipientAddress, amount }
 */
app.post('/api/prepare-transfer', async (req, res) => {
  try {
    const { senderAddress, recipientAddress, amount } = req.body;

    if (!senderAddress || !recipientAddress || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: senderAddress, recipientAddress, amount'
      });
    }

    const fromPubkey = new PublicKey(senderAddress);
    const toPubkey = new PublicKey(recipientAddress);

    const fromAssociatedTokenAddress = await getAssociatedTokenAddress(
      mintPubKey,
      fromPubkey,
      true // allowOwnerOffCurve - enable PDAs support
    );

    const destinationAssociatedTokenAddress = await getAssociatedTokenAddress(
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

    // Serialize transaction for mobile
    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    // Convert to base64 for transport
    const transactionBase64 = serializedTx.toString('base64');

    res.json({
      success: true,
      data: {
        transaction: transactionBase64,
        recentBlockhash: blockhash
      }
    });
  } catch (error) {
    console.error('Error preparing transfer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/token-price
 * Get token price in USD by getting a quote from Jupiter Ultra API
 * Uses a 1 SOL input to get the SOL/Token price, then converts to USD
 */
app.get('/api/token-price', async (req, res) => {
  try {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const oneSOL = 1e9; // 1 SOL in lamports
    const SOL_USD_PRICE = 240; // Approximate SOL price in USD - update this periodically or fetch from API

    // Use Jupiter Ultra API to get a quote for 1 SOL
    const orderUrl = new URL('https://api.jup.ag/ultra/v1/order');
    orderUrl.searchParams.append('inputMint', SOL_MINT);
    orderUrl.searchParams.append('outputMint', MINT_ADDRESS);
    orderUrl.searchParams.append('amount', oneSOL.toString());
    orderUrl.searchParams.append('slippageBps', '100'); // 1% slippage
    orderUrl.searchParams.append('onlyQuote', 'true'); // Only get quote

    const headers = {};
    if (JUPITER_API_KEY) {
      headers['x-api-key'] = JUPITER_API_KEY;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout

    const response = await fetch(orderUrl.toString(), {
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter Ultra API error: ${response.status} - ${errorText}`);
    }

    const quoteData = await response.json();

    // Calculate price: SOL per token (inverse of tokens per SOL)
    // Jupiter returns how many tokens you get for 1 SOL
    // Price = 1 SOL / (output tokens in token units)
    const outputTokens = quoteData.outAmount
      ? parseInt(quoteData.outAmount) / 10 ** TOKEN_DECIMALS
      : 0;

    const solPerToken = outputTokens > 0 ? 1 / outputTokens : 0;

    // Convert to USD price
    const price = solPerToken * SOL_USD_PRICE;

    res.json({ success: true, data: { price } });
  } catch (error) {
    console.error('Error fetching token price:', error);
    res.json({ success: true, data: { price: 0 } });
  }
});

/**
 * GET /api/token-chart-data
 * Get historical OHLCV price data from Birdeye for candlestick chart
 * Query params:
 *   - timeframe: '1h', '6h', '1d', etc. (default: '6h')
 *   - days: number of days to fetch (default: 7)
 */
app.get('/api/token-chart-data', async (req, res) => {
  try {
    const { timeframe = '6h', days = 7 } = req.query;

    // Calculate time range (unix timestamps in seconds)
    const time_to = Math.floor(Date.now() / 1000);
    const time_from = time_to - (parseInt(days) * 24 * 60 * 60);

    // Check if API key is configured
    if (!process.env.BIRDEYE_API_KEY) {
      console.warn('BIRDEYE_API_KEY not configured, returning empty chart data');
      return res.json({
        success: true,
        data: {
          items: [],
          timeframe,
          time_from,
          time_to,
          error: 'BIRDEYE_API_KEY not configured'
        }
      });
    }

    // Call Birdeye API
    const birdeyeUrl = 'https://public-api.birdeye.so/defi/ohlcv';
    const params = new URLSearchParams({
      address: MINT_ADDRESS,
      type: timeframe,
      time_from: time_from.toString(),
      time_to: time_to.toString(),
      currency: 'usd'
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`${birdeyeUrl}?${params}`, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.BIRDEYE_API_KEY,
        'x-chain': 'solana',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Birdeye API error:', response.status, errorText);
      throw new Error(`Birdeye API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract OHLCV items
    const chartData = data.data?.items || [];

    res.json({
      success: true,
      data: {
        items: chartData,
        timeframe,
        time_from,
        time_to
      }
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch chart data'
    });
  }
});

/**
 * GET /api/quote
 * Get swap quote from Jupiter Ultra API
 * Query params: { type: 'buy'|'sell', amount }
 * - type='buy': amount is SOL to spend
 * - type='sell': amount is HELL to sell
 */
app.get('/api/quote', async (req, res) => {
  try {
    const { type = 'buy', amount } = req.query;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid amount parameter'
      });
    }

    const amountNumber = parseFloat(amount);

    // SOL mint address on Solana
    const SOL_MINT = 'So11111111111111111111111111111111111111112';

    let inputMint, outputMint;

    if (type === 'buy') {
      // Buy token with SOL: SOL -> Token
      inputMint = SOL_MINT;
      outputMint = MINT_ADDRESS;
    } else {
      // Sell token for SOL: Token -> SOL
      inputMint = MINT_ADDRESS;
      outputMint = SOL_MINT;
    }

    // TEST MODE: Return mock data
    if (TEST_MODE) {
      const mockOutputAmount = type === 'buy'
        ? amountNumber * 150 // 1 SOL = 150 USDC (mock rate)
        : amountNumber / 150; // 150 USDC = 1 SOL (mock rate)
      return res.json({
        success: true,
        data: {
          type,
          inputAmount: amountNumber,
          outputAmount: mockOutputAmount,
          inputMint,
          outputMint,
          priceImpactPct: '0.001',
          routePlan: [],
          testMode: true
        }
      });
    }

    // Convert amount to smallest unit (lamports for SOL, token decimals for Token)
    const inputAmount = type === 'buy'
      ? Math.floor(amountNumber * 1e9) // SOL has 9 decimals
      : Math.floor(amountNumber * 10 ** TOKEN_DECIMALS);

    // Use Jupiter Ultra API
    const orderUrl = new URL('https://api.jup.ag/ultra/v1/order');
    orderUrl.searchParams.append('inputMint', inputMint);
    orderUrl.searchParams.append('outputMint', outputMint);
    orderUrl.searchParams.append('amount', inputAmount.toString());
    orderUrl.searchParams.append('slippageBps', '100'); // 1% slippage
    orderUrl.searchParams.append('onlyQuote', 'true'); // Only get quote, don't create order

    const headers = {};
    if (JUPITER_API_KEY) {
      headers['x-api-key'] = JUPITER_API_KEY;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout

    const response = await fetch(orderUrl.toString(), {
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter Ultra API error: ${response.status} - ${errorText}`);
    }

    const quoteData = await response.json();

    // Calculate output amount in human-readable format
    const outputAmount = quoteData.outAmount
      ? (parseInt(quoteData.outAmount) / (type === 'buy' ? 10 ** TOKEN_DECIMALS : 1e9))
      : 0;

    res.json({
      success: true,
      data: {
        type,
        inputAmount: amountNumber,
        outputAmount,
        inputMint,
        outputMint,
        priceImpactPct: quoteData.priceImpactPct,
        routePlan: quoteData.routePlan
      }
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/prepare-buy
 * Prepare a buy transaction (SOL -> Token) via Jupiter Ultra API
 * Body: { walletAddress, amount }
 */
app.post('/api/prepare-buy', async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;

    if (!walletAddress || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, amount'
      });
    }

    const SOL_MINT = 'So11111111111111111111111111111111111111112';

    // TEST MODE: Return mock transaction
    if (TEST_MODE) {
      const expectedOutput = amount * 150; // Mock rate: 1 SOL = 150 USDC

      // Create a mock transaction
      const tx = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash('max');
      tx.recentBlockhash = blockhash;
      tx.feePayer = new PublicKey(walletAddress);

      const serializedTx = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      return res.json({
        success: true,
        data: {
          transaction: serializedTx.toString('base64'),
          recentBlockhash: blockhash,
          inputAmount: amount,
          expectedOutput,
          inputMint: SOL_MINT,
          outputMint: MINT_ADDRESS,
          testMode: true
        }
      });
    }

    const inputAmount = Math.floor(amount * 1e9); // SOL has 9 decimals

    // Use Jupiter Ultra API - single call to get both quote and transaction
    const orderUrl = new URL('https://api.jup.ag/ultra/v1/order');
    orderUrl.searchParams.append('inputMint', SOL_MINT);
    orderUrl.searchParams.append('outputMint', MINT_ADDRESS);
    orderUrl.searchParams.append('amount', inputAmount.toString());
    orderUrl.searchParams.append('slippageBps', '100'); // 1% slippage
    orderUrl.searchParams.append('taker', walletAddress);
    orderUrl.searchParams.append('wrapAndUnwrapSol', 'true');
    orderUrl.searchParams.append('dynamicComputeUnitLimit', 'true');
    orderUrl.searchParams.append('prioritizationFeeLamports', 'auto');

    const headers = { 'Content-Type': 'application/json' };
    if (JUPITER_API_KEY) {
      headers['x-api-key'] = JUPITER_API_KEY;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout

    const response = await fetch(orderUrl.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter Ultra API error: ${response.status} - ${errorText}`);
    }

    const orderData = await response.json();

    // Parse the swap transaction
    const swapTransactionBuf = Buffer.from(orderData.transaction, 'base64');
    const transaction = Transaction.from(swapTransactionBuf);

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash('max');
    transaction.recentBlockhash = blockhash;

    // Re-serialize with updated blockhash
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    const transactionBase64 = serializedTx.toString('base64');

    // Calculate expected output
    const expectedOutput = parseInt(orderData.outAmount) / 10 ** TOKEN_DECIMALS;

    res.json({
      success: true,
      data: {
        transaction: transactionBase64,
        recentBlockhash: blockhash,
        inputAmount: amount,
        expectedOutput,
        inputMint: SOL_MINT,
        outputMint: MINT_ADDRESS
      }
    });
  } catch (error) {
    console.error('Error preparing buy:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/prepare-sell
 * Prepare a sell transaction (Token -> SOL) via Jupiter Ultra API
 * Body: { walletAddress, amount }
 */
app.post('/api/prepare-sell', async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;

    if (!walletAddress || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, amount'
      });
    }

    const SOL_MINT = 'So11111111111111111111111111111111111111112';

    // TEST MODE: Return mock transaction
    if (TEST_MODE) {
      const expectedOutput = amount / 150; // Mock rate: 150 USDC = 1 SOL

      // Create a mock transaction
      const tx = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash('max');
      tx.recentBlockhash = blockhash;
      tx.feePayer = new PublicKey(walletAddress);

      const serializedTx = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      return res.json({
        success: true,
        data: {
          transaction: serializedTx.toString('base64'),
          recentBlockhash: blockhash,
          inputAmount: amount,
          expectedOutput,
          inputMint: MINT_ADDRESS,
          outputMint: SOL_MINT,
          testMode: true
        }
      });
    }

    const inputAmount = Math.floor(amount * 10 ** TOKEN_DECIMALS);

    // Use Jupiter Ultra API - single call to get both quote and transaction
    const orderUrl = new URL('https://api.jup.ag/ultra/v1/order');
    orderUrl.searchParams.append('inputMint', MINT_ADDRESS);
    orderUrl.searchParams.append('outputMint', SOL_MINT);
    orderUrl.searchParams.append('amount', inputAmount.toString());
    orderUrl.searchParams.append('slippageBps', '100'); // 1% slippage
    orderUrl.searchParams.append('taker', walletAddress);
    orderUrl.searchParams.append('wrapAndUnwrapSol', 'true');
    orderUrl.searchParams.append('dynamicComputeUnitLimit', 'true');
    orderUrl.searchParams.append('prioritizationFeeLamports', 'auto');

    const headers = { 'Content-Type': 'application/json' };
    if (JUPITER_API_KEY) {
      headers['x-api-key'] = JUPITER_API_KEY;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout

    const response = await fetch(orderUrl.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter Ultra API error: ${response.status} - ${errorText}`);
    }

    const orderData = await response.json();

    // Parse the swap transaction
    const swapTransactionBuf = Buffer.from(orderData.transaction, 'base64');
    const transaction = Transaction.from(swapTransactionBuf);

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash('max');
    transaction.recentBlockhash = blockhash;

    // Re-serialize with updated blockhash
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    const transactionBase64 = serializedTx.toString('base64');

    // Calculate expected output
    const expectedOutput = parseInt(orderData.outAmount) / 1e9; // SOL has 9 decimals

    res.json({
      success: true,
      data: {
        transaction: transactionBase64,
        recentBlockhash: blockhash,
        inputAmount: amount,
        expectedOutput,
        inputMint: MINT_ADDRESS,
        outputMint: SOL_MINT
      }
    });
  } catch (error) {
    console.error('Error preparing sell:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Hellcoin backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
