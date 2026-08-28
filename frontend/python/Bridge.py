import asyncio
import websockets
import json
import subprocess

engine_process = None 

async def handler(websocket):
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
                cmd.extend(["--traceroute", "true"])
                
            print(f"Executing: {' '.join(cmd)}")
            try:
                engine_process = subprocess.Popen(cmd)
            except Exception as e:
                print(f"Crash on launch: {e}")

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        print("Python WebSocket bridge running on ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())