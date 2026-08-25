#include "GeneralListener.hpp"

using namespace Tins;

GeneralListener::GeneralListener(UdpTracert& tracert, DnsResolver& dns, ThreadPool& pool, std::string& iface): dns(dns), tracert(tracert), pool(pool), iface(iface) {
    logged_ips = std::unordered_set<IPv4Address>();
}

void GeneralListener::listen_loop(){
    if(iface == ""){
        iface = NetworkInterface::default_interface().name();
    }
    std::cout << "Starting general IPv4 sniffer on interface: " << iface << "\n";

    SnifferConfiguration config;
    config.set_promisc_mode(false); 
    config.set_filter("ip and not icmp");

    Sniffer sniffer(iface, config);

    sniffer.sniff_loop([&](PDU& pdu) -> bool {
    const IP* ip = pdu.find_pdu<IP>();
    if (ip) {

        IPv4Address src = ip->src_addr();
        IPv4Address dst = ip->dst_addr();
        
        bool src_local = is_local_ip(src);
        bool dst_local = is_local_ip(dst);

        IPv4Address target_addr;

        if (src_local && !dst_local) {
            target_addr = dst;
        } else if (!src_local && dst_local) {
            target_addr = src;
        } else {
            return true;
        }
        if(logged_ips.count(target_addr)){
            return true;
        }else{
            logged_ips.insert(target_addr);
        }
        std::string target_ip = target_addr.to_string();

        pool.enqueue([this,target_ip]() {
                dns.reverse_lookup(target_ip);
        });
        pool.enqueue([this,target_ip]() {
                tracert.init_route(target_ip);
        });
    }
    return true; 
});
}

bool GeneralListener::is_local_ip(IPv4Address addr) {
    uint32_t ip = ntohl(static_cast<uint32_t>(addr));

    // 10.0.0.0/8     (Mask: 255.0.0.0)
    if ((ip & 0xFF000000) == 0x0A000000) return true;
    
    // 172.16.0.0/12  (Mask: 255.240.0.0)
    if ((ip & 0xFFF00000) == 0xAC100000) return true;
    
    // 192.168.0.0/16 (Mask: 255.255.0.0)
    if ((ip & 0xFFFF0000) == 0xC0A80000) return true;
    
    // 127.0.0.0/8    (Loopback)
    if ((ip & 0xFF000000) == 0x7F000000) return true;

    return false;
}
