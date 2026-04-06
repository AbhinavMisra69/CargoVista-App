import mongoose, { Schema } from "mongoose";

const baseOrderSchema = new Schema({
  orderId: { type: Number, required: true, unique: true },
  sellerId: { type: Number, required: true },
  source: { type: Number, required: true },
  destination: { type: Number, required: true },
  weight: { type: Number, required: true },
  volume: { type: Number, required: true },
  priority: { type: Number, default: 0 },
  status: { type: String, default: "pending" },
  orderDate: { type: Date, default: Date.now },
}, { discriminatorKey: 'type', timestamps: true });

// Prevent overwrite errors during hot-reload
export const HubSpokeOrder = mongoose.models.HubSpokeOrder || mongoose.model("HubSpokeOrder", baseOrderSchema);
export const P2POrder = mongoose.models.P2POrder || mongoose.model("P2POrder", baseOrderSchema);
export const PersonalizedOrder = mongoose.models.PersonalizedOrder || mongoose.model("PersonalizedOrder", baseOrderSchema);