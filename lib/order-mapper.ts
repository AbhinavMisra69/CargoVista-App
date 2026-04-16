import type { MultiFormSchema } from "@/components/multiform";
import type { CreateOrderInput, OrderType } from "@/types/db";

const CITY_TO_ID_MAP: Record<string, number> = {
  Delhi: 1,
  Amritsar: 2,
  Chandigarh: 3,
  Jaipur: 4,
  Lucknow: 5,
  Kanpur: 6,
  Agra: 7,
  Varanasi: 8,
  Meerut: 9,
  Aligarh: 10,
  Patna: 11,
  Ghaziabad: 12,
  Moradabad: 13,
  Bareilly: 14,
  Saharanpur: 15,
  Haridwar: 16,
  Roorkee: 17,
  Rishikesh: 18,
  Nainital: 19,
  Mathura: 20,
  Hoshiarpur: 21,
  Kullu: 22,
  Shimla: 23,
  Kangra: 24,
  Solan: 25,
  Srinagar: 26,
  Jammu: 27,
  Ludhiana: 28,
  Patiala: 29,
  Panipat: 30,
  Sonipat: 31,
  Muzaffarnagar: 32,
  Fatehpur: 33,
  Karnal: 34,
  Bhiwani: 35,
  Hisar: 36,
  Jind: 37,
  Kurukshetra: 38,
  Rohtak: 39,
  Faridabad: 40,
  Barnala: 41,
  Muktsar: 42,
  Sangrur: 43,
  Bhatinda: 44,
  Jalandhar: 45,
  Ambala: 46,
  Gurugram: 47,
  Noida: 48,
  Farukhabad: 49,
};

// Default source (Delhi)
const DEFAULT_SOURCE_ID = 1;

// Determine order type based on logistics goal
export function getOrderTypeFromGoal(goal?: string): OrderType {
  switch (goal) {
    case "cost_efficient":
      return "hub-spoke";
    case "speed":
      return "p2p";
    case "eco_friendly":
      return "personalized";
    default:
      return "hub-spoke";
  }
}

// Map multiform data to order inputs
export function mapFormToOrders(
  formData: MultiFormSchema,
  sellerId: number
): CreateOrderInput[] {
  return formData.orders
    .filter((order) => {
      if (!order.enterDestination) {
        console.warn(
          `Order ${order.orderDescription || "unnamed"} has no destination`
        );
        return false;
      }

      const destinationId = CITY_TO_ID_MAP[order.enterDestination];

      if (!destinationId) {
        console.warn(
          `Order ${order.orderDescription || "unnamed"} has invalid destination: ${order.enterDestination}`
        );
        return false;
      }

      return true;
    })
    .map((order, index) => {
      const destinationId = CITY_TO_ID_MAP[order.enterDestination];

      if (!destinationId) {
        throw new Error(`Invalid destination: ${order.enterDestination}`);
      }

      // Determine priority
      const originalIndex = formData.orders.indexOf(order);
      const priorityIndex = formData.priorityQueue.indexOf(originalIndex);
      const priority = priorityIndex !== -1 ? priorityIndex + 1 : 3;

      // Unique orderId
      const orderId = Date.now() + index;

      return {
        orderId,
        sellerId,
        source: DEFAULT_SOURCE_ID,
        destination: destinationId,
        weight: order.orderWeightKg,
        volume: order.orderVolumeM3,
        priority,
        timestamp: new Date().toISOString(), // ✅ FIXED
      };
    });
}

// Get the order type for all orders in a form submission
export function getOrderTypeForForm(
  formData: MultiFormSchema
): OrderType {
  return getOrderTypeFromGoal(formData.selectFieldGoal);
}