const int d = 12;
const int v = 1;
const int w = 1;
#include <iostream>     // cout, cin
#include <vector>       // vector
#include <string>       // string
#include <map>          // map
#include <unordered_map>// unordered_map
#include <unordered_set>// unordered_set
#include <list>         // list
#include <queue>        // priority_queue
#include <algorithm>   // sort, find, remove, max
#include <cmath>       // ceil, exp
#include <limits>      // numeric_limits
#include <cstdlib>     // rand, srand
#include <ctime>       // time
#include <functional>  // hash
#include "nlohmann/json.hpp"

using json = nlohmann::json;
using namespace std;
json conclusion; //main json output object
json hsOrders = json::array(); //json output array for hub spoke 
json ppOrders = json::array();


struct City {
    int id;
    string name;
    double lat, lon;

    City() {}

    City(int id, const string& name, double lat, double lon)
        : id(id), name(name), lat(lat), lon(lon) {}
};

vector<City> cities;
//input init json objects
vector<vector<double>> distBtwCities;
vector<vector<City>> clusters;
vector<City>hubs;

class Order {
public:
    int orderId;
    int sellerId;
    int source;
    int destination;
    double weight;
    double volume;

    // Default constructor for json library
    Order() : orderId(0), sellerId(0), source(0), destination(0), weight(0), volume(0) {}

    // Updated constructor to accept ID from the database/frontend
    Order(int oId, int sId, int src, int des, double w, double v)
        : orderId(oId), sellerId(sId), source(src), destination(des), weight(w), volume(v) {}
};

struct pair_hash {
    template <class T1, class T2>
    std::size_t operator()(const std::pair<T1, T2>& p) const {
        auto h1 = std::hash<T1>{}(p.first);
        auto h2 = std::hash<T2>{}(p.second);
        return h1 ^ (h2 << 1); // combine hashes
    }
};


class HubHubCarrier {
public:
    int carrierId;
    int fromHubId;
    int toHubId;

    double maxWeight;
    double maxVolume;
    double remainingWeight;
    double remainingVolume;
    double speed;
    double pendingWeight;
    double pendingVolume;
    list<Order>pendingOrders;
    vector<Order> assignedOrders;

    HubHubCarrier(){}
    HubHubCarrier(int id, int fromHub, int toHub, double capWeight = 12000.0, double capVolume = 50.0, double spd = 60.0)
        : carrierId(id), fromHubId(fromHub), toHubId(toHub),
          maxWeight(capWeight), maxVolume(capVolume),
          remainingWeight(capWeight), remainingVolume(capVolume),
          speed(spd) {}

    bool canCarry(const Order& o) const {
        return /*o.source == fromHubId &&
               o.destination == toHubId &&*/
               o.weight <= remainingWeight &&
               o.volume <= remainingVolume;
    }

    void assignOrder(const Order& o) {
        assignedOrders.push_back(o);
        remainingWeight -= o.weight;
        remainingVolume -= o.volume;
    }
     void assignPendingOrder(const Order& o) {
        pendingOrders.push_back(o);
        pendingWeight+=o.weight;
        pendingVolume+=o.volume;
    }
};

unordered_map<pair<int,int>,HubHubCarrier,pair_hash>locToHHCarrier;

pair<int,double> assignOrderHubHub(int src,int dest,const Order& order) {
    double dist=distBtwCities[src-1][dest-1];
    double cost=d*dist+w*order.weight+v*order.volume;
    int time=0;
    HubHubCarrier carrier;
    if(locToHHCarrier.count({src,dest}))
        carrier=locToHHCarrier[{src,dest}];
    else
        carrier=locToHHCarrier[{dest,src}];
    if (carrier.canCarry(order))
    {
        carrier.assignOrder(order);
        time++;
    }
    else
    {
        //order couldn't be assigned
        carrier.assignPendingOrder(order);
        time+=(int)ceil(max((double)carrier.pendingWeight/carrier.maxWeight,(double)carrier.pendingVolume/carrier.maxVolume));
    }
    return {time,cost};
}

class HubSpokeCarrier {
public:
    int carrierId;
    double maxWeight;
    double maxVolume;
    double speed;
    int hubLocationId;

    double remainingWeight;
    double remainingVolume;
    double pendingWeight;
    double pendingVolume;
    vector<Order>assignedOrders;
    list<Order>pendingOrders;

    HubSpokeCarrier(){}
    HubSpokeCarrier(int id, int hubLoc, double capWeight = 7000.0, double capVolume = 35.0, double spd = 50.0)
        : carrierId(id), hubLocationId(hubLoc), maxWeight(capWeight), maxVolume(capVolume), speed(spd),
          remainingWeight(capWeight), remainingVolume(capVolume) {}

    bool canCarry(const Order& o) const {
        return (o.weight <= remainingWeight) && (o.volume <= remainingVolume);
    }

    void assignOrder(const Order& o) {
        assignedOrders.push_back(o);
        remainingWeight -= o.weight;
        remainingVolume -= o.volume;
    }
    void assignPendingOrder(const Order& o) {
        pendingOrders.push_back(o);
        pendingWeight+=o.weight;
        pendingVolume+=o.volume;
    }
};

unordered_map<pair<int,int>,HubSpokeCarrier,pair_hash>locToHSCarrier;

