import { BN } from "@project-serum/anchor";
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
} from "@solana/spl-token";
import dbConnect from '../../utils/dbConnect';

export default async function handler(req, res) {
  await dbConnect();
  
  const { senderAddress, recipientAddress, name, txId, amount } = req.body;

  const transaction = new Transaction();
  transaction.senderAddress = senderAddress;
  transaction.recipientAddress = recipientAddress;
  transaction.name = name;
  transaction.txId = txId;
  transaction.amount = amount;
  await transaction.save();

  res.status(200).json({ message: 'Transaction saved successfully' });
}
