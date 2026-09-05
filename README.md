# GeoIPv4 Visualizer
![C++17](https://img.shields.io/badge/C%2B%2B-17-00599C?style=flat&logo=c%2B%2B&logoColor=white)
![Python 3.11](https://img.shields.io/badge/Python-3.11.2-3776AB?style=flat&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![WebGL](https://img.shields.io/badge/WebGL-990000?style=flat&logo=webgl&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat&logo=linux&logoColor=black)

https://github.com/user-attachments/assets/51369021-a92d-4b8b-8601-d2d5e44c8ac4

## Key Features - Basic description
**GeoIPv4 Visualizer** is multi-language based project, focused on displaying live interface traffic on interactive map. It is strictly focused on IPv4 comunication. It has the ability to resolve not only the location of the source or destination traffic, but also the traffics taken path, using custom built UDP based traceroute. Both of which are rendered on the map.

Capabilty of resolving geolocation relies heavily on mmdb geoip database. Better the source data better the accuracy - for satisfiable result [MaxMind's GeoIP2 GeoLite2 City](https://github.com/P3TERX/GeoLite.mmdb) was used.

* **Custom C++ Traceroute Engine**: A multithreaded backend built in C++17 utilizing raw UDP sockets for high-speed, asynchronous network path resolution.
* **Real-Time 3D WebGL Rendering**: Maps packet trajectories on an interactive globe using JavaScript, featuring dynamic arc generation and intelligent point-grouping to prevent visual clutter from overlapping nodes.
* **Asynchronous Python Relay:** A Python 3.11 middleware connecting the C++ engine and the browser, utilizing dual WebSockets, while strictly isolateing control signals (start/stop) from the high-frequency data stream.
* **Local Offline Geo-Resolution**: Directly parses MaxMind .mmdb databases in memory to translate IP addresses into physical coordinates instantly, completely avoiding rate-limited third-party APIs.
* **Active Reverse DNS Lookup**: Automatically resolves hostnames for network hops to identify specific ISP and infrastructure routing alongside the geospatial data.
* **Decoupled Architecture**: A strict separation of concerns allowing the heavy packet-sniffing C++ binary to run securely with elevated Linux network capabilities (setcap) while the UI remains entirely sandboxed.

## Project Architecture
```text
+-----------------------+             +-----------------------+             +-----------------------+
|   C++ Engine Binary   |             |  Python Async Bridge  |             |  JavaScript Frontend  |
|  (Packet Resolution)  |             |   (Bridge.py Relay)   |             | (globe.gl Rendering)  |
+-----------------------+             +-----------------------+             +-----------------------+
|                       |  Raw JSON   |                       |  Data WS    |                       |
|  1. Resolve & Format  |============>|  2. Catch on UDP      |============>|  3. Ingest to Cache   |
|     (UDP sendto)      | (Port 5005) |  (DatagramProtocol)   | (Port 8766) |     (RouteState.js)   |
|                       |   Default   |                       |             |                       |
|                       |             |                       |             |                       |
|                       | Subprocess  |                       | Control WS  |                       |
|  5. Execute & Bind    |<------------|  4. Spawn Engine      |<------------|  4. UI Play / Pause   |
|     (CLI Arguments)   |             |    (subprocess.Popen) | (Port 8765) |     (Sidebar Config)  |
+-----------------------+             +-----------------------+             +-----------------------+
```

## Project Structure
```text
.
├── engine
│   ├── CMakeLists.txt
│   ├── include
│   │   ├── DnsResolver.hpp
│   │   ├── GeneralListener.hpp
│   │   ├── GeoResolver.hpp
│   │   ├── ThreadPool.hpp
│   │   ├── TracertListener.hpp
│   │   ├── UdpSender.hpp
│   │   └── UdpTracert.hpp
│   └── src
│       ├── DnsResolver.cpp # Reverse dns lookup
│       ├── EngineConfig.cpp # Wrapper that resolves CLI arguments
│       ├── GeneralListener.cpp # Main listener for IPv4 traffic
│       ├── GeoResolver.cpp # mmdb database query
│       ├── main.cpp
│       ├── ThreadPool.cpp # Thread pool for async resolution and send
│       ├── TracertListener.cpp # Listens for icmp traffic after TTL exceeded
│       ├── UdpSender.cpp # Raw socket sender
│       └── UdpTracert.cpp # Implementation of tracert
├── frontend
│   ├── index.html
│   ├── js
│   │   ├── app.js # Main orchestrator of the web server
│   │   ├── GlobeView.js # Primarly interacts with Globe.gl api
│   │   ├── RouteState.js # Holds the session state
│   │   └── Sidebar.js # Handles sidebar actions
│   ├── python
│   │   ├── Bridge.py # Middleware that translates raw UDP to WS
│   │   └── requirements.txt
│   └── style.css
├── .gitignore
├── installation.sh # Installation script
├── README.md
├── LICENSE
└── resources
    └── demonstration.mp4 # Demonstration video
```
## Installation - Getting started
### Prerequisites & Dependencies
Before installing, ensure your system meets the following requirements. Provided installation script is tailored for Debian-based distributions.
* **Operating System**: Linux (Strictly required for setcap raw network capabilities).
* **System Libraries**: libpcap-dev, libssl-dev, and cmake.
* **Python**: Python 3.11+ with venv support.
* **Geolocation Data**: for example already mentioned [MaxMind's GeoIP2 GeoLite2 City](https://github.com/P3TERX/GeoLite.mmdb).
### Installation
1. Clone repository.
```bash
git clone https://github.com/Koutnas/GeoIP.git
cd GeoIP
```
2. Assign correct permissions to installation script.
```bash
chmod +x installation.sh
```
3. Run installation script
```bash
sudo ./installation.sh
```
### How to run
After sucessful installation new file called `launch.sh` will appear.
1. Run application
```bash
./launch.sh
```
2. Open prefered browser and goto `http://localhost:8686 `
3. Input your network settings (e.g., the path to your downloaded .mmdb file and your active network interface).
4. Click the Play button to spawn the C++ engine and begin visualizing real-time traffic.
5. Close application after done by using shortcut in terminal
```bash
ctrl + c
```
## Component Documentation - Overview
### 1. C++ engine
**Overview**

This binary is the primary driving force behind this whole project. It ses `cmake` as a built tool. There are two defined dependencies in the `CMakeLists.txt` which are compiled and allow usage of their API making work with mmdb database and raw NIC traffic almost trivial.

Dependencies are `libmaxminddb` for accessing and querying mmdb database and `libtins` which allows working with raw NIC traffic hence the requirement of `setcap` for higher priveledges.

**General Workflow**
1. Depending if traceroute is selected two threads are initialized both to work as a listener. First thread listens for all IPv4 traffic and marks down already seen addresses into hashmap. Second thread is configured to be ICMP listener which listens for TTL time exceeded packets on the same interface.
2. First permanent thread `GeneralListener` reads IPv4 address and checks that it hasn't been marked yet and also isn't in the private range of 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 or loopback address. Then it dispatches task into thread pool where worker thread takes over. This worker thread then starts sending UPD packets with increasing TTL and destination port to IPv4 address. This starts to generate ICMP error packets with time exceeded. Then it sends trough raw UPD port first json object with special TTL 0 marking it as a final destination to the frontend.
3. Second permanent thread `TracertListener` detects theese packets and after parsing IPv4 address and determining original TTL thanks to decrementing the original destination port. It then dispatches another task to worker pool for each incoming error message. Worker thread then resolves Geolocation and sends it to raw UDP port.
4. Steps 2 and 3 repeat until stopped.

**Good to know**

This engine was designed as a standalone binary capturing IPv4 traffic, performing offline geolocation lookups, and streaming the results as JSON datagrams over a raw UDP socket. It can be integrated into other tools, if the frontend was seen as unfit. For information about the binary arguments run:
```bash
./engine -h
```
Output is predictable and comes in form of 2 types of JSON.
* Geospatial ("type": "trace")
```JSON
{"type":"trace","dest_ip":"8.8.8.8","hop_ip":"142.250.11.1","ttl":"5","latitude":"50.0880","longitude":"14.4208","city":"Prague"}
```
* Reverse DNS ("type":"dns")
```JSON
{"type":"dns","ip":"142.250.11.1","hostname":"prg03s05-in-f1.1e100.net"}
```
### 2. Python middleware
**Overview**

This whole middle ware is defined in a single file since serves just as a duct tape between web server and C++ engine. Reason for choosing this approach is because:
1. Browsers cannot read raw UDP ports for security reasons.
2. Managing subprocesses with javascript is restrictive and gets messy fast.
As already visualized in the architecture diagram above. This process reads raw UDP port to which C++ engine streams JSON it then streams this JSON to browser frontend via WebSocket on port 8766. It also serves as the main process for spawning and managing the C++ subrprocess. Users have fullcontrol above the underlying engine thanks to control pane WebSocket on port 8765 trough which are sent arguments for the C++ subprocess along with start and stop signals.

### 3. JavaScript frontend
**Overview**

The frontend is a lightweight, sandboxed web interface that visualizes the geospatial data as a real-time 3D web. It handles zero network sniffing logic, functioning entirely as a data consumer and visualization layer. It relies on globe.gl for WebGL hardware-accelerated rendering and standard HTML5 WebSockets to communicate with the Python middleware.

**General Workflow**
1. Users input settings in the sidebar. Clicking "Play" sends a JSON command via the control WebSocket (Port 8765) to Python, triggering the C++ engine.
2. A separate data WebSocket (Port 8766) receives the incoming JSON packet stream from the bridge.
3. RouteState.js processes the payloads: "trace" events are stored as network hops, and "dns" events update existing IPs with resolved hostnames.
4. To prevent visual clutter, RouteState.js groups overlapping coordinates (which frequently occurs when multiple IPs map to the same regional data center).
5. The structured data is passed to globe.gl to render the 3D arcs and tooltips on the map.

**Good to know**
The map relies entirely on WebGL. If frame rates drop during heavy traffic, ensure browser hardware acceleration is enabled. Decoupling the data cache (RouteState.js) from the rendering layer keeps the globe responsive even when processing large volumes of concurrent packets.

## License
This projects is licensed under MIT license.

## Author
Ondřej Koutník
