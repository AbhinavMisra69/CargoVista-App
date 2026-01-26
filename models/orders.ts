import mongoose, { Schema } from 'mongoose';

// 1. The Shared Schema
const OrderSchema = new Schema({
  orderId: { type: Number, required: true, unique: true },
  sellerId: { type: Number, required: true },
  source: { type: Number, required: true },
  destination: { type: Number, required: true },
  weight: { type: Number, required: true },
  volume: { type: Number, required: true },
  priority: { type: Number, default: 3 },
  status: { type: String, default: 'Pending' } // Pending, Assigned, In-Transit
}, { timestamps: true });

// 2. The Logistics Buckets (Assigned Orders)
export const HubSpokeOrder = mongoose.models.HubSpokeOrder || mongoose.model('HubSpokeOrder', OrderSchema);
export const P2POrder = mongoose.models.P2POrder || mongoose.model('P2POrder', OrderSchema);
export const PersonalizedOrder = mongoose.models.PersonalizedOrder || mongoose.model('PersonalizedOrder', OrderSchema);

// 3. The Staging Bucket (New!)
// Store orders here temporarily while the user decides which model to use.
export const CurSellerOrder = mongoose.models.CurSellerOrder || mongoose.model('CurSellerOrder', OrderSchema);