#include <iostream>
#include <string>
#include <string_view>

// Holds all our engine settings in one neat package
struct EngineConfig {
    int dataport = 5005;
    int threadcount = 6;
    std::string target_host = "127.0.0.1";
    std::string db_path = "GeoLite2-City.mmdb";
    std::string interface_name = ""; // Empty string tells the engine to auto-detect
    bool enable_traceroute = true;
};

// Parses argc/argv into our struct
EngineConfig parse_args(int argc, char* argv[]) {
    EngineConfig config;

    for (int i = 1; i < argc; ++i) {
        std::string_view arg = argv[i];

        if (arg == "--dataport" && i + 1 < argc) {
            config.dataport = std::stoi(argv[++i]);
        } 
        else if (arg == "--host" && i + 1 < argc) {
            config.target_host = argv[++i];
        } 
        else if (arg == "--db" && i + 1 < argc) {
            config.db_path = argv[++i];
        } 
        else if (arg == "--iface" && i + 1 < argc) {
            config.interface_name = argv[++i];
        } 
        else if (arg == "--traceroute" && i + 1 < argc) {
            std::string_view val = argv[++i];
            config.enable_traceroute = (val == "true" || val == "1");
        }
        else if (arg == "--threads" && i + 1 < argc) {
            config.threadcount = std::stoi(argv[++i]);
        } 
        else if (arg == "--help" || arg == "-h") {
            std::cout << "Usage: sudo ./engine [options]\n\n"
                      << "Options:\n"
                      << "  --dataport <port>      UDP port to stream JSON (default: 5005)\n"
                      << "  --host <ip>            Target host for UDP stream (default: 127.0.0.1)\n"
                      << "  --db <path>            Path to GeoIP DB (default: GeoLite2-City.mmdb)\n"
                      << "  --iface <name>         Network interface to read (default: auto)\n"
                      << "  --traceroute <bool>    Enable/disable active tracing (default: true)\n"
                      << "  --threads <num>        Number of active threads in worker pool (default: 6)\n";
            exit(0);
        }
        else {
            std::cerr << "Unknown argument: " << arg << "\nType --help for usage.\n";
            exit(1);
        }
    }
    return config;
}