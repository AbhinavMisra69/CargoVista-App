#include <iostream>
#include <vector>
#include <string>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <list>
#include <queue>
#include <algorithm>
#include <cmath>
#include <limits>
#include <cstdlib>
#include <ctime>
#include <functional>
#include "nlohmann/json.hpp"

using json = nlohmann::json;
using namespace std;

const int d = 12; //cost in Rs. pr km (d => distance)
const int v = 1; //cost in Rs. pr m^3 (v => volume)
const int w = 1; //cost in Rs. pr kg (w => weight)

struct City {
    int id;
    string name;
    double lat, lon;
    City() : id(0), name(""), lat(0), lon(0) {}
    City(int id, const string& name, double lat, double lon)
        : id(id), name(name), lat(lat), lon(lon) {}
};

//Global Data Structures
vector<City> cities; 
vector<vector<double>> distBtwCities;
vector<vector<City>> clusters;
vector<City> hubs;
json conclusion;

//Helper to store per-order results for comparison
struct ModelResult {
    long long orderId;
    int time;
    double cost;
    string modelName; 
    json routeInfo;   
};

//Global Result Maps
unordered_map<long long, ModelResult> hsResults;
unordered_map<long long, ModelResult> p2pResults;

class Order {
public:
    long long orderId; 
    int sellerId;
    int source;
    int destination;
    double weight;
    double volume;

    Order() : orderId(0), sellerId(0), source(0), destination(0), weight(0), volume(0) {}
    Order(long long oId, int sId, int src, int des, double w, double v)
        : orderId(oId), sellerId(sId), source(src), destination(des), weight(w), volume(v) {}
};

// Hashing for Pairs
struct pair_hash {
    template <class T1, class T2>
    std::size_t operator()(const std::pair<T1, T2>& p) const {
        auto h1 = std::hash<T1>{}(p.first);
        auto h2 = std::hash<T2>{}(p.second);
        return h1 ^ (h2 << 1); 
    }
};

class HubHubCarrier {
public:
    int carrierId;
    int fromHubId;
    int toHubId;
    double maxWeight, maxVolume, remainingWeight, remainingVolume, speed;
    double pendingWeight = 0, pendingVolume = 0;
    list<Order> pendingOrders;
    vector<Order> assignedOrders;

    HubHubCarrier(){}
    HubHubCarrier(int id, int fromHub, int toHub, double capWeight = 12000.0, double capVolume = 50.0, double spd = 60.0)
        : carrierId(id), fromHubId(fromHub), toHubId(toHub),
          maxWeight(capWeight), maxVolume(capVolume),
          remainingWeight(capWeight), remainingVolume(capVolume), speed(spd) {}

    bool canCarry(const Order& o) const {
        return o.weight <= remainingWeight && o.volume <= remainingVolume;
    }
    void assignOrder(const Order& o) {
        assignedOrders.push_back(o);
        remainingWeight -= o.weight;
        remainingVolume -= o.volume;
    }
    void assignPendingOrder(const Order& o) {
        pendingOrders.push_back(o);
        pendingWeight += o.weight;
        pendingVolume += o.volume;
    }
};

unordered_map<pair<int,int>, HubHubCarrier, pair_hash> locToHHCarrier;

pair<int,double> assignOrderHubHub(int src, int dest, const Order& order) {
    if (src < 1 || dest < 1 || src > distBtwCities.size() || dest > distBtwCities.size()) return {0, 0};
    
    double dist = distBtwCities[src-1][dest-1];
    double cost = d * dist + w * order.weight + v * order.volume;
    int time = 0;
    
    HubHubCarrier carrier;
    if (locToHHCarrier.count({src,dest})) carrier = locToHHCarrier[{src,dest}];
    else carrier = locToHHCarrier[{dest,src}];

    if (carrier.canCarry(order)) {
        carrier.assignOrder(order);
        time++;
    } else {
        carrier.assignPendingOrder(order);
        time += (int)ceil(max((double)carrier.pendingWeight/carrier.maxWeight, (double)carrier.pendingVolume/carrier.maxVolume));
    }
    return {time, cost};
}

class HubSpokeCarrier {
public:
    int carrierId;
    double maxWeight, maxVolume, speed;
    int hubLocationId;
    double remainingWeight, remainingVolume;
    double pendingWeight = 0, pendingVolume = 0;
    vector<Order> assignedOrders;
    list<Order> pendingOrders;

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
        pendingWeight += o.weight;
        pendingVolume += o.volume;
    }
};

