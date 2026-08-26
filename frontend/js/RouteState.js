export class RouteState {
    constructor() {
        // Map of target_ip -> Array of hop objects
        this.routes = new Map();
        // Map of target_ip -> Hostname string
        this.hostnames = new Map();
    }

    addHop(hopData) {
        if (hopData.ttl === "0") {
            hopData.ttl = "255";
        }
        let { dest_ip, hop_ip, ttl, latitude, longitude } = hopData;

        
        // Skip unresolved coordinates
        if (latitude === "unknown" || longitude === "unknown") return;

        if (!this.routes.has(dest_ip)) {
            this.routes.set(dest_ip, []);
        }

        const hops = this.routes.get(dest_ip);
        if (!hops.some(h => h.ttl === ttl)) {
            hops.push({
                ttl: parseInt(ttl),
                ip: hop_ip,
                lat: parseFloat(latitude),
                lng: parseFloat(longitude)
            });
            hops.sort((a, b) => a.ttl - b.ttl);
        }
    }

    setHostname(ip, hostname) {
        this.hostnames.set(ip, hostname);
    }
    getArcSegments() {
        const arcs = [];
        
        for (const [destIp, hops] of this.routes.entries()) {
            for (let i = 0; i < hops.length - 1; i++) {
                arcs.push({
                    startLat: hops[i].lat,
                    startLng: hops[i].lng,
                    endLat: hops[i + 1].lat,
                    endLng: hops[i + 1].lng,
                    target: destIp
                });
            }
        }
        return arcs;
    }
}