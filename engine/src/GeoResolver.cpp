#include "GeoResolver.hpp"
#include <stdexcept>

GeoResolver::GeoResolver(const std::string& db_path) {
    int status = MMDB_open(db_path.c_str(), MMDB_MODE_MMAP, &mmdb);
    if (status != MMDB_SUCCESS) {
        throw std::runtime_error(std::string("DB Error: ") + MMDB_strerror(status));
    }
    is_open = true;
}

GeoResolver::~GeoResolver() {
    if (is_open) MMDB_close(&mmdb);
}

std::optional<GeoLocation> GeoResolver::resolve(const std::string& ip) {
    int gai_error, mmdb_error;
    MMDB_lookup_result_s result = MMDB_lookup_string(&mmdb, ip.c_str(), &gai_error, &mmdb_error);

    if (gai_error == 0 && mmdb_error == MMDB_SUCCESS && result.found_entry) {
        MMDB_entry_data_s lat_data, lon_data, city_data;
        MMDB_get_value(&result.entry, &lat_data, "location", "latitude", NULL);
        MMDB_get_value(&result.entry, &lon_data, "location", "longitude", NULL);
        MMDB_get_value(&result.entry, &city_data, "city", "names", "en", NULL);

        if (lat_data.has_data && lon_data.has_data) {
            std::string city_name;
            if (city_data.has_data && 
                city_data.type == MMDB_DATA_TYPE_UTF8_STRING && 
                city_data.utf8_string) {
                
                city_name = std::string(city_data.utf8_string, city_data.data_size);
            }
            return GeoLocation{lat_data.double_value, lon_data.double_value, city_name};
        }
    }
    return std::nullopt;
}