unordered_map<pair<int,int>, HubSpokeCarrier, pair_hash> locToHSCarrier;

pair<int,double> assignOrderSpokeHub(int spoke, const Order& order, unordered_map<int,int>& spokeToHub) {
    if (spokeToHub.find(spoke) == spokeToHub.end()) return {0, 0}; 
    int hub = spokeToHub[spoke];
    
    double dist = distBtwCities[spoke-1][hub-1];
    double cost = d * dist + w * order.weight + v * order.volume;
    int time = 0;

    HubSpokeCarrier carrier = locToHSCarrier[{spoke,hub}];
    
    if (carrier.canCarry(order)) {
        carrier.assignOrder(order);
        time++;
    } else {
        carrier.assignPendingOrder(order);
        time += (int)ceil(max((double)carrier.pendingWeight/carrier.maxWeight, (double)carrier.pendingVolume/carrier.maxVolume));
    }
    return {time, cost};
}

pair<int,double> processOrder(Order& order, unordered_map<int,int>& spokeToHub) {
    if (spokeToHub.find(order.source) == spokeToHub.end() || spokeToHub.find(order.destination) == spokeToHub.end()) {
        return {0, 0};
    }
    int srcHub = spokeToHub[order.source];
    int destHub = spokeToHub[order.destination];
    int time = 0;
    double cost = 0;
    pair<int,int> timeNdCost;

    if (order.source != srcHub) {
        timeNdCost = assignOrderSpokeHub(order.source, order, spokeToHub);
        time += timeNdCost.first;
        cost += timeNdCost.second;
    }
    if (destHub != srcHub) {
        timeNdCost = assignOrderHubHub(srcHub, destHub, order);
        time += timeNdCost.first;
        cost += timeNdCost.second;
    }
    if (order.destination != destHub) {
        timeNdCost = assignOrderSpokeHub(order.destination, order, spokeToHub);
        time += timeNdCost.first;
        cost += timeNdCost.second;
    }
    return {time, cost};
}

// --- P2P Structs ---
struct PPCity {
    int id;
    double demand;
    double supply;
    long long orderId = -1;
    bool isPickup = false;
    PPCity() {}
    PPCity(int i, double d, double s = 0, long long oid = -1, bool pickup = false) 
        : id(i), demand(d), supply(s), orderId(oid), isPickup(pickup) {}
};

struct PPCarrier {
    static int n;
    int id;
    double capacity = 6000;
    double load = 0;
    int depotID;
    vector<int> route; 
    PPCarrier() { id = n++; }
};
int PPCarrier::n = 0;

double RouteCost(vector<int>& route, vector<PPCity>& nodes, PPCity& depot) {
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

vector<PPCarrier> CreateInitialSolution(vector<PPCity>& nodes, vector<pair<int, int>>& pdPairs, vector<PPCity>& depots, int vehiclesPerDepot, unordered_map<long long, int>& orderToVehicleIdx) {
    unordered_map<int, PPCity> depotMap;
    for (auto& d : depots) depotMap[d.id] = d;

    vector<PPCarrier> vehicles;
    unordered_map<int, vector<int>> depotToVehicleIndices;

    for (auto& depot : depots) {
        for (int i = 0; i < vehiclesPerDepot; ++i) {
            PPCarrier v; v.capacity = 5000; v.load = 0; v.depotID = depot.id;
            vehicles.push_back(v);
            depotToVehicleIndices[depot.id].push_back(vehicles.size() - 1);
        }
    }

    vector<pair<double, int>> depotDistances;
    unordered_set<long long> assignedOrders;

    for (auto& pair : pdPairs) {
        int pid = pair.first;
        int did = pair.second;
        long long orderId = nodes[pid].orderId;
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

bool IsValidRoute(vector<int>& route, vector<PPCity>& nodes, double capacity) {
    unordered_map<long long, bool> pickedUp;
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

void SwapOrders(vector<PPCarrier>& vehicles, vector<pair<int, int>>& pdPairs, vector<PPCity>& nodes, unordered_map<long long, int>& tempOrderToVehicleIdx) {
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
        long long o1 = nodes[pid1].orderId;
        long long o2 = nodes[pid2].orderId;

        auto& r1 = vehicles[v1].route;
        auto& r2 = vehicles[v2].route;

        bool r1_has_pair1 = find(r1.begin(), r1.end(), pid1) != r1.end() && find(r1.begin(), r1.end(), did1) != r1.end();
        bool r2_has_pair2 = find(r2.begin(), r2.end(), pid2) != r2.end() && find(r2.begin(), r2.end(), did2) != r2.end();
        if (!r1_has_pair1 || !r2_has_pair2) continue;

        r1.erase(remove(r1.begin(), r1.end(), pid1), r1.end());
        r1.erase(remove(r1.begin(), r1.end(), did1), r1.end());
        r2.erase(remove(r2.begin(), r2.end(), pid2), r2.end());
        r2.erase(remove(r2.begin(), r2.end(), did2), r2.end());

        r1.push_back(pid2); r1.push_back(did2); tempOrderToVehicleIdx[o2] = v1;
        r2.push_back(pid1); r2.push_back(did1); tempOrderToVehicleIdx[o1] = v2;
    }
}

vector<PPCarrier> SimulatedAnnealingVRP(vector<PPCity>& nodes, vector<pair<int, int>>& pdPairs, vector<PPCity> depots, int vehiclesPerDepot, unordered_map<long long, int>& orderToVehicleIdx) {
    unordered_map<int, PPCity> depotMap;
    for (auto& d : depots) depotMap[d.id] = d;

    vector<PPCarrier> current = CreateInitialSolution(nodes, pdPairs, depots, vehiclesPerDepot, orderToVehicleIdx);
    vector<PPCarrier> best = current;
    double bestCost = TotalCost(best, nodes, depotMap);

    double temp = 1000.0;
    double cooling = 0.995;
    int maxIter = 10000;
    srand(time(0));
    unordered_map<long long, int> currentOrderMap = orderToVehicleIdx;

    for (int iter = 0; iter < maxIter; ++iter) {
        vector<PPCarrier> neighbor = current;
        unordered_map<long long, int> tempOrderMap = currentOrderMap;
        SwapOrders(neighbor, pdPairs, nodes, tempOrderMap);

        bool valid = true;
        for (auto& v : neighbor) {
            if (!IsValidRoute(v.route, nodes, v.capacity)) { valid = false; break; }
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

void PPCost(vector<Order>& curSellerOrders, vector<PPCarrier>& bestSolution, unordered_map<long long, int>& orderToVehicleIdx, vector<PPCity>& nodes) {
    double totalCost = 0;
    int maxTime = 0;
    json ppOrders = json::array();
    json ppRoutes = json::array();
    unordered_set<int> visitedVehicles;

    for (const Order& order : curSellerOrders) {
        long long orderId = order.orderId;
        if (orderToVehicleIdx.find(orderId) == orderToVehicleIdx.end()) continue;

        int vIdx = orderToVehicleIdx[orderId];
        const PPCarrier& carr = bestSolution[vIdx];
        const vector<int>& route = carr.route;

        int srcPos = -1, destPos = -1;
        for (int i = 0; i < route.size(); ++i) {
            if (nodes[route[i]].id == order.source && srcPos == -1) srcPos = i;
            if (nodes[route[i]].id == order.destination && srcPos != -1) { destPos = i; break; }
        }
        if (srcPos == -1 || destPos == -1) continue;

        double dist = 0.0;
        for (int i = srcPos; i < destPos; ++i)
            dist += distBtwCities[nodes[route[i]].id - 1][nodes[route[i + 1]].id - 1];

        double cost = dist * 18 + order.weight * 1.9;
        int timeDays = (int)ceil(dist / (40.0 * 16));

        totalCost += cost;
        maxTime = max(maxTime, timeDays);

        ppOrders.push_back({ {"orderId", order.orderId}, {"time", timeDays}, {"cost", cost} });

        vector<string> routeNames;
        if(carr.depotID > 0 && carr.depotID <= cities.size())
             routeNames.push_back(cities[carr.depotID - 1].name);
        for (int nodeId : carr.route) {
            int cityId = nodes[nodeId].id;
            if(cityId > 0 && cityId <= cities.size())
                routeNames.push_back(cities[cityId - 1].name);
        }
        if(carr.depotID > 0 && carr.depotID <= cities.size())
            routeNames.push_back(cities[carr.depotID - 1].name);
        
        json routeJson = { {"vehicleId", carr.id}, {"route", routeNames} };
        ppRoutes.push_back(routeJson);

        p2pResults[orderId] = { orderId, timeDays, cost, "PointToPoint", routeJson };

        if (visitedVehicles.find(vIdx) == visitedVehicles.end()) {
            visitedVehicles.insert(vIdx);
        }
    }
    conclusion["pointToPoint"] = { {"totalTime", maxTime}, {"totalCost", totalCost}, {"orderDetails", ppOrders}, {"routes", ppRoutes} };
}

void run_hubspoke_model(vector<Order>& curSellerOrders, vector<Order>& ordersHubSpoke, unordered_map<int,int>& spokeToHub) {
    for (Order& order : ordersHubSpoke) processOrder(order, spokeToHub);

    int time = 0; 
    double cost = 0; 
    pair<int,double> timeNdCost;
    json hsRoutes = json::array();
    json hsOrdersJson = json::array();

    if (spokeToHub.empty()) {
        cerr << "Warning: spokeToHub map is empty! All routes will skip hubs." << endl;
    }

    for(Order& order: curSellerOrders) {
        timeNdCost = processOrder(order, spokeToHub);
        
        int orderTime = timeNdCost.first;
        double orderCost = timeNdCost.second;

        hsOrdersJson.push_back({ 
            {"orderId", order.orderId}, 
            {"time", orderTime}, 
            {"cost", orderCost} 
        });
        
        time = max(orderTime, time); 
        cost += orderCost;
        
        int src = order.source;
        int dest = order.destination;
        int srcHub = spokeToHub.count(src) ? spokeToHub[src] : 0;
        int destHub = spokeToHub.count(dest) ? spokeToHub[dest] : 0;

        vector<int> pathIDs;
        if (src > 0) pathIDs.push_back(src);
        if (srcHub > 0 && srcHub != src) pathIDs.push_back(srcHub);
        if (destHub > 0 && destHub != srcHub) pathIDs.push_back(destHub);
        if (dest > 0 && dest != destHub) {
            pathIDs.push_back(dest);
        } else if (pathIDs.empty() || pathIDs.back() != dest) {
            if (dest > 0) pathIDs.push_back(dest);
        }

        vector<string> pathNames;
        for (int id : pathIDs) {
            if (id > 0 && id <= cities.size()) {
                string name = cities[id - 1].name;
                pathNames.push_back(name);
            }
        }
        
        json routeJson = { {"path", pathNames} };
        hsRoutes.push_back({ {"orderId", order.orderId}, {"path", pathNames} });

        hsResults[order.orderId] = { order.orderId, orderTime, orderCost, "HubSpoke", routeJson };
    }

    conclusion["hubSpoke"] = { 
        {"totalTime", time}, 
        {"totalCost", cost}, 
        {"orderDetails", hsOrdersJson}, 
        {"routes", hsRoutes} 
    };
}

void generateHybridModels(vector<Order>& curSellerOrders) {
    json timeEffOrders = json::array();
    json timeEffRoutes = json::array();
    double timeEffTotalCost = 0;
    int timeEffMaxTime = 0;

    json costEffOrders = json::array();
    json costEffRoutes = json::array();
    double costEffTotalCost = 0;
    int costEffMaxTime = 0;

    for (const auto& order : curSellerOrders) {
        long long id = order.orderId;

        ModelResult hs = hsResults.count(id) ? hsResults[id] : ModelResult{id, 99999, 99999.0, "HubSpoke", {}};
        ModelResult p2p = p2pResults.count(id) ? p2pResults[id] : ModelResult{id, 99999, 99999.0, "PointToPoint", {}};

        // Time Comparison
        ModelResult* bestTime = (p2p.time < hs.time) ? &p2p : &hs;
        timeEffOrders.push_back({
            {"orderId", id},
            {"model", bestTime->modelName},
            {"time", bestTime->time},
            {"cost", bestTime->cost}
        });
        timeEffRoutes.push_back({
            {"orderId", id},
            {"model", bestTime->modelName},
            {"route", bestTime->routeInfo}
        });
        timeEffTotalCost += bestTime->cost;
        timeEffMaxTime = max(timeEffMaxTime, bestTime->time);

        // Cost Comparison
        ModelResult* bestCost = (p2p.cost < hs.cost) ? &p2p : &hs;
        costEffOrders.push_back({
            {"orderId", id},
            {"model", bestCost->modelName},
            {"time", bestCost->time},
            {"cost", bestCost->cost}
        });
        costEffRoutes.push_back({
            {"orderId", id},
            {"model", bestCost->modelName},
            {"route", bestCost->routeInfo}
        });
        costEffTotalCost += bestCost->cost;
        costEffMaxTime = max(costEffMaxTime, bestCost->time);
    }

    conclusion["timeEfficient"] = {
        {"totalTime", timeEffMaxTime},
        {"totalCost", timeEffTotalCost},
        {"orderDetails", timeEffOrders},
        {"routes", timeEffRoutes}
    };

    conclusion["costEfficient"] = {
        {"totalTime", costEffMaxTime},
        {"totalCost", costEffTotalCost},
        {"orderDetails", costEffOrders},
        {"routes", costEffRoutes}
    };
}

struct CarrierRoute {
    vector<int> route;
    double totalDistance;
    double totalWeight; 
    int hubId; // Used for single-hub return
};

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
                if (alt < dist[v]) { dist[v] = alt; prev[v] = u; pq.push({alt, v}); }
            }
        }
    }
    vector<int> path;
    for (int at = dest; at != -1; at = prev[at]) path.push_back(at);
    reverse(path.begin(), path.end());
    return path;
}

struct PriorityNode {
    int priority;   
    int cityId;     
    long long orderId;
    bool isPickup;  

    bool operator>(const PriorityNode& other) const {
        if (priority != other.priority) return priority > other.priority;
        return orderId > other.orderId; 
    }
};

CarrierRoute PriorityBasedCarrierRoute(vector<Order>& orders, unordered_map<long long, int>& orderPriority, City& initialLocation, vector<vector<double>>& adj_matrix, int hubId, double vehicleCapacity) {
    CarrierRoute cr;
    cr.hubId = hubId; cr.totalDistance = 0; cr.totalWeight = 0;
    
    priority_queue<PriorityNode, vector<PriorityNode>, greater<PriorityNode>> pickups;
    priority_queue<PriorityNode, vector<PriorityNode>, greater<PriorityNode>> activeTargets;
    unordered_map<long long, Order> orderMap;
    unordered_map<int, vector<long long>> sourceToOrderIds;
    unordered_map<int, vector<long long>> destToOrderIds;
    unordered_set<long long> onboardOrders;
    unordered_set<long long> deliveredOrders;

    for (const auto& o : orders) {
        int pri = orderPriority.count(o.orderId) ? orderPriority.at(o.orderId) : 3;
        pickups.push({pri, o.source, o.orderId, true});
        orderMap[o.orderId] = o;
        sourceToOrderIds[o.source].push_back(o.orderId);
        destToOrderIds[o.destination].push_back(o.orderId);
    }

    //START AT HUB
    int currentCity = hubId; 
    double currentLoad = 0;
    cr.route.push_back(hubId); // Start recording path at Hub

    // Initial Move: Hub -> First Pickup Location (initialLocation)
    // Note: initialLocation is the source of the highest priority order passed by caller
    if (initialLocation.id != hubId) {
        // Calculate path from Hub to First Pickup
        vector<int> pathToFirst = shortestPath(hubId, initialLocation.id, adj_matrix);
        for(size_t i=1; i<pathToFirst.size(); ++i) {
            cr.totalDistance += adj_matrix[currentCity-1][pathToFirst[i]-1];
            cr.route.push_back(pathToFirst[i]);
            currentCity = pathToFirst[i];
        }
    }

    int safetyCounter = 0;
    int maxSteps = orders.size() * 100 + 1000;

    while ((!pickups.empty() || !activeTargets.empty()) && safetyCounter++ < maxSteps) {
        
        //Process Tasks at CURRENT LOCATION
        bool taskDone = true;
        while(taskDone) {
            taskDone = false;
            // A. Deliveries
            if (destToOrderIds.count(currentCity)) {
                for (long long oid : destToOrderIds[currentCity]) {
                    if (onboardOrders.count(oid)) {
                        Order& o = orderMap[oid];
                        currentLoad -= o.weight;
                        onboardOrders.erase(oid);
                        deliveredOrders.insert(oid);
                        taskDone = true; 
                    }
                }
            }
            // B. Pickups
            if (sourceToOrderIds.count(currentCity)) {
                for (long long oid : sourceToOrderIds[currentCity]) {
                    if (onboardOrders.find(oid) == onboardOrders.end() && deliveredOrders.find(oid) == deliveredOrders.end()) {
                        Order& o = orderMap[oid];
                        if (currentLoad + o.weight <= vehicleCapacity) {
                            currentLoad += o.weight;
                            onboardOrders.insert(oid);
                            int pri = orderPriority.count(oid) ? orderPriority.at(oid) : 3;
                            activeTargets.push({pri, o.destination, oid, false});
                            taskDone = true;
                        }
                    }
                }
            }
        }
        
        while (!activeTargets.empty() && deliveredOrders.count(activeTargets.top().orderId)) activeTargets.pop();
        while (!pickups.empty() && (onboardOrders.count(pickups.top().orderId) || deliveredOrders.count(pickups.top().orderId))) pickups.pop();

        if (activeTargets.empty() && pickups.empty()) break;

        //Choose Next Target
        int targetCity = -1;
        if (activeTargets.empty()) {
            if (!pickups.empty()) targetCity = pickups.top().cityId;
        } else {
            targetCity = activeTargets.top().cityId;
        }
        
        if (targetCity == -1 || targetCity == currentCity) continue; 

        //Move towards target
        vector<int> path = shortestPath(currentCity, targetCity, adj_matrix);
        
        if (path.size() > 1) {
            for (size_t i = 1; i < path.size(); ++i) {
                int nextStepCity = path[i];
                double stepDist = adj_matrix[currentCity-1][nextStepCity-1];
                cr.totalDistance += stepDist;
                cr.route.push_back(nextStepCity);
                currentCity = nextStepCity;

                bool opportunityFound = false;
                if (sourceToOrderIds.count(currentCity)) {
                    for(long long oid : sourceToOrderIds[currentCity]) {
                        if (onboardOrders.find(oid) == onboardOrders.end() && deliveredOrders.find(oid) == deliveredOrders.end()) {
                            opportunityFound = true; break;
                        }
                    }
                }
                if (destToOrderIds.count(currentCity)) {
                    for(long long oid : destToOrderIds[currentCity]) {
                        if (onboardOrders.count(oid)) {
                            opportunityFound = true; break;
                        }
                    }
                }
                if (opportunityFound) break; 
            }
        }
    }
    
    //Return to Hub
    if (currentCity != hubId) {
        vector<int> pathToHub = shortestPath(currentCity, hubId, adj_matrix);
        for(size_t i=1; i<pathToHub.size(); ++i) {
            cr.totalDistance += adj_matrix[currentCity-1][pathToHub[i]-1];
            cr.route.push_back(pathToHub[i]);
            currentCity = pathToHub[i];
        }
    }
    return cr;
}

CarrierRoute MultiSourcePDP(vector<Order>& orders, double capacity, unordered_map<int,int>& spokeToHub) {
    int n = orders.size();
    if (n == 0) return {{}, 0, 0, 0};

    CarrierRoute bestRoute;
    bestRoute.totalDistance = 1e18; // Infinity

    unordered_set<int> visitedStartCities;

    for (int startOrderIdx = 0; startOrderIdx < n; startOrderIdx++) {
        
        int startCity = orders[startOrderIdx].source;
        if (visitedStartCities.count(startCity)) continue;
        visitedStartCities.insert(startCity);

        
        int currentHubId = spokeToHub.count(startCity) ? spokeToHub[startCity] : 0;
        if (currentHubId == 0) continue; // Skip invalid hubs

       
        int currentCity = currentHubId;
        double currentLoad = 0;
        double currentDist = 0;
        vector<int> path;
        path.push_back(currentCity); // Route starts at Hub

        // Move Hub -> StartCity
        if (currentCity != startCity) {
            currentDist += distBtwCities[currentCity-1][startCity-1];
            currentCity = startCity;
            path.push_back(currentCity);
        }
        
        vector<bool> pickedUp(n, false);
        vector<bool> delivered(n, false);
        int deliveredCount = 0;

        while (deliveredCount < n) {
            // Process tasks at current location
            bool taskDoneAtLocation = true;
            while(taskDoneAtLocation) {
                taskDoneAtLocation = false;
                for(int i=0; i<n; i++) {
                    if(pickedUp[i] && !delivered[i] && orders[i].destination == currentCity) {
                        delivered[i] = true; currentLoad -= orders[i].weight; deliveredCount++; taskDoneAtLocation = true;
                    }
                }
                for(int i=0; i<n; i++) {
                    if(!pickedUp[i] && orders[i].source == currentCity) {
                        if (currentLoad + orders[i].weight <= capacity) {
                            pickedUp[i] = true; currentLoad += orders[i].weight; taskDoneAtLocation = true;
                        }
                    }
                }
            }

            if (path.empty() || path.back() != currentCity) path.push_back(currentCity);
            if (deliveredCount == n) break;

            // Find Nearest Neighbor
            int bestNextOrderIdx = -1; bool nextIsPickup = false; double minDist = 1e18;
            for (int i = 0; i < n; i++) {
                if (!pickedUp[i]) {
                    if (currentLoad + orders[i].weight <= capacity) {
                        double d = distBtwCities[currentCity-1][orders[i].source-1];
                        if (d < minDist) { minDist = d; bestNextOrderIdx = i; nextIsPickup = true; }
                    }
                }
            }
            for (int i = 0; i < n; i++) {
                if (pickedUp[i] && !delivered[i]) {
                    double d = distBtwCities[currentCity-1][orders[i].destination-1];
                    if (d < minDist) { minDist = d; bestNextOrderIdx = i; nextIsPickup = false; }
                }
            }

            if (bestNextOrderIdx != -1) {
                int nextCity = nextIsPickup ? orders[bestNextOrderIdx].source : orders[bestNextOrderIdx].destination;
                currentDist += minDist; currentCity = nextCity;
            } else { currentDist = 1e18; break; }
        }

        // RETURN TO HUB
        if (currentDist < 1e17) { // Only if valid route found
            if (currentCity != currentHubId) {
                currentDist += distBtwCities[currentCity-1][currentHubId-1];
                path.push_back(currentHubId);
            }
        }

        // COMPARE WITH BEST
        if (currentDist < bestRoute.totalDistance) {
            bestRoute.totalDistance = currentDist;
            bestRoute.route = path;
            bestRoute.totalWeight = 0; 
            bestRoute.hubId = currentHubId;
        }
    }
    return bestRoute;
}

int main() {
    // 1. LOAD INPUT
    json input;
    cin >> input; 

    // 2. PARSE MATRIX
    distBtwCities = input["distMatrix"].get<vector<vector<double>>>();
    
    // 3. HARDCODE 49 CITIES
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

    // 4. PARSE HUBS & CLUSTERS
    for (auto& h : input["hubs"]) {
        int id = h["id"];
        if(id > 0 && id <= 49) hubs.push_back(cities[id-1]);
    }
    
    for (auto& clusterJson : input["clusters"]) {
        vector<City> tempCluster;
        for (auto& c : clusterJson) {
            int id = c["id"];
            if(id > 0 && id <= 49) tempCluster.push_back(cities[id-1]);
        }
        clusters.push_back(tempCluster);
    }

    // 5. Build SpokeToHub Map
    unordered_map<int,int> spokeToHub;
    for (int i = 0; i < clusters.size(); ++i) {
        int hubId = (i < hubs.size()) ? hubs[i].id : -1;
        if (hubId != -1) {
            for (const City& c : clusters[i]) spokeToHub[c.id] = hubId;
        }
    }

    // 6. Initialize Carriers
    int maxCityId = 49;
    int cnt1=1, cnt2=1;
    for(int i=1; i<=maxCityId; i++) {
        for(int j=i+1; j<=maxCityId; j++) {
            if(spokeToHub.find(i) == spokeToHub.end()) continue;
            
            if(spokeToHub[i]!=i) {
                locToHSCarrier[{i,spokeToHub[i]}]=*(new HubSpokeCarrier(cnt1++,i));
                break;
            } else if(spokeToHub.count(j) && spokeToHub[j]==j) {
                locToHHCarrier[{i,j}]=*(new HubHubCarrier(cnt2++,i,j));
            }
        }
    }

    // 7. PARSE ORDERS
    auto parseOrders = [](const json& jOrders) {
        vector<Order> temp;
        for (auto& o : jOrders) temp.push_back(Order(o["orderId"].get<long long>(), o["sellerId"], o["source"], o["destination"], o["weight"], o["volume"]));
        return temp;
    };
    vector<Order> curSellerOrders = parseOrders(input["curSellerOrders"]);
    vector<Order> ordersHubSpoke = parseOrders(input["ordersHubSpoke"]);
    vector<Order> ordersP2P = parseOrders(input["ordersP2P"]);
    
    unordered_map<long long, int> orderPriority;
    if (input.contains("orderPriority")) {
        for (auto& [idStr, priority] : input["orderPriority"].items()) {
            orderPriority[stoll(idStr)] = priority;
        }
    }

    bool prioritize = input["prioritize"];

    // 8. EXECUTE MODELS
    run_hubspoke_model(curSellerOrders, ordersHubSpoke, spokeToHub);

    //P2P
    vector<PPCity> depots;
    for (City hub : hubs) depots.push_back(PPCity(hub.id, 0, 0));
    vector<PPCity> nodes;
    vector<pair<int, int>> pdPairs;
    unordered_map<long long, int> orderToVehicleIdx;

    vector<Order> allP2POrders = ordersP2P;
    allP2POrders.insert(allP2POrders.end(), curSellerOrders.begin(), curSellerOrders.end());

    for (Order& order: allP2POrders) {
        int pickupIdx = nodes.size();
        nodes.push_back(PPCity(order.source, 0, order.weight, order.orderId, true));
        int deliveryIdx = nodes.size();
        nodes.push_back(PPCity(order.destination, order.weight, 0, order.orderId, false));
        pdPairs.push_back({pickupIdx, deliveryIdx});
    }
    
    vector<PPCarrier> bestSolution = SimulatedAnnealingVRP(nodes, pdPairs, depots, 2, orderToVehicleIdx);
    PPCost(curSellerOrders, bestSolution, orderToVehicleIdx, nodes);

    // 9. HYBRID MODELS
    generateHybridModels(curSellerOrders);

    // 10. PERSONALIZED
    if (!curSellerOrders.empty()) {
        CarrierRoute ccRoute;
        
        int srcId = curSellerOrders[0].source;
        if (prioritize) {
            int highestPriorityVal = 999999; 
            for (const auto& o : curSellerOrders) {
                int p = orderPriority.count(o.orderId) ? orderPriority.at(o.orderId) : 3;
                if (p < highestPriorityVal) {
                    highestPriorityVal = p;
                    srcId = o.source;
                }
            }
        }

        int hubId = spokeToHub.count(srcId) ? spokeToHub[srcId] : 0;
        
        if (srcId > 0 && srcId <= cities.size() && hubId > 0 && hubId <= cities.size()) {
             City hub = cities[hubId-1];
             
             if(prioritize) {
                 ccRoute = PriorityBasedCarrierRoute(curSellerOrders, orderPriority, cities[srcId - 1], distBtwCities, hub.id, 2000);
             } else {
                 ccRoute = MultiSourcePDP(curSellerOrders, 2000, spokeToHub);
             }

             double batchCost = 25 * ccRoute.totalDistance + 500;
             int batchTime = ceil(ccRoute.totalDistance / (16.0 * 50.0));
             
             vector<string> personalizedPath;
             if (!ccRoute.route.empty()) {
                 for (int cityId : ccRoute.route) {
                     if(cityId > 0 && cityId <= cities.size())
                         personalizedPath.push_back(cities[cityId - 1].name);
                 }
             }

             json persOrdersDetails = json::array();
             for(const auto& order : curSellerOrders) {
                 persOrdersDetails.push_back({
                    {"orderId", order.orderId},
                    {"time", batchTime}, 
                    {"cost", batchCost} 
                 });
             }

             conclusion["personalized"] = { 
                 {"totalTime", batchTime}, 
                 {"totalCost", batchCost}, 
                 {"orderDetails", persOrdersDetails}, 
                 {"routes", { { {"route", personalizedPath} } } } 
             };
        }
    } else {
         conclusion["personalized"] = { 
             {"totalTime", 0}, 
             {"totalCost", 0}, 
             {"orderDetails", json::array()}, 
             {"routes", json::array()} 
         };
    }

    cout << conclusion.dump() << endl;
    return 0;
}
