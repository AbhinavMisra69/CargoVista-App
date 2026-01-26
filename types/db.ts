export type OrderType = "hub-spoke" | "p2p" | "personalized";

export type Seller = {
  _id: string;
  sellerId: number;
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  _id: string;
  orderId: number;
  sellerId: number;
  seller: Seller | string;
  source: number;
  destination: number;
  weight: number;
  volume: number;
  priority: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSellerInput = {
  sellerId: number;
  name: string;
  email?: string;
};

export type CreateOrderInput = {
  orderId: number;
  sellerId: number;
  source: number;
  destination: number;
  weight: number;
  volume: number;
  priority?: number;
  timestamp?: string;
};

