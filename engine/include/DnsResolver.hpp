#pragma once
#include "UdpSender.hpp"
#include <netdb.h>
#include <arpa/inet.h>
#include <string.h>

class DnsResolver{
    private:
        UdpSender& sender;
    public:
        DnsResolver(UdpSender& sender);
        void reverse_lookup(const std::string& ip);
};