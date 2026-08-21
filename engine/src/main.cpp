#include <iostream>
#include <thread>
#include <chrono>
#include "GeoResolver.hpp"
#include "UdpSender.hpp"



int main() {
        GeoResolver geo = GeoResolver("GeoLite2-City.mmdb");
        UdpSender sender = UdpSender("127.0.0.1", 5005);

        std::string test_ip = "93.190.48.13";

        while(1){
                std::optional<GeoLocation> location = geo.resolve(test_ip);
                if (location) {
                std::string message = "{\"ip\": \"" + test_ip + "\", \"latitude\": \"" + std::to_string(location->latitude) + "\", \"longitude\": \"" + std::to_string(location->longitude) + "\"}";
                sender.send(message);
                } else {
                std::cout << "Failed to resolve IP address." << std::endl;
                }
                std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
        return 0;
}