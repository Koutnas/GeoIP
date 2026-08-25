#pragma once
#include "UdpSender.hpp"
#include "GeoResolver.hpp"
#include <tins/tins.h>
#include <iostream>
#include <shared_mutex>



class UdpTracert {
private:
    UdpSender& sender;
    GeoResolver& geo;
    std::unordered_map<std::string,int> active_routes;
    std::shared_mutex rw_mutex;
    Tins::PacketSender packet_sender;
    mutable std::mutex packet_send_mutex;
    void send_traceroute_probe(const std::string& target_ip, int ttl);
public:
    UdpTracert(UdpSender& sender,GeoResolver& geo);
    void init_route(const std::string& target_ip);
    void add_hop(const std::string& target_ip, const std::string& hop_ip, int ttl);
    void resolve_and_send(const std::string& target_ip, const std::string& hop_ip, int ttl);
};
