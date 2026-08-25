#pragma once
#include "UdpTracert.hpp"
#include "ThreadPool.hpp"


class TracertListener{
    private:
        UdpTracert& tracert;
        ThreadPool& pool;
        std::string& iface;
    public:
        TracertListener(UdpTracert& tracert, ThreadPool& pool, std::string& iface);
        void listen_loop();
};