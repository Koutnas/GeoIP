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
#include "GeneralListener.hpp"
#include "EngineConfig.cpp"



int main(int argc, char* argv[]) {
    try {
        EngineConfig config = parse_args(argc, argv);

        GeoResolver geo = GeoResolver(config.db_path);
        UdpSender sender = UdpSender(config.target_host, config.dataport);
        UdpTracert tracert = UdpTracert(sender, geo);
        DnsResolver dns = DnsResolver(sender);
        ThreadPool pool = ThreadPool(config.threadcount);
        TracertListener tracelistener = TracertListener(tracert,pool,config.interface_name);
        GeneralListener genelistener = GeneralListener(tracert,dns,pool,config.interface_name);


        if (config.enable_traceroute) {
            std::thread listenTrace([&tracelistener]() {
                tracelistener.listen_loop();
            });

            std::thread generalist([&genelistener]() {
                genelistener.listen_loop();
            });
                generalist.join();
                listenTrace.join();
        } else {
            std::thread generalist([&genelistener]() {
            genelistener.listen_loop();
        });
            generalist.join();
        }
    } catch (const std::exception& e) {
        std::cerr << "Exception in main: " << e.what() << "\n";
        return 1;
    }
    return 0;
}