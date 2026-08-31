export class RouteState {
    constructor() {
        // Map of target_ip -> Array of hop objects
        this.routes = new Map();
        // Map of target_ip -> Hostname string
        this.hostnames = new Map();
        this.selectedTarget = null;

        this.persistentArcs = [];
        this.persistentPoints = new Map();
    }

    addHop(payload) {
        if (payload.latitude === 'unknown' || payload.longitude === 'unknown') return;
        const numericTtl = parseInt(payload.ttl, 10);
        payload.numericTtl = numericTtl === 0 ? 255 : numericTtl;

        if (!this.routes.has(payload.dest_ip)) {
            this.routes.set(payload.dest_ip, []);
        }
        const routeHops = this.routes.get(payload.dest_ip);
        routeHops.push(payload);
        routeHops.sort((a, b) => a.numericTtl - b.numericTtl);
        this.persistentArcs = [];
        for (const hops of this.routes.values()) {
            for (let i = 0; i < hops.length - 1; i++) {
                // Prevent drawing arcs between routers in the exact same city
                if (hops[i].latitude !== hops[i+1].latitude || hops[i].longitude !== hops[i+1].longitude) {
                    this.persistentArcs.push({
                        startLat: hops[i].latitude,
                        startLng: hops[i].longitude,
                        endLat: hops[i + 1].latitude,
                        endLng: hops[i + 1].longitude,
                        target: hops[0].dest_ip
                    });
                }
            }
        }
        // 4. Update the Point Cache (Fixing the undefined IP bug)
        const coordKey = `${payload.latitude},${payload.longitude}`;
        if (!this.persistentPoints.has(coordKey)) {
            this.persistentPoints.set(coordKey, {
                lat: payload.latitude,
                lng: payload.longitude,
                city: payload.city,
                routers: [] 
            });
        }
        this.persistentPoints.get(coordKey).routers.push({
            ttl: payload.ttl,
            hop_ip: payload.hop_ip,
            target: payload.dest_ip
        });
    }

    // Getters just return the cached data
    getArcs() {
        return this.persistentArcs; 
    }

    getPoints() {
        return Array.from(this.persistentPoints.values());
    }

    setHostname(ip, hostname) {
        this.hostnames.set(ip, hostname);
    }
    setSelected(destIp){
        this.selectedTarget = destIp;
    }
    clear() {
        this.routes.clear();
        this.hostnames.clear();
        this.persistentArcs = [];
        this.persistentPoints.clear();
        this.selectedTarget = null;
    }
}