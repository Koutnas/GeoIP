#pragma once
#include "UdpSender.hpp"
#include "GeoResolver.hpp"
#include <tins/tins.h>
#include <iostream>



class SynTracert {
private:
    UdpSender& sender;
    GeoResolver& geo;
    std::unordered_map<std::string,int> active_routes;

    void send_traceroute_probe(const std::string& target_ip, int ttl, uint16_t dest_port = 80);
public:
    SynTracert(UdpSender& sender,GeoResolver& geo);
    void init_route(const std::string& target_ip);
    void add_hop(const std::string& target_ip, const std::string& hop_ip);
    void resolve_and_send(const std::string& target_ip, const std::string& hop_ip, int ttl);
};
