import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  txId: {
    type: String,
    required: true,
    unique: true
  },
  senderAddress: {
    type: String,
    required: true
  },
  recipientAddress: {
    type: String,
    required: true
  },
  mintAddress: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema); 