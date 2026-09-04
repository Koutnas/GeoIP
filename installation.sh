!#/bin/bash
#This is installation script for geo-IPV4 project visualizer

#Check if the user is root
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script as root/sudo"
    exit 1
fi
#If you are running non-debian based distro please replace with your package manager
apt install libpcap-dev libssl-dev cmake -y
cd engine
cmake --build . --config Release
setcap cap_net_raw,cap_net_admin=eip build/engine
cd ../frontend/python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate
cd ../..
cat << 'EOF' > launch.sh
#!/bin/bash
cd frontend/python
source .venv/bin/activate
python3 Bridge.py &
BRIDGE_PID = $!
deactivate
cd ..
python3 -m http.server 8686 &
HTTP_PID = $!
trap "kill $BRIDGE_PID $SERVER_PID 2>/dev/null"
wait
echo "Application stopped"
EOF
chmod 777 launch.sh
