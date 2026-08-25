#include "ThreadPool.hpp"
#include "DnsResolver.hpp"
#include "UdpTracert.hpp"

class GeneralListener{
    private:
        DnsResolver& dns;
        UdpTracert& tracert;
        ThreadPool& pool;
    public:
        GeneralListener(UdpTracert& tracert, DnsResolver& dns, ThreadPool& pool);
        void listen_loop();
};