pair<int,double> assignOrderSpokeHub(int spoke,const Order& order,unordered_map<int,int>& spokeToHub) {
    int hub=spokeToHub[spoke];
    double dist=distBtwCities[spoke-1][hub-1];
    double cost=d*dist+w*order.weight+v*order.volume;
    int time=0;

    HubSpokeCarrier carrier=locToHSCarrier[{spoke,hub}];
    if (carrier.canCarry(order))
    {
        carrier.assignOrder(order);
        time++;
    }
    else
    {
        //order couldn't be assigned
        carrier.assignPendingOrder(order);
        time+=(int)ceil(max((double)carrier.pendingWeight/carrier.maxWeight,(double)carrier.pendingVolume/carrier.maxVolume));
    }
    return {time,cost};
}

pair<int,double> processOrder(Order& order,unordered_map<int,int>& spokeToHub)
{
    int srcHub=spokeToHub[order.source];
    int destHub=spokeToHub[order.destination];
    int time=0;
    double cost=0;
    pair<int,int>timeNdCost;
    if(order.source!=srcHub)
    {
        timeNdCost=assignOrderSpokeHub(order.source,order,spokeToHub);
        time+=timeNdCost.first;
        cost+=timeNdCost.second;
    }
    if(destHub!=srcHub)
    {
        timeNdCost=assignOrderHubHub(srcHub,destHub,order);
        time+=timeNdCost.first;
        cost+=timeNdCost.second;
    }
    if(order.destination!=destHub)
    {
        timeNdCost=assignOrderSpokeHub(order.destination,order,spokeToHub);
        time+=timeNdCost.first;
        cost+=timeNdCost.second;
    }
    return {time,cost};
}

struct PPCity {
    int id;
    double demand;
    double supply;
    int orderId = -1;
    bool isPickup = false;
    PPCity() {}
    PPCity(int i, double d, double s = 0, int oid = -1, bool pickup = false) : id(i), demand(d), supply(s), orderId(oid), isPickup(pickup) {}
    bool operator==(const PPCity& other) const {
        return id == other.id && demand == other.demand && supply == other.supply;
    }
};

struct PPCarrier {
    static int n;
    int id;
    double capacity = 6000;
    double load = 0;
    int depotID;
    vector<int> route; // sequence of PPCity indices
    PPCarrier()
    {
        id=n++;
    }
};
int PPCarrier::n=0;

double RouteCost(vector<int>& route,vector<PPCity>& nodes,PPCity& depot) {
    if (route.empty()) return 0;
    double cost = 0.0;
    cost += distBtwCities[depot.id-1][nodes[route.front()].id-1];
    for (int i = 0; i < route.size() - 1; ++i)
        cost += distBtwCities[nodes[route[i]].id-1][nodes[route[i+1]].id-1];
    cost += distBtwCities[nodes[route.back()].id-1][depot.id-1];
    return cost;
}

double TotalCost(vector<PPCarrier>& vehicles, vector<PPCity>& nodes, unordered_map<int, PPCity>& depotMap) {
    double total = 0.0;
    for (auto& v : vehicles)
        total += RouteCost(v.route, nodes, depotMap.at(v.depotID));
    return total;
}
vector<PPCarrier> CreateInitialSolution(vector<PPCity>& nodes,
                                        vector<pair<int, int>>& pdPairs,
                                        vector<PPCity>& depots,
                                        int vehiclesPerDepot,
                                        unordered_map<int, int>& orderToVehicleIdx) {
    unordered_map<int, PPCity> depotMap;
    for (auto& d : depots)
        depotMap[d.id] = d;

    vector<PPCarrier> vehicles;
    unordered_map<int, vector<int>> depotToVehicleIndices;

    for (auto& depot : depots) {
        for (int i = 0; i < vehiclesPerDepot; ++i) {
            PPCarrier v;
            v.capacity = 5000;
            v.load = 0;
            v.depotID = depot.id;
            vehicles.push_back(v);
            depotToVehicleIndices[depot.id].push_back(vehicles.size() - 1);
        }
    }

    vector<pair<double, int>> depotDistances;
    unordered_set<int> assignedOrders;

    for (auto& pair : pdPairs) {
        int pid = pair.first;
        int did = pair.second;
        int orderId = nodes[pid].orderId;
        if (assignedOrders.count(orderId)) continue;

        double weight = nodes[pid].supply;
        bool assigned = false;

        for (auto& depot : depots) {
            double d = distBtwCities[depot.id - 1][nodes[pid].id - 1];
            depotDistances.emplace_back(d, depot.id);
        }
        sort(depotDistances.begin(), depotDistances.end());

        for (auto [_, depotID] : depotDistances) {
            for (int vidx : depotToVehicleIndices[depotID]) {
                PPCarrier& v = vehicles[vidx];
                if (v.load + weight <= v.capacity) {
                    v.route.push_back(pid);
                    v.route.push_back(did);
                    v.load += weight;
                    assignedOrders.insert(orderId);
                    orderToVehicleIdx[orderId] = vidx;
                    assigned = true;
                    break;
                }
            }
            if (assigned) break;
        }
        depotDistances.clear();
    }

    return vehicles;
}


// Validate route constraints: pickup before delivery, capacity not exceeded
bool IsValidRoute(vector<int>& route, vector<PPCity>& nodes, double capacity) {
    unordered_map<int, bool> pickedUp;
    double load = 0;

    for (int idx : route) {
        PPCity& n = nodes[idx];
        if (n.isPickup) {
            load += n.supply;
            pickedUp[n.orderId] = true;
        } else {
            if (!pickedUp[n.orderId]) return false;
            load -= n.demand;
        }
        if (load > capacity) return false;
    }
    return true;
}

// Neighborhood: swap two full order pairs (pickup-delivery pair)
void SwapOrders(vector<PPCarrier>& vehicles,
                vector<pair<int, int>>& pdPairs,
                vector<PPCity>& nodes,
                unordered_map<int, int>& tempOrderToVehicleIdx) {

    int maxAttempts = 100;
    while (maxAttempts--) {
        int v1 = rand() % vehicles.size();
        int v2 = rand() % vehicles.size();
        if (vehicles[v1].route.empty() || vehicles[v2].route.empty()) continue;

        int i = rand() % pdPairs.size();
        int j = rand() % pdPairs.size();
        if (i == j) continue;

        int pid1 = pdPairs[i].first, did1 = pdPairs[i].second;
        int pid2 = pdPairs[j].first, did2 = pdPairs[j].second;

        int o1 = nodes[pid1].orderId;
        int o2 = nodes[pid2].orderId;

        auto& r1 = vehicles[v1].route;
        auto& r2 = vehicles[v2].route;

        bool r1_has_pair1 = find(r1.begin(), r1.end(), pid1) != r1.end() &&
                            find(r1.begin(), r1.end(), did1) != r1.end();
        bool r2_has_pair2 = find(r2.begin(), r2.end(), pid2) != r2.end() &&
                            find(r2.begin(), r2.end(), did2) != r2.end();
        if (!r1_has_pair1 || !r2_has_pair2) continue;

        // Remove original orders
        r1.erase(remove(r1.begin(), r1.end(), pid1), r1.end());
        r1.erase(remove(r1.begin(), r1.end(), did1), r1.end());

        r2.erase(remove(r2.begin(), r2.end(), pid2), r2.end());
        r2.erase(remove(r2.begin(), r2.end(), did2), r2.end());

        // Insert swapped orders
        r1.push_back(pid2);
        r1.push_back(did2);
        tempOrderToVehicleIdx[o2] = v1;

        r2.push_back(pid1);
        r2.push_back(did1);
        tempOrderToVehicleIdx[o1] = v2;

    }
    return;
}

vector<PPCarrier> SimulatedAnnealingVRP(vector<PPCity>& nodes,
                                        vector<pair<int, int>>& pdPairs,
                                        vector<PPCity> depots,
                                        int vehiclesPerDepot,
                                        unordered_map<int, int>& orderToVehicleIdx) {
    unordered_map<int, PPCity> depotMap;
    for (auto& d : depots)
        depotMap[d.id] = d;

    // Generate initial solution
    vector<PPCarrier> current = CreateInitialSolution(nodes, pdPairs, depots, vehiclesPerDepot, orderToVehicleIdx);
    vector<PPCarrier> best = current;
    double bestCost = TotalCost(best, nodes, depotMap);

    double temp = 1000.0;
    double cooling = 0.995;
    int maxIter = 10000;

    srand(time(0));
    unordered_map<int, int> currentOrderMap = orderToVehicleIdx;

    for (int iter = 0; iter < maxIter; ++iter) {
        vector<PPCarrier> neighbor = current;
        unordered_map<int, int> tempOrderMap = currentOrderMap;

        SwapOrders(neighbor, pdPairs, nodes, tempOrderMap);

        bool valid = true;
        for (auto& v : neighbor) {
            if (!IsValidRoute(v.route, nodes, v.capacity)) {
                valid = false;
                break;
            }
        }
        if (!valid) continue;

        double newCost = TotalCost(neighbor, nodes, depotMap);
        double delta = newCost - bestCost;

        if (delta < 0 || ((double)rand() / RAND_MAX) < exp(-delta / temp)) {
            current = neighbor;
            currentOrderMap = tempOrderMap;

            if (newCost < bestCost) {
                best = neighbor;
                bestCost = newCost;
                orderToVehicleIdx = currentOrderMap;
            }
        }

        temp *= cooling;
    }

    return best;
}

void PPCost(vector<Order>& curSellerOrders, vector<PPCarrier>& bestSolution, unordered_map<int, int>& orderToVehicleIdx, vector<PPCity>& nodes) {
    int src = curSellerOrders[0].source;
    double totalCost = 0;
    double totalDist = 0;
    int maxTime = 0;

    // JSON Arrays to hold detailed outputs
    json ppOrders = json::array();
    json ppRoutes = json::array();
    unordered_set<int> visitedVehicles; // To avoid listing the same truck twice

    for (const Order& order : curSellerOrders) {
        int orderId = order.orderId;
        int dest = order.destination;

        if (orderToVehicleIdx.find(orderId) == orderToVehicleIdx.end()) {
            // cerr << "Warning: Order " << orderId << " is not assigned to any vehicle.\n";
            continue;
        }

        int vIdx = orderToVehicleIdx[orderId];
        const PPCarrier& carr = bestSolution[vIdx];
        const vector<int>& route = carr.route;

        // --- 1. CALCULATE COST & TIME FOR THIS SPECIFIC ORDER ---
        int srcPos = -1, destPos = -1;
        for (int i = 0; i < route.size(); ++i) {
            if (nodes[route[i]].id == src && srcPos == -1) srcPos = i;
            if (nodes[route[i]].id == dest && srcPos != -1) {
                destPos = i;
                break;
            }
        }

        if (srcPos == -1 || destPos == -1) continue;

        double dist = 0.0;
        for (int i = srcPos; i < destPos; ++i)
            dist += distBtwCities[nodes[route[i]].id - 1][nodes[route[i + 1]].id - 1];

        double cost = dist * 18 + order.weight * 1.9;
        int timeDays = (int)ceil(dist / (40.0 * 16)); // 40 km/h, 16 hours/day

        totalCost += cost;
        totalDist += dist;
        maxTime = max(maxTime, timeDays);

        ppOrders.push_back({
            {"orderId", order.orderId},
            {"time", timeDays}, 
            {"cost", cost}
        });

        // --- 2. EXTRACT ROUTE NAMES FOR THIS VEHICLE ---
        // Only run this if we haven't already documented this specific truck
        if (visitedVehicles.find(vIdx) == visitedVehicles.end()) {
            visitedVehicles.insert(vIdx);

            vector<string> routeNames;

            // A. Start at Depot
            // Note: cities vector is 0-indexed, IDs are 1-based
            routeNames.push_back(cities[carr.depotID - 1].name + " (Depot)");

            // B. Traverse the Route (Nodes)
            for (int nodeId : carr.route) {
                // nodes[nodeId] gives the PPCity, .id gives the real City ID
                int cityId = nodes[nodeId].id;
                routeNames.push_back(cities[cityId - 1].name);
            }

            // C. Return to Depot
            routeNames.push_back(cities[carr.depotID - 1].name + " (Depot)");

            ppRoutes.push_back({
                {"vehicleId", carr.id},
                {"route", routeNames}
            });
        }
    }

    // --- 3. FINAL JSON ASSIGNMENT ---
    // Make sure 'conclusion' is defined globally or passed by reference
    conclusion["pointToPoint"] = {
        {"totalTime", maxTime},
        {"totalCost", totalCost},
        {"orderDetails", ppOrders},
        {"routes", ppRoutes} 
    };
}

struct CarrierRoute {
    int hubId;
    vector<int> route; // seller pickup followed by delivery location IDs
    double totalDistance;
    double totalWeight;
};

// Simple TSP: Nearest Neighbor followed by 2-opt
vector<int> tspRoute(City& start, vector<City>& points) {
    if (points.empty()) return {};
    vector<int> visited;
    unordered_set<int> used;
    City current = start;

    while (visited.size() < points.size()) {
        double minDist = 1e9;
        int minIdx = -1;
        for (int i = 0; i < points.size(); ++i) {
            if (used.count(points[i].id)) continue;
            double d = distBtwCities[current.id-1][points[i].id-1];
            if (d < minDist) {
                minDist = d;
                minIdx = i;
            }
        }
        if (minIdx != -1) {
            visited.push_back(points[minIdx].id);
            used.insert(points[minIdx].id);
            current = points[minIdx];
        } else break;
    }
    return visited;
}

CarrierRoute PersonalizedCarrierRouting(vector<Order>& orders,
                                        int hubid,
                                        const vector<City>& cities,
                                        City& sellerLocation,
                                        double vehicleCapacity) {
    CarrierRoute fullRoute;
    fullRoute.totalDistance = 0;
    if(hubid!=sellerLocation.id){
        fullRoute.route.push_back(hubid);
        fullRoute.totalDistance = distBtwCities[hubid-1][sellerLocation.id-1];
    }
    fullRoute.totalWeight = 0;
    fullRoute.hubId = hubid;

    // Sort orders in descending weight for offline best-fit
    vector<Order> sortedOrders = orders;
    sort(sortedOrders.begin(), sortedOrders.end(), [](const Order& a, const Order& b) {
        return a.weight > b.weight;
    });

    // Bin packing using offline best-fit
    struct VehicleBin {
        double capacityLeft;
        vector<Order> assignedOrders;
    };

    vector<VehicleBin> bins;

    for (Order& order : sortedOrders) {
        int bestFitIdx = -1;
        double minRemaining = vehicleCapacity;

        for (int i = 0; i < bins.size(); ++i) {
            if (bins[i].capacityLeft >= order.weight &&
                bins[i].capacityLeft - order.weight <= minRemaining) {
                bestFitIdx = i;
                minRemaining = bins[i].capacityLeft - order.weight;
            }
        }

        if (bestFitIdx == -1) {
            // Create new bin (trip)
            bins.push_back({vehicleCapacity - order.weight, {order}});
        } else {
            bins[bestFitIdx].capacityLeft -= order.weight;
            bins[bestFitIdx].assignedOrders.push_back(order);
        }
    }

    // generating routes from bins
    fullRoute.route.push_back(sellerLocation.id);
    City prev = sellerLocation;

    for (const auto& bin : bins) {
        // Collect delivery points
        vector<City> deliveryPoints;
        for (const Order& o : bin.assignedOrders) {
            deliveryPoints.push_back(cities[o.destination-1]);
        }
        vector<int> deliveryOrder = tspRoute(sellerLocation, deliveryPoints);

        for (int id : deliveryOrder) {
            fullRoute.totalDistance += distBtwCities[prev.id - 1][id - 1];
            fullRoute.route.push_back(id);
            prev = cities[id - 1];
        }
        // Return to seller after delivering all in this bin
        fullRoute.totalDistance += distBtwCities[prev.id - 1][hubid - 1];
        fullRoute.route.push_back(hubid);
        prev = sellerLocation;
        fullRoute.totalWeight += vehicleCapacity - bin.capacityLeft;
    }

    return fullRoute;
}

// Dijkstra and PriorityBasedCarrierRoute unchanged...

struct OrderWithPriority {
    Order order;
    int priority;
    bool operator<(const OrderWithPriority& other) const {
        return priority > other.priority;
    }
    OrderWithPriority(const Order& o, int p) : order(o), priority(p) {}
};

