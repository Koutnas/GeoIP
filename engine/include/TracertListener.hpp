#pragma once
#include "UdpTracert.hpp"
#include "ThreadPool.hpp"


class TracertListener{
    private:
        UdpTracert& tracert;
        ThreadPool& pool;
    public:
        TracertListener(UdpTracert& tracert, ThreadPool& pool);
        void listen_loop();
};