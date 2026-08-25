#include "ThreadPool.hpp"
#include "DnsResolver.hpp"
#include "UdpTracert.hpp"
#include<unordered_set>
#include <arpa/inet.h>

class GeneralListener{
    private:
        DnsResolver& dns;
        UdpTracert& tracert;
        ThreadPool& pool;
        std::string& iface;
        std::shared_mutex rw_mutex;
        std::unordered_set<Tins::IPv4Address> logged_ips;
        bool is_local_ip(Tins::IPv4Address addr);
        
    public:
        GeneralListener(UdpTracert& tracert, DnsResolver& dns, ThreadPool& pool, std::string& iface);
        void listen_loop();
};