// Dijkstra's Algorithm using adjacency matrix
vector<int> shortestPath(int src, int dest, const vector<vector<double>>& adj_matrix) {
    int n = adj_matrix.size();
    vector<double> dist(n, numeric_limits<double>::infinity());
    vector<int> prev(n, -1);
    vector<bool> visited(n, false);
    priority_queue<pair<double, int>, vector<pair<double, int>>,greater<>> pq;

    dist[src] = 0;
    pq.push({0.0, src});

    while (!pq.empty()) {
        auto [currDist, u] = pq.top(); pq.pop();
        if (visited[u]) continue;
        visited[u] = true;

        for (int v = 0; v < n; ++v) {
            if (adj_matrix[u-1][v-1] > 0 && !visited[v]) {
                double alt = dist[u] + adj_matrix[u-1][v-1];
                if (alt < dist[v]) {
                    dist[v] = alt;
                    prev[v] = u;
                    pq.push({alt, v});
                }
            }
        }
    }

    vector<int> path;
    for (int at = dest; at != -1; at = prev[at])
        path.push_back(at);
    reverse(path.begin(), path.end());
    return path;
}

CarrierRoute PriorityBasedCarrierRoute(vector<Order>& orders,
                                       unordered_map<int, int>& orderPriority,
                                       City& sellerLocation,
                                       vector<vector<double>>& adj_matrix,
                                       int hubId,
                                       double vehicleCapacity) {
    priority_queue<OrderWithPriority> pq;
    unordered_map<int, vector<Order>> ordersByCity;
    unordered_set<int> deliveredOrderIds;

    for (const auto& order : orders) {
        if (order.weight > vehicleCapacity) continue; // skip overweight orders
        int pri = orderPriority.at(order.orderId);
        pq.push({order, pri});
        ordersByCity[order.destination].push_back(order);
    }

    CarrierRoute cr;
    cr.hubId = hubId;
    cr.route.push_back(hubId);
    cr.route.push_back(sellerLocation.id);
    cr.totalWeight = 0;
    cr.totalDistance = distBtwCities[hubId-1][sellerLocation.id-1];//carrier moves from the nearest seller hub to the seller's location
    int currentCity = sellerLocation.id;
    OrderWithPriority next=pq.top();

    while (!pq.empty()) {
        double currentLoad = 0.0;
        int startCity = currentCity;

        while (!pq.empty()) {
            do {
                if (pq.empty()) break;
                next = pq.top(); pq.pop();
            } while (deliveredOrderIds.count(next.order.orderId));
            if (deliveredOrderIds.count(next.order.orderId)) break;
            if (currentLoad + next.order.weight > vehicleCapacity) {
                pq.push(next); // Put back for next round
                break;
            }

            vector<int> path = shortestPath(currentCity, next.order.destination, adj_matrix);

            for (size_t i = 1; i < path.size(); ++i) {
                int prevCity = path[i - 1];
                int thisCity = path[i];
                cr.totalDistance += adj_matrix[prevCity-1][thisCity-1];

                if (!ordersByCity.count(thisCity)) continue;
                for (const auto& o : ordersByCity[thisCity]) {
                    if (!deliveredOrderIds.count(o.orderId) && currentLoad + o.weight <= vehicleCapacity) {
                        deliveredOrderIds.insert(o.orderId);
                        currentLoad += o.weight;
                        cr.totalWeight += o.weight;
                        cr.route.push_back(thisCity);
                    }
                }
                ordersByCity[thisCity].erase(remove_if(ordersByCity[thisCity].begin(), ordersByCity[thisCity].end(),
                                                       [&](const Order& o) { return deliveredOrderIds.count(o.orderId); }),
                                             ordersByCity[thisCity].end());
            }

            currentCity = next.order.destination;
        }

        // Return to seller location for next batch
        if (!pq.empty()) {
            vector<int> returnPath = shortestPath(currentCity, sellerLocation.id, adj_matrix);
            for (size_t i = 1; i < returnPath.size(); ++i) {
                int prevCity = returnPath[i - 1];
                int thisCity = returnPath[i];
                cr.totalDistance += adj_matrix[prevCity-1][thisCity-1];
                cr.route.push_back(thisCity);
            }
            currentCity = sellerLocation.id;
        }
    }

    cr.totalDistance+=distBtwCities[cr.route.back()-1][hubId-1];
    cr.route.push_back(hubId);
    return cr;
}

void run_hubspoke_model(vector<Order>& curSellerOrders, vector<Order>& ordersHubSpoke, unordered_map<int,int>& spokeToHub) {
    for (Order& order : ordersHubSpoke) { //assigning old orders to the respective carriers
        processOrder(order, spokeToHub);
    }
    int time=0;
    double cost=0;
    pair<int,double>timeNdCost;
    json hsRoutes = json::array();
    for(Order& order: curSellerOrders)
    {
        timeNdCost=processOrder(order,spokeToHub);
        hsOrders.push_back({  //json output: order delivery time and cost for each order for hub&Spoke model
        {"orderId", order.orderId},
        {"time", timeNdCost.first},
        {"cost", timeNdCost.second}
        });
        time=max(timeNdCost.first,time);
        cost+=timeNdCost.second;
        //route code
        int src = order.source;
        int srcHub = spokeToHub[src];
        int dest = order.destination;
        int destHub = spokeToHub[dest];

        vector<string> pathNames;
        
        // 1. Pickup at Source
        pathNames.push_back(cities[src - 1].name);

        // 2. Move to Source Hub (if different)
        if (src != srcHub) {
            pathNames.push_back(cities[srcHub - 1].name);
        }

        // 3. Move to Destination Hub (if different from Source Hub)
        if (srcHub != destHub) {
            pathNames.push_back(cities[destHub - 1].name);
        }

        // 4. Delivery at Destination (if not at the hub)
        if (dest != destHub) {
            pathNames.push_back(cities[dest - 1].name);
        } else {
            // If destination IS the hub, ensure we didn't double add it
            // Logic: if the last element added isn't the destination name, add it.
            // (Only relevant if srcHub == destHub == dest)
            if (pathNames.back() != cities[dest - 1].name && 
                pathNames.back() != cities[dest - 1].name) {
                pathNames.push_back(cities[dest - 1].name);
            }
        }

        hsRoutes.push_back({
            {"orderId", order.orderId},
            {"path", pathNames}
        });
    }
    conclusion["hubSpoke"] = {
        {"totalTime", time},
        {"totalCost", cost},
        {"orderDetails", hsOrders},
        {"routes", hsRoutes}
    };
  //return {time,cost};

}

int main() {
    cities = {
        {1, "Delhi", 28.6139, 77.2090},
        {2, "Amritsar", 31.6340, 74.8723},
        {3, "Chandigarh", 30.7333, 76.7794},
        {4, "Jaipur", 26.9124, 75.7873},
        {5, "Lucknow", 26.8467, 80.9462},
        {6, "Kanpur", 26.4499, 80.3319},
        {7, "Agra", 27.1767, 78.0081},
        {8, "Varanasi", 25.3176, 82.9739},
        {9, "Meerut", 28.9845, 77.7064},
        {10, "Aligarh", 27.8974, 78.0880},
        {11, "Patna", 25.5941, 85.1376},
        {12, "Ghaziabad", 28.6692, 77.4538},
        {13, "Moradabad", 28.8351, 78.7733},
        {14, "Bareilly", 28.3670, 79.4304},
        {15, "Saharanpur", 29.9667, 77.5500},
        {16, "Haridwar", 29.9457, 78.1642},
        {17, "Roorkee", 29.8543, 77.8880},
        {18, "Rishikesh", 30.0869, 78.2676},
        {19, "Nainital", 29.3919, 79.4542},
        {20, "Mathura", 27.4924, 77.6737},
        {21, "Hoshiarpur", 31.5246, 75.9187},
        {22, "Kullu", 31.9578, 77.1095},
        {23, "Shimla", 31.1048, 77.1734},
        {24, "Kangra", 32.1024, 76.2691},
        {25, "Solan", 30.9045, 77.0967},
        {26, "Srinagar", 34.0837, 74.7973},
        {27, "Jammu", 32.7266, 74.8570},
        {28, "Ludhiana", 30.9010, 75.8573},
        {29, "Patiala", 30.3398, 76.3869},
        {30, "Panipat", 29.3909, 76.9635},
        {31, "Sonipat", 28.9931, 77.0151},
        {32, "Muzaffarnagar", 29.4727, 77.7085},
        {33, "Fatehpur", 25.9264, 80.8130},
        {34, "Karnal", 29.6857, 76.9907},
        {35, "Bhiwani", 28.7840, 76.1319},
        {36, "Hisar", 29.1492, 75.7217},
        {37, "Jind", 29.3139, 76.3131},
        {38, "Kurukshetra", 29.9691, 76.8783},
        {39, "Rohtak", 28.8955, 76.6066},
        {40, "Faridabad", 28.4089, 77.3178},
        {41, "Barnala", 30.3752, 75.5461},
        {42, "Muktsar", 30.4735, 74.5126},
        {43, "Sangrur", 30.2443, 75.8454},
        {44, "Bhatinda", 30.2110, 74.9455},
        {45, "Jalandhar", 31.3260, 75.5762},
        {46, "Ambala", 30.3782, 76.7767},
        {47, "Gurugram", 28.4595, 77.0266},
        {48, "Noida", 28.5355, 77.3910},
        {49, "Farukhabad", 27.3826, 79.5840}
    };

    unordered_map<string,int>cityToId;
    for(int i=1;i<=49;i++)
    {
        cityToId[cities[i-1].name]=i;
    }


    vector<vector<double>> adj_matrix = {
        { 0, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 0, 0, 0, 0, 0, 0, 0, 0, 25, 0, 0, 0, 0, 0, 0, 24, 19, 0 }, // City 1
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 0, 0, 0, 0, 272, 121, 124, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 133, 0, 0, 75, 0, 0, 0, 0 }, // City 2
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 120, 0, 55, 0, 35, 0, 0, 0, 57, 0, 0, 0, 0, 0, 0, 0, 0, 85, 0, 0, 0, 0, 0, 0, 132, 39, 0, 0, 0 }, // City 3
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 197, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 210, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 210, 0, 0 }, // City 4
        { 0, 0, 0, 0, 0, 75, 0, 264, 0, 0, 440, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 103, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 147 }, // City 5
        { 0, 0, 0, 0, 75, 0, 244, 292, 0, 0, 0, 0, 0, 230, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 127 }, // City 6
        { 0, 0, 0, 0, 0, 244, 0, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 152, 0, 0, 0, 0, 0, 0, 0, 0, 157 }, // City 7
        { 0, 0, 0, 0, 264, 292, 0, 0, 0, 0, 219, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 226, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 8
        { 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 42, 105, 0, 0, 115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 88, 58, 0 }, // City 9
        { 0, 0, 0, 0, 0, 0, 80, 0, 0, 0, 0, 105, 123, 141, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 94, 0, 0, 0, 0, 0, 0, 0, 98, 158 }, // City 10
        { 0, 0, 0, 0, 440, 0, 0, 219, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 434, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 11
        { 24, 0, 0, 0, 0, 0, 0, 0, 42, 105, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0, 0, 31, 0, 0, 0, 0, 0, 0, 47, 16, 0 }, // City 12
        { 0, 0, 0, 0, 0, 0, 0, 0, 105, 123, 0, 0, 0, 82, 0, 0, 0, 0, 90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 125, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 13
        { 0, 0, 0, 0, 0, 230, 0, 0, 0, 141, 0, 0, 82, 0, 0, 0, 0, 0, 113, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 303, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 110 }, // City 14
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 59, 34, 70, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 57, 0, 62, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 87, 0, 0, 0 }, // City 15
        { 0, 0, 0, 0, 0, 0, 0, 0, 115, 0, 0, 0, 0, 0, 59, 0, 28, 18, 139, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 68, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 16
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 34, 28, 0, 44, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 0, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 17
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70, 18, 44, 0, 138, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 87, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 18
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90, 113, 0, 139, 0, 138, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 19
        { 0, 0, 0, 197, 0, 0, 48, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 107, 0, 0, 0, 0, 0, 0, 0, 119, 0 }, // City 20
        { 0, 99, 120, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 166, 69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39, 0, 0, 0, 0 }, // City 21
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 95, 80, 117, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 22
        { 0, 0, 55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 95, 0, 0, 23, 0, 0, 0, 113, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 89, 0, 0, 0 }, // City 23
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 72, 80, 0, 0, 0, 259, 149, 139, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 108, 0, 0, 0, 0 }, // City 24
        { 0, 0, 35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 117, 23, 0, 0, 0, 0, 0, 92, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0 }, // City 25
        { 0, 272, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 259, 0, 0, 151, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 26
        { 0, 121, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 166, 0, 0, 149, 0, 151, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 27
        { 0, 124, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 69, 0, 0, 139, 0, 0, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 0, 73, 116, 54, 0, 0, 0, 0 }, // City 28
        { 0, 0, 57, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 113, 0, 92, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 0, 0, 80, 0, 53, 0, 0, 37, 0, 0, 0 }, // City 29
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 72, 0, 32, 0, 0, 63, 64, 65, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 30
        { 46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 0, 0, 0, 77, 89, 0, 76, 0, 41, 71, 0, 0, 0, 0, 0, 0, 59, 62, 0 }, // City 31
        { 0, 0, 0, 0, 0, 0, 0, 0, 54, 0, 0, 0, 125, 0, 57, 68, 45, 87, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 0, 73, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 32
        { 0, 0, 0, 0, 103, 75, 0, 226, 0, 0, 434, 0, 0, 303, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 202 }, // City 33
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 0, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 77, 73, 0, 0, 0, 0, 77, 33, 0, 0, 0, 0, 0, 0, 0, 79, 0, 0, 0 }, // City 34
        { 0, 0, 0, 210, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 89, 0, 0, 0, 0, 56, 61, 0, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 35
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 56, 0, 60, 0, 90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 36
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 76, 0, 0, 77, 61, 60, 0, 0, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 37
        { 0, 0, 85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 64, 0, 0, 0, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 46, 0, 0, 0 }, // City 38
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 41, 0, 0, 0, 47, 90, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 86, 0 }, // City 39
        { 25, 0, 0, 0, 0, 0, 152, 0, 0, 94, 0, 31, 0, 0, 0, 0, 0, 0, 0, 107, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 71, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 15, 0 }, // City 40
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 65, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 32, 60, 105, 0, 0, 0, 0 }, // City 41
        { 0, 133, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, 0, 130, 50, 0, 0, 0, 0, 0 }, // City 42
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 73, 53, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 130, 0, 86, 122, 90, 0, 0, 0 }, // City 43
        { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 50, 86, 0, 137, 0, 0, 0, 0 }, // City 44
        { 0, 75, 132, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 39, 0, 0, 108, 0, 0, 0, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 105, 0, 122, 137, 0, 0, 0, 0, 0 }, // City 45
        { 0, 0, 39, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 87, 0, 0, 0, 0, 0, 0, 0, 89, 0, 66, 0, 0, 0, 37, 0, 0, 0, 0, 79, 0, 0, 0, 46, 0, 0, 0, 0, 90, 0, 0, 0, 0, 0, 0 }, // City 46
        { 24, 0, 0, 210, 0, 0, 0, 0, 88, 0, 0, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 59, 0, 0, 0, 0, 0, 0, 0, 63, 29, 0, 0, 0, 0, 0, 0, 0, 36, 0 }, // City 47
        { 19, 0, 0, 0, 0, 0, 0, 0, 58, 98, 0, 16, 0, 0, 0, 0, 0, 0, 0, 119, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 62, 0, 0, 0, 0, 0, 0, 0, 86, 15, 0, 0, 0, 0, 0, 0, 36, 0, 0 }, // City 48
        { 0, 0, 0, 0, 147, 127, 157, 0, 0, 158, 0, 0, 0, 110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 202, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }, // City 49
    };

    unordered_map<int,int>spokeToHub;
    for (int i = 0; i < clusters.size(); ++i) {
        for (const City& c : clusters[i]) {
            spokeToHub[c.id]=hubs[i].id;
        }
    }

    int cnt1=1,cnt2=1;
    for(int i=1;i<=49;i++)
    {
        for(int j=i+1;j<=50;j++)
        {
            if(spokeToHub[i]!=i)
            {
                locToHSCarrier[{i,spokeToHub[i]}]=*(new HubSpokeCarrier(cnt1++,i));
                break;
            }
            else if(j<=49 && spokeToHub[j]==j)
            {
                locToHHCarrier[{i,j}]=*(new HubHubCarrier(cnt2++,i,j));
            }
        }
    }

    //input ordersHubSpoke, ordersP2P, ordersPersonalised (3 different orders arrays for storing different types of orders depending upon the model opted)
    //input current Orders array & order priority details (map orderPriority : orderId -> priority (1 => highest)), optimisation goal 'cost' or 'time'
    json input;
    cin >> input; // Receive the "Memory" and "Request" from Next.js
    vector<Order> curSellerOrders, ordersHubSpoke, ordersP2P, ordersPersonalised;
    unordered_map<int, int> orderPriority;

    // 1. Load distBtwCities
    distBtwCities = input["distMatrix"].get<vector<vector<double>>>();

    // 2. Load Hubs
    for (auto& h : input["hubs"]) {
        hubs.push_back(City(h["id"], h["name"], h["lat"], h["lon"]));
    }

    // 3. Load Clusters
    // Assuming clusters in JSON is an array of arrays of City objects
    for (auto& clusterJson : input["clusters"]) {
        vector<City> tempCluster;
        for (auto& c : clusterJson) {
            tempCluster.push_back(City(c["id"], c["name"], c["lat"], c["lon"]));
        }
        clusters.push_back(tempCluster);
    }

    // 4. Helper to parse Order arrays
    auto parseOrders = [](const json& jOrders) {
        vector<Order> temp;
        for (auto& o : jOrders) {
            // Mapping JSON to Order(sellerId, source, destination, weight, volume)
            temp.push_back(Order(o["orderId"], o["sellerId"], o["source"], o["destination"], o["weight"], o["volume"]));
        }
        return temp;
    };

    curSellerOrders = parseOrders(input["curSellerOrders"]);
    ordersHubSpoke = parseOrders(input["ordersHubSpoke"]);
    ordersP2P = parseOrders(input["ordersP2P"]);
    ordersPersonalised = parseOrders(input["ordersPersonalised"]);

    // 5. Load Priorities
    for (auto& [idStr, priority] : input["orderPriority"].items()) {
        orderPriority[stoi(idStr)] = priority;
    }

    // 6. Global Config
    string goal = input["goal"]; // "cost" or "time"
    bool prioritize = input["prioritize"];

    // --- NOW THE SIMULATION LOGIC RUNS ---
    // At this point, all vectors and maps are "re-animated"

    /*bool prioritize=false;
    int priority;
    cout<<"need to prioritize orders for delivery? press y if yes, else n: ";
    char chr;
    cin>>chr;
    //input if need to prioritize orders
    if(chr=='Y' || chr=='y')
        prioritize=true;
    unordered_map<int, int>orderPriority; //orderId to priority
        if(prioritize){
            cout << "Enter priority (1 = highest): ";
            cin >>priority;
            orderPriority[order.orderId]=priority;
        }

    //input optimisation goal ('cost' or 'time')*/

    //run HUB SPOKE MODEL
    run_hubspoke_model(curSellerOrders, ordersHubSpoke, spokeToHub);

     //POINT TO POINT MODEL
    // Create depot list
    vector<PPCity> depots;
    for (City hub : hubs) {
        depots.push_back(PPCity(hub.id, 0, 0));
    }

    vector<PPCity> nodes;
    vector<pair<int, int>> pdPairs;
    unordered_map<int, int> orderToVehicleIdx;

    for (Order& order: ordersP2P) {
        int pickupIdx = nodes.size();
        nodes.push_back(PPCity(order.source, 0, order.weight, order.orderId, true));
        int deliveryIdx = nodes.size();
        nodes.push_back(PPCity(order.destination, order.weight, 0, order.orderId, false));
        pdPairs.push_back({pickupIdx, deliveryIdx});
    }

    // Simulated Annealing to find the optimal routes
    int vehiclesPerDepot = 2;
    vector<PPCarrier> bestSolution = SimulatedAnnealingVRP(nodes, pdPairs, depots, vehiclesPerDepot, orderToVehicleIdx);

    // Output the routes (for curSellerOrders or can also show the route for each carrier also)
    /*for (int v = 0; v < bestSolution.size(); ++v) {
        cout << "Vehicle " << v << " (Depot " << bestSolution[v].depotID << "): ";
        for (int i = 0; i < bestSolution[v].route.size(); ++i) {
            cout << nodes[bestSolution[v].route[i]].id;
            if (i < bestSolution[v].route.size() - 1)
                cout << " -> ";
        }
        cout << endl;
    }*/

    PPCost(curSellerOrders,bestSolution,orderToVehicleIdx,nodes);

    //PERSONALIZED CARRIER MODEL
    CarrierRoute ccRoute;
    City hub=cities[spokeToHub[curSellerOrders[0].source]-1];
    if(prioritize)
        ccRoute=PriorityBasedCarrierRoute(curSellerOrders,orderPriority,cities[curSellerOrders[0].source-1],adj_matrix,hub.id,2000);
    else
        ccRoute=PersonalizedCarrierRouting(curSellerOrders,hub.id,cities,cities[curSellerOrders[0].source-1],2000);

    //json output: Personalized Carrier Route
    /*for (int cityIdx : ccRoute.route) {
        City city = cities[cityIdx-1];
        std::cout << "City ID: " << city.id
                  <<" City:"<<city.name<<"  ->  ";}
    */
    vector<string> personalizedPath;
    if (!ccRoute.route.empty()) {
        for (int cityId : ccRoute.route) {
            personalizedPath.push_back(cities[cityId - 1].name);
        }
    }
    double cost = 25*ccRoute.totalDistance + 500;
    int time = ceil(ccRoute.totalDistance/(16.0*50.0));
    /*json output: total cost and time for personalized carrier
    cout<<"cost:"<< cost <<endl; //Rs. 24/km for personalized carrier
    cout<<"time:"<<time<<" days"<<endl;
    pair<int,double> pTimeNdCost = {time,cost};*/
    conclusion["personalized"] = {
        {"time", time},
        {"cost", cost},
        {"route", personalizedPath} // Array of City IDs for SVG mapping
    };
    //give CONCLUSION on site
    cout << conclusion.dump() << endl;
    return 0;
}
