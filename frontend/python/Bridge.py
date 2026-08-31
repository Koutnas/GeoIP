import asyncio
import websockets
import json
import subprocess

engine_process = None 
data_clients = set()

class UdpToWebSocketRelay(asyncio.DatagramProtocol):
    def datagram_received(self, data, addr):
        payload = data.decode('utf-8').strip()
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
    global engine_process
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
                    
        elif command == "start_engine":
            if engine_process is not None:
                engine_process.terminate()
                engine_process.wait()
            cmd = ["../../engine/build/engine"]
            cmd.extend(["--host", str(data["hostIp"])])
            cmd.extend(["--dataport", str(data["dataPort"])])
            cmd.extend(["--threads", str(data["threadCount"])])
            if data["dbPath"]:
                cmd.extend(["--db", str(data["dbPath"])])
            if data["ifName"]:
                cmd.extend(["--iface", str(data["ifName"])])
            if data["traceRoute"]:
                cmd.extend(["--traceroute", str(data["traceRoute"])])
                    
            print(f"Executing: {' '.join(cmd)}")
            try:
                engine_process = subprocess.Popen(cmd)
            except Exception as e:
                print(f"Crash on launch: {e}")

async def main():
    control_server = websockets.serve(control_handler, "localhost", 8765)
    data_server = websockets.serve(data_handler, "localhost", 8766)
    
    loop = asyncio.get_running_loop()
    udp_server = loop.create_datagram_endpoint(
        lambda: UdpToWebSocketRelay(),
        local_addr=("127.0.0.1", 5005) 
    )

    await asyncio.gather(control_server, data_server, udp_server)
    print("Servers running: Control (8765), Data (8766), UDP Listener (5005)")
    await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())