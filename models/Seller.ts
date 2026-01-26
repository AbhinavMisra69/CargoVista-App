import mongoose, { Schema } from "mongoose";

export type SellerDocument = {
  _id: mongoose.Types.ObjectId;
  sellerId: number;
  name: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
};

const SellerSchema = new Schema<SellerDocument>(
  {
    sellerId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true }
);

export const Seller =
  mongoose.models.Seller || mongoose.model<SellerDocument>("Seller", SellerSchema);

