import mongoose from 'mongoose';

const NameMapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.NameMap || mongoose.model('NameMap', NameMapSchema); 