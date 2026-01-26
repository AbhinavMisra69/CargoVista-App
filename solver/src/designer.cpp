#include <iostream>     // cout, cin
#include <vector>       // vector
#include <string>       // string
#include <limits>       // numeric_limits
#include <algorithm>    // min
#include <cmath>        // sin, cos, asin, sqrt, pow
#include <cstdlib>      // rand, srand
#include <ctime>        // time
#include "nlohmann/json.hpp"

using json = nlohmann::json;
using namespace std;

struct City {
    int id;
    string name;
    double lat, lon;

    City() {}

    City(int id, const string& name, double lat, double lon)
        : id(id), name(name), lat(lat), lon(lon) {}
};

vector<vector<double>> floydWarshallFromAdjMatrix(vector<vector<double>> adj_matrix) {
    int n = adj_matrix.size();
    double INF = numeric_limits<double>::max();
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            if (i != j && adj_matrix[i][j] == 0) // or whatever unconnected means in your case
                adj_matrix[i][j] = INF;

    for (int k = 0; k < n; ++k) {
        for (int i = 0; i < n; ++i) {
            for (int j = 0; j < n; ++j) {
                if (adj_matrix[i][k] < numeric_limits<double>::max() &&
                    adj_matrix[k][j] < numeric_limits<double>::max()) {
                    adj_matrix[i][j] = min(adj_matrix[i][j], adj_matrix[i][k] + adj_matrix[k][j]);
                }
            }
        }
    }
    return adj_matrix;
}

// Convert degrees to radians
double toRadians(double degree) {
    return degree * M_PI / 180.0;
}

double haversine(const City& c1, const City& c2) {
    const double R = 6371.0; // Earth's radius in kilometers

    double dLat = toRadians(c2.lat - c1.lat);
    double dLon = toRadians(c2.lon - c1.lon);

    double lat1 = toRadians(c1.lat);
    double lat2 = toRadians(c2.lat);

    double a = pow(sin(dLat / 2), 2) +
               pow(sin(dLon / 2), 2) * cos(lat1) * cos(lat2);

    double c = 2 * asin(sqrt(a));

    return R * c;
}

vector<vector<City>> kMeansClustering(const vector<City>& cities, int k, double& total_wcss) {
    int n = cities.size();
    vector<City> centroids(k);
    vector<vector<City>> clusters(k);
    vector<int> labels(n, -1);

    srand(time(0));

    // Initialize centroids randomly
    for (int i = 0; i < k; ++i)
        centroids[i] = cities[rand() % n];

    bool changed = true;
    int max_iters = 100;

    while (changed && max_iters--) {
        changed = false;

        for (int i = 0; i < k; ++i)
            clusters[i].clear();

        for (int i = 0; i < n; ++i) {
            double min_dist = numeric_limits<double>::max();
            int best_cluster = 0;

            for (int j = 0; j < k; ++j) {
                double dist = haversine(cities[i], centroids[j]);
                if (dist < min_dist) {
                    min_dist = dist;
                    best_cluster = j;
                }
            }

            if (labels[i] != best_cluster) {
                changed = true;
                labels[i] = best_cluster;
            }

            clusters[best_cluster].push_back(cities[i]);
        }

        // Recalculate centroids
        for (int i = 0; i < k; ++i) {
            // Safety check: If a cluster ended up empty, skip it or re-initialize
            if (clusters[i].empty()) continue;

            double sum_lat = 0, sum_lon = 0;

            // 1. Find the mathematical center (Average Lat/Lon)
            for (const City& c : clusters[i]) {
                sum_lat += c.lat;
                sum_lon += c.lon;
            }

            double avg_lat = sum_lat / clusters[i].size();
            double avg_lon = sum_lon / clusters[i].size();

            // Create a temporary "Virtual City" representing the perfect center
            City virtual_center(-1, "Center", avg_lat, avg_lon);

            // 2. Find the existing city closest to this average point (K-Medoid approach)
            double min_dist_to_mean = numeric_limits<double>::max();
            City best_representative = centroids[i]; // Default to current if none found

            for (const City& c : clusters[i]) {
                // Use Haversine to measure distance on the sphere
                double dist = haversine(c, virtual_center);

                if (dist < min_dist_to_mean) {
                    min_dist_to_mean = dist;
                    best_representative = c;
                }
            }

            // Update centroid with the actual city object
            centroids[i] = best_representative;
        }
    }

    // Compute total WCSS
    total_wcss = 0;
    for (int i = 0; i < k; ++i) {
        for (const City& c : clusters[i]) {
            total_wcss += pow(haversine(c, centroids[i]), 2);
        }
    }

    return clusters;
}


City findHubs(vector<City>& clusterCities,vector<vector<double>>& distBtwCities) {
    City bestHub;
    double minTotalDist = 1e9;
    for (const City& city : clusterCities) {
        double totalDist = 0.0;

        for (const City& other : clusterCities) {
            if (city.id != other.id) {
                totalDist += distBtwCities[city.id-1][other.id-1];
            }
        }

        if (totalDist < minTotalDist) {
            minTotalDist = totalDist;
            bestHub = city;
        }

    }
    return bestHub;


}


int main() {

    vector<City> cities = {
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

    // 1. Heavy Math
    vector<vector<double>> distBtwCities=floydWarshallFromAdjMatrix(adj_matrix);

    int k = 10;
    double wcss = 0;
    vector<vector<City>> clusters = kMeansClustering(cities, k, wcss);
    vector<City>hubs;
    for(vector<City>& cluster:clusters)
    {
        hubs.push_back(findHubs(cluster,distBtwCities));
    }

    // 2. Build the JSON Package
    json output;
    output["distMatrix"] = distBtwCities;
    output["hubs"] = json::array();
    for(auto& h : hubs) {
        output["hubs"].push_back({{"id", h.id}, {"name", h.name}, {"lat", h.lat}, {"lon", h.lon}});
    }
    
    output["clusters"] = json::array();
    for(auto& cluster : clusters) {
        json cArr = json::array();
        for(auto& city : cluster) {
            // Push the full City object instead of just the ID
            cArr.push_back({
                {"id", city.id},
                {"name", city.name},
                {"lat", city.lat},
                {"lon", city.lon}
            });
        }
        output["clusters"].push_back(cArr);
    }

    // 3. Send to stdout
    cout << output.dump() << endl;
    return 0;
}
