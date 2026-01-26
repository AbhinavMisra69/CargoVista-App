import type { MultiFormSchema } from "@/components/multiform";
import type { CreateOrderInput, OrderType } from "@/types/db";

// Map city name to a numeric ID (you can expand this mapping)
const CITY_TO_ID_MAP: Record<string, number> = {
  "Delhi": 1,
  "Jaipur": 2,
  "Lucknow": 3,
  "Chandigarh": 4,
  "Agra": 5,
  "Ambala": 6,
  "Kanpur": 7,
  "Amritsar": 8,
  "Varanasi": 9,
  "Meerut": 10,
  "Aligarh": 11,
  "Patna": 12,
  "Ghaziabad": 13,
  "Moradabad": 14,
  "Bareilly": 15,
  "Saharanpur": 16,
  "Haridwar": 17,
  "Roorkee": 18,
  "Rishikesh": 19,
  "Nainital": 20,
  "Mathura": 21,
  "Hoshiarpur": 22,
  "Kullu": 23,
  "Shimla": 24,
  "Kangra": 25,
  "Solan": 26,
  "Srinagar": 27,
  "Jammu": 28,
  "Ludhiana": 29,
  "Patiala": 30,
  "Panipat": 31,
  "Sonipat": 32,
  "Muzaffarnagar": 33,
  "Fatehpur": 34,
  "Karnal": 35,
  "Bhiwani": 36,
  "Hisar": 37,
  "Jind": 38,
  "Kurukshetra": 39,
  "Rohtak": 40,
  "Faridabad": 41,
  "Barnala": 42,
  "Muktsar": 43,
  "Sangrur": 44,
  "Bhatinda": 45,
  "Jalandhar": 46,
  "Gurugram": 47,
  "Noida": 48,
  "Farukhabad": 49,
};

// Default source (Delhi)
const DEFAULT_SOURCE_ID = 1;

// Determine order type based on logistics goal
export function getOrderTypeFromGoal(goal?: string): OrderType {
  switch (goal) {
    case "cost_efficient":
      return "hub-spoke"; // Cost-efficient uses hub & spoke model
    case "speed":
      return "p2p"; // Speed uses point-to-point
    case "eco_friendly":
      return "personalized"; // Eco-friendly uses personalized carriers
    default:
      return "hub-spoke"; // Default
  }
}

// Map multiform data to order inputs
export function mapFormToOrders(
  formData: MultiFormSchema,
  sellerId: number
): CreateOrderInput[] {
  const orderType = getOrderTypeFromGoal(formData.selectFieldGoal);
  
  return formData.orders
    .filter((order) => {
      // Filter out orders with invalid destinations
      if (!order.enterDestination) {
        console.warn(`Order ${order.orderDescription || 'unnamed'} has no destination`);
        return false;
      }
      const destinationId = CITY_TO_ID_MAP[order.enterDestination];
      if (!destinationId || destinationId === 0) {
        console.warn(`Order ${order.orderDescription || 'unnamed'} has invalid destination: ${order.enterDestination}`);
        return false;
      }
      return true;
    })
    .map((order, index) => {
      const destinationId = CITY_TO_ID_MAP[order.enterDestination];
      if (!destinationId) {
        throw new Error(`Invalid destination: ${order.enterDestination}`);
      }
      
      // Determine priority: if order is in priority queue, use its rank (1-based), otherwise use default
      const originalIndex = formData.orders.indexOf(order);
      const priorityIndex = formData.priorityQueue.indexOf(originalIndex);
      const priority = priorityIndex !== -1 ? priorityIndex + 1 : 3; // 1 = highest, 3 = default
      
      // Generate a unique orderId (timestamp + index)
      const orderId = Date.now() + index;

      return {
        orderId,
        sellerId,
        source: DEFAULT_SOURCE_ID, // Default source (Delhi)
        destination: destinationId,
        weight: order.orderWeightKg,
        volume: order.orderVolumeM3,
        priority,
        timestamp: order.orderDeadlineOptional?.toISOString(),
      };
    });
}

// Get the order type for all orders in a form submission
export function getOrderTypeForForm(formData: MultiFormSchema): OrderType {
  return getOrderTypeFromGoal(formData.selectFieldGoal);
}
