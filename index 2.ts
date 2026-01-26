/**
 * Basic City structure matching your C++ vector
 */
export interface City {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

export interface Order {
  orderId: number;
  sellerId: number;
  source: number;
  destination: number;
  weight: number;
  volume: number;
  priority: number; // Removed optional to ensure C++ always gets a value
  status?: 'Pending' | 'In-Transit' | 'Delivered';
}

/**
 * Represents a Seller who originates orders
 */
export interface Seller {
  sellerId: number;
  location: number; // City ID
  orders: Order[];
}

/**
 * Long-haul carrier moving goods between major Hubs
 */
export interface HubHubCarrier {
  carrierId: number;
  fromHubId: number;
  toHubId: number;
  maxWeight: number;
  maxVolume: number;
  remainingWeight: number;
  remainingVolume: number;
  speed: number;
  pendingWeight: number;
  pendingVolume: number;
  pendingOrders: Order[];
  assignedOrders: Order[];
}

/**
 * Regional carrier moving goods between a Hub and its Spokes
 */
export interface HubSpokeCarrier {
  carrierId: number;
  hubLocationId: number;
  maxWeight: number;
  maxVolume: number;
  speed: number;
  remainingWeight: number;
  remainingVolume: number;
  pendingWeight: number;
  pendingVolume: number;
  assignedOrders: Order[];
  pendingOrders: Order[];
}

/**
 * Point-to-Point Node used in the VRP/Simulated Annealing solver
 */
export interface PPCity {
  id: number;
  demand: number;
  supply: number;
  orderId: number; 
  isPickup: boolean;
}

/**
 * Vehicle used in the Point-to-Point/Simulated Annealing model
 */
export interface PPCarrier {
  id: number;
  capacity: number;
  load: number;
  depotID: number;
  route: number[]; 
}

/**
 * Used for visualizing specific carrier paths
 */
export interface CarrierRoute {
  hubId: number;
  route: number[]; 
  totalDistance: number;
  totalWeight: number;
}

export interface OrderResult {
  orderId: number;
  time: number;
  cost: number;
}

export interface OptimizationResult {
  hubSpoke: {
    totalTime: number;
    totalCost: number;
    orderDetails: OrderResult[];
  };
  pointToPoint: {
    totalTime: number;
    totalCost: number;
    orderDetails: OrderResult[];
  };
  personalized: {
    time: number;
    cost: number;
    route: number[];
  };
}

//System Configuration for MongoDB storage
export interface SystemConfig {
  key: string; 
  distMatrix: number[][];   // 49x49 Grid
  hubs: City[];             // Array of City Objects
  clusters: City[][];       // Array of Arrays of City Objects
}