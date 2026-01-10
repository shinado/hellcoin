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

// Middleware
app.use(cors());
app.use(express.json());

// Constants
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const MINT_ADDRESS = '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN'; // USDC for testing
const TOKEN_DECIMALS = 6;
const TEST_MODE = process.env.TEST_MODE === 'true';

// Initialize Solana connection
const connection = new Connection(RPC_ENDPOINT, 'confirmed');
const mintPubKey = new PublicKey(MINT_ADDRESS);

/**
 * GET /api/token-holders
 * Get all token holders for the HELL token
 */
app.get('/api/token-holders', async (req, res) => {
  try {
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
    const holders = tokenAccounts.map(account => {
      const accountData = AccountLayout.decode(account.account.data);
      const amount = Number(accountData.amount) / (10 ** TOKEN_DECIMALS);
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

    try {
      const balance = await connection.getTokenAccountBalance(tokenAccount);
      res.json({
        success: true,
        data: { balance: balance.value.uiAmount || 0 }
      });
    } catch (error) {
      // Token account doesn't exist, return 0 balance
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
 * Get token price from Jupiter API
 */
app.get('/api/token-price', async (req, res) => {
  try {
    const priceUrl = `https://api.jup.ag/price/v2?ids=${MINT_ADDRESS}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(priceUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();

    // Jupiter API v2 returns: { data: { [mintAddress]: { price: "0.00001234" } } }
    const tokenData = data?.data?.[MINT_ADDRESS];
    const price = tokenData?.price ? parseFloat(tokenData.price) : 0;

    res.json({ success: true, data: { price } });
  } catch (error) {
    console.error('Error fetching token price:', error);
    res.json({ success: true, data: { price: 0 } });
  }
});

/**
 * GET /api/quote
 * Get swap quote from Jupiter API
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

    const quoteUrl = new URL('https://quote-api.jup.ag/v6/quote');
    quoteUrl.searchParams.append('inputMint', inputMint);
    quoteUrl.searchParams.append('outputMint', outputMint);
    quoteUrl.searchParams.append('amount', inputAmount.toString());
    quoteUrl.searchParams.append('slippageBps', '100'); // 1% slippage

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(quoteUrl.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
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
 * Prepare a buy transaction (SOL -> Token) via Jupiter
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

    // Get quote from Jupiter
    const quoteUrl = new URL('https://quote-api.jup.ag/v6/quote');
    quoteUrl.searchParams.append('inputMint', SOL_MINT);
    quoteUrl.searchParams.append('outputMint', MINT_ADDRESS);
    quoteUrl.searchParams.append('amount', inputAmount.toString());
    quoteUrl.searchParams.append('slippageBps', '100'); // 1% slippage

    const quoteResponse = await fetch(quoteUrl.toString());
    if (!quoteResponse.ok) {
      throw new Error(`Jupiter quote error: ${quoteResponse.status}`);
    }
    const quoteData = await quoteResponse.json();

    // Get swap transaction from Jupiter
    const swapUrl = new URL('https://quote-api.jup.ag/v6/swap');
    const swapRequestBody = {
      quoteResponse: quoteData,
      userPublicKey: walletAddress,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto'
    };

    const swapResponse = await fetch(swapUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapRequestBody)
    });

    if (!swapResponse.ok) {
      throw new Error(`Jupiter swap error: ${swapResponse.status}`);
    }

    const swapData = await swapResponse.json();

    // Parse the swap transaction
    const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
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
    const expectedOutput = parseInt(quoteData.outAmount) / 10 ** TOKEN_DECIMALS;

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
 * Prepare a sell transaction (Token -> SOL) via Jupiter
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

    // Get quote from Jupiter
    const quoteUrl = new URL('https://quote-api.jup.ag/v6/quote');
    quoteUrl.searchParams.append('inputMint', MINT_ADDRESS);
    quoteUrl.searchParams.append('outputMint', SOL_MINT);
    quoteUrl.searchParams.append('amount', inputAmount.toString());
    quoteUrl.searchParams.append('slippageBps', '100'); // 1% slippage

    const quoteResponse = await fetch(quoteUrl.toString());
    if (!quoteResponse.ok) {
      throw new Error(`Jupiter quote error: ${quoteResponse.status}`);
    }
    const quoteData = await quoteResponse.json();

    // Get swap transaction from Jupiter
    const swapUrl = new URL('https://quote-api.jup.ag/v6/swap');
    const swapRequestBody = {
      quoteResponse: quoteData,
      userPublicKey: walletAddress,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto'
    };

    const swapResponse = await fetch(swapUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapRequestBody)
    });

    if (!swapResponse.ok) {
      throw new Error(`Jupiter swap error: ${swapResponse.status}`);
    }

    const swapData = await swapResponse.json();

    // Parse the swap transaction
    const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
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
    const expectedOutput = parseInt(quoteData.outAmount) / 1e9; // SOL has 9 decimals

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
