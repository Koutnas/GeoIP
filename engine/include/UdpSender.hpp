#pragma once
#include <string>
#include <sys/socket.h>
#include <arpa/inet.h>

class UdpSender
{
private:
    int sock;
    struct sockaddr_in dest_addr;
public:
    UdpSender(const std::string& ip, int port);
    bool send(const std::string& payload);
    ~UdpSender();
};
