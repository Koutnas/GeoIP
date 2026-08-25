#include "DnsResolver.hpp"


DnsResolver::DnsResolver(UdpSender& sender): sender(sender) {}

void DnsResolver::reverse_lookup(const std::string& ip){
    struct sockaddr_in sa;
    memset(&sa, 0, sizeof(sa));
    sa.sin_family = AF_INET;
    inet_pton(AF_INET, ip.c_str(), &sa.sin_addr);

    char host[NI_MAXHOST];
    std::string msg;
    if (getnameinfo((struct sockaddr*)&sa, sizeof(sa), host, sizeof(host), NULL, 0, NI_NAMEREQD) == 0) {
        msg = 
        "{\"type\":\"dns\",\"ip\":\"" + ip + "\",\"hostname\":\"" + host + "\"}\n";
    } else {
        msg = 
        "{\"type\":\"dns\",\"ip\":\"" + ip + "\",\"hostname\":\"unknown\"}\n";
    }
    sender.send(msg);
}

