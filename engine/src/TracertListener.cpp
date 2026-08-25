#include "TracertListener.hpp"
#include <tins/tins.h>
using namespace Tins;

TracertListener::TracertListener(UdpTracert& tracert,ThreadPool& pool): tracert(tracert), pool(pool){}


void TracertListener::listen_loop(){
    try {
        std::string iface = NetworkInterface::default_interface().name();
        std::cout << "Starting sniffer on interface: " << iface << "\n";

        SnifferConfiguration config;
        config.set_promisc_mode(false); 
        config.set_filter("icmp");

        Sniffer sniffer(iface, config);
        
        sniffer.sniff_loop([&](PDU& pdu) -> bool {
    const IP* ip = pdu.find_pdu<IP>();
    if (!ip) return true; 

        const ICMP* icmp = pdu.find_pdu<ICMP>();
        if (icmp) {
            const RawPDU* raw = pdu.find_pdu<RawPDU>();
            if (raw) {
                try {
                    IP original_ip(raw->payload().data(), raw->payload().size());
                    const UDP* original_udp = original_ip.find_pdu<UDP>();
                    
                    if (original_udp) {
                        std::string target_ip = original_ip.dst_addr().to_string();
                        std::string hop_ip = ip->src_addr().to_string();
                        int ttl = original_udp->dport() - 33434;
                        if (icmp->type() == ICMP::TIME_EXCEEDED) {
                            pool.enqueue([this, target_ip, hop_ip, ttl]() {
                                tracert.add_hop(target_ip, hop_ip, ttl);
                            });
                        }
                    }
                } catch (...) {}
            }
        }
        return true; 
        });

    } catch (const Tins::socket_open_error& e) {
        std::cerr << "[FATAL] Sniffer failed to open socket: " << e.what() << "\n";
        std::cerr << "Did you forget to run with sudo or setcap?\n";
    } catch (const std::exception& e) {
        std::cerr << "[ERROR] Sniffer thread crashed: " << e.what() << "\n";
    }
}