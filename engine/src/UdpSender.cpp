#include "UdpSender.hpp"
#include <unistd.h>
#include <stdexcept>

UdpSender::UdpSender(const std::string& ip, int port) {
    sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0) throw std::runtime_error("Failed to create UDP socket");

    dest_addr.sin_family = AF_INET;
    dest_addr.sin_port = htons(port);
    inet_pton(AF_INET, ip.c_str(), &dest_addr.sin_addr);
}

UdpSender::~UdpSender() {
    if (sock >= 0) close(sock);
}

bool UdpSender::send(const std::string& payload) {
    return sendto(sock, payload.c_str(), payload.length(), 0, 
                  (struct sockaddr*)&dest_addr, sizeof(dest_addr)) >= 0;
}