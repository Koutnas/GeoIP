#include <iostream>
#include <thread>
#include <chrono>
#include <thread>
#include "GeoResolver.hpp"
#include "UdpSender.hpp"
#include "ThreadPool.hpp"
#include "UdpTracert.hpp"
#include "TracertListener.hpp"
#include "DnsResolver.hpp"



int main() {
        GeoResolver geo = GeoResolver("GeoLite2-City.mmdb");
        UdpSender sender = UdpSender("127.0.0.1", 5005);
        UdpTracert tracert = UdpTracert(sender, geo);
        DnsResolver dns = DnsResolver(sender);
        ThreadPool pool = ThreadPool(6);
        TracertListener listener = TracertListener(tracert,pool);

        std::thread listenThread([&listener](){
                listener.listen_loop();
        });
        std::this_thread::sleep_for(std::chrono::seconds(5));
        std::string test_ip = "93.190.48.13";

        pool.enqueue([&dns,test_ip]() {
                dns.reverse_lookup(test_ip);
        });
        tracert.init_route(test_ip);

        listenThread.join();
        return 0;
}