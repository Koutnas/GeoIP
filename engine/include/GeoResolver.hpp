#pragma once
#include <string>
#include <maxminddb.h>
#include <optional>

struct GeoLocation {
    double latitude;
    double longitude;
    std::string city_name;
};

class GeoResolver {
private:
    MMDB_s mmdb;
    bool is_open = false;

public:
    GeoResolver(const std::string& db_path);
    ~GeoResolver();
    std::optional<GeoLocation> resolve(const std::string& ip);
};