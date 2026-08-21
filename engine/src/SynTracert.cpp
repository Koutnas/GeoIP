#include "SynTracert.hpp"

using namespace Tins;

SynTracert::SynTracert(UdpSender& sender,GeoResolver& geo): sender(sender), geo(geo){
    active_routes = std::unordered_map<std::string,int>();
}

void SynTracert::send_traceroute_probe(const std::string& target_ip, int ttl, uint16_t dest_port) {
    // 1. Craft the packet using the / operator to stack IP and TCP layers
    IP packet = IP(target_ip) / TCP(dest_port, 12345); // 12345 is our random source port
    packet.ttl(ttl);
    packet.rfind_pdu<TCP>().set_flag(TCP::SYN, 1);
    PacketSender sender;
    sender.send(packet);
    
    std::cout << "Fired TCP SYN probe to " << target_ip << " with TTL " << ttl << "\n";
}

void SynTracert::init_route(const std::string& target_ip) {
    active_routes[target_ip] = 1;
    send_traceroute_probe(target_ip,1);
}

void SynTracert::add_hop(const std::string& target_ip, const std::string& hop_ip) {
    if(hop_ip == target_ip){
        active_routes.erase(target_ip);
        return;
    }
    resolve_and_send(target_ip,hop_ip,active_routes[target_ip]);//active_routes[target_ip] is serving here as ttl
    
    active_routes[target_ip]++;
    int ttl = active_routes[target_ip];
    send_traceroute_probe(target_ip,ttl);
}

void SynTracert::resolve_and_send(const std::string& target_ip, const std::string& hop_ip, int ttl){
    std::optional<GeoLocation> location = geo.resolve(hop_ip);
    if (location) {
        std::string message = 
        "{\"dest_ip\": \"" + target_ip + 
        "\", \"hop_ip\": \"" + hop_ip +
        "\", \"ttl\": \"" + std::to_string(ttl) +
        "\", \"latitude\": \"" + std::to_string(location->latitude) + 
        "\", \"longitude\": \"" + std::to_string(location->longitude) + "\"}";

        sender.send(message);
    } else {
        std::string message = 
        "{\"dest_ip\": \"" + target_ip + 
        "\", \"hop_ip\": \"" + hop_ip +
        "\", \"ttl\": \"" + std::to_string(ttl) +
        "\", \"latitude\": \"" + "unknown" + 
        "\", \"longitude\": \"" + "unknown" + "\"}";

        sender.send(message);
    }
}
