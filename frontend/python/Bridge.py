import asyncio
import websockets
import json
import subprocess

engine_process = None 
udp_transport = None
data_clients = set()

class UdpToWebSocketRelay(asyncio.DatagramProtocol):
    def datagram_received(self, data, addr):
        payload = data.decode('utf-8', errors='ignore').strip()
        for client in list(data_clients):
            asyncio.create_task(client.send(payload))

async def data_handler(websocket):
    print("Browser connected to Data Channel (8766)")
    data_clients.add(websocket)
    try:
        await asyncio.Future() 
    finally:
        data_clients.remove(websocket)

async def control_handler(websocket):
    global engine_process, udp_transport
    print("Frontend connected.")
        
    async for message in websocket:
        data = json.loads(message)
        command = data.get("type")
            
        if command == "stop_engine":
            if engine_process is not None:
                print("Frontend requested stop. Killing C++ binary...")
                engine_process.terminate()
                engine_process.wait()
                engine_process = None
            if udp_transport is not None:
                udp_transport.close()
                udp_transport = None
                print("UDP listener closed.")
                    
        elif command == "start_engine":
            if engine_process is not None:
                engine_process.terminate()
                engine_process.wait()
                engine_process = None

            if udp_transport is not None:
                udp_transport.close()
                udp_transport = None

            target_host = data.get("hostIp") or "127.0.0.1"
            data_port = int(data.get("dataPort") or 5005)

            loop = asyncio.get_running_loop()
            try:
                udp_transport, _ = await loop.create_datagram_endpoint(
                    lambda: UdpToWebSocketRelay(),
                    local_addr=(target_host, data_port)
                )
                print(f"UDP listener bound dynamically to {target_host}:{data_port}")
            except Exception as e:
                print(f"Failed to bind UDP port {data_port}: {e}")
                continue
            
            cmd = ["../../engine/build/engine"]
            cmd.extend(["--host", str(target_host)])
            cmd.extend(["--dataport", str(data_port)])
            cmd.extend(["--threads", str(data.get("threadCount", "4"))])

            if data.get("dbPath"):
                cmd.extend(["--db", str(data["dbPath"])])
            if data.get("ifName"):
                cmd.extend(["--iface", str(data["ifName"])])
            if data.get("traceRoute"):
                cmd.extend(["--traceroute", str(data["traceRoute"])])
                    
            print(f"Executing: {' '.join(cmd)}")
            try:
                engine_process = subprocess.Popen(cmd)
            except Exception as e:
                print(f"Crash on launch: {e}")

async def main():
    control_server = websockets.serve(control_handler, "localhost", 8765)
    data_server = websockets.serve(data_handler, "localhost", 8766)
    
    print("Bridge ready: Control (8765), Data (8766). Awaiting start signal...")
    await asyncio.gather(control_server, data_server)
    await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())