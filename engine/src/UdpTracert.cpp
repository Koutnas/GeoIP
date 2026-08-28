#include "UdpTracert.hpp"
#include <thread>
#include <mutex>

using namespace Tins;

UdpTracert::UdpTracert(UdpSender& sender,GeoResolver& geo): sender(sender), geo(geo){
    packet_sender = PacketSender();
}

void UdpTracert::send_traceroute_probe(const std::string& target_ip, int ttl) {
    IP packet = IP(target_ip) / UDP(33434 + ttl, 12345); 
    packet.ttl(ttl);
    {
        std::lock_guard<std::mutex> lock(packet_send_mutex);
        packet_sender.send(packet);
    }
}

void UdpTracert::init_route(const std::string& target_ip) {
    resolve_and_send(target_ip, target_ip, 0);
    for (int ttl = 1; ttl <= 30; ++ttl) {
        send_traceroute_probe(target_ip, ttl);
        std::this_thread::sleep_for(std::chrono::milliseconds(5)); 
    }
}

void UdpTracert::add_hop(const std::string& target_ip, const std::string& hop_ip, int ttl) {
    resolve_and_send(target_ip, hop_ip, ttl);
}

void UdpTracert::resolve_and_send(const std::string& target_ip, const std::string& hop_ip, int ttl){
    std::optional<GeoLocation> location = geo.resolve(hop_ip);
    std::string message;
    if (location) {
        message = 
        "{\"type\":\"trace\",\"dest_ip\": \"" + target_ip + 
        "\", \"hop_ip\": \"" + hop_ip +
        "\", \"ttl\": \"" + std::to_string(ttl) +
        "\", \"latitude\": \"" + std::to_string(location->latitude) + 
        "\", \"longitude\": \"" + std::to_string(location->longitude) + "\""+
        ",\"city\":\"" + ((location->city_name == "") ?"\"unknown\"":location->city_name) + "\"}\n";
    } else {
        message = 
        "{\"type\":\"trace\",\"dest_ip\": \"" + target_ip + 
        "\", \"hop_ip\": \"" + hop_ip +
        "\", \"ttl\": \"" + std::to_string(ttl) +
        "\", \"latitude\": \"" + "unknown" + 
        "\", \"longitude\": \"" + "unknown" + "\""+
        "\"city\":"+"unknown"+"}\n";

    }
    sender.send(message);
}
