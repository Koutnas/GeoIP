import { GlobeView } from './GlobeView.js';
import { RouteState } from './RouteState.js';

// 1. Initialize the state and the 3D map
const state = new RouteState();
const view = new GlobeView('globeViz');

// 2. Paste some of your actual engine output here
const mockData = [
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "4.150.223.105", "ttl": "0", "latitude": "41.601500", "longitude": "-93.612700","city":"Des Moines"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "192.168.0.1", "ttl": "1", "latitude": "unknown", "longitude": "unknown","city":"unknown"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "62.141.11.97", "ttl": "2", "latitude": "50.147700", "longitude": "14.100500","city":"Kladno"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "51.10.27.104", "ttl": "8", "latitude": "51.496400", "longitude": "-0.122400","city":"unknown"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "51.10.4.48", "ttl": "11", "latitude": "51.496400", "longitude": "-0.122400","city":"unknown"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "104.44.29.93", "ttl": "6", "latitude": "37.751000", "longitude": "-97.822000","city":"unknown"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "104.44.33.137", "ttl": "5", "latitude": "37.751000", "longitude": "-97.822000","city":"unknown"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "104.44.31.39", "ttl": "9", "latitude": "37.751000", "longitude": "-97.822000","city":"unknown"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "104.44.7.103", "ttl": "14", "latitude": "37.751000", "longitude": "-97.822000","city":"unknown"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "51.10.9.203", "ttl": "13", "latitude": "51.496400", "longitude": "-0.122400","city":"unknown"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "104.44.54.234", "ttl": "15", "latitude": "37.751000", "longitude": "-97.822000","city":"unknown"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "51.10.16.0", "ttl": "16", "latitude": "51.496400", "longitude": "-0.122400","city":"unknown"},
    {"type":"trace","dest_ip": "4.150.223.105", "hop_ip": "51.10.34.251", "ttl": "12", "latitude": "51.496400", "longitude": "-0.122400","city":"unknown"},
];

const groupedHops = new Map();

// Process the mock data ONCE
mockData.forEach(payload => {
    if (payload.type === 'trace') {
        
        // 1. Feed the RouteState (this handles the arcs)
        state.addHop(payload);
        
        // 2. Group the data for the dots/tooltips
        if (payload.latitude !== 'unknown' && payload.longitude !== 'unknown') {
            const coordKey = `${payload.latitude},${payload.longitude}`;
            
            if (!groupedHops.has(coordKey)) {
                groupedHops.set(coordKey, {
                    lat: payload.latitude,
                    lng: payload.longitude,
                    city: payload.city,
                    routers: [] // Array to hold all routers at this exact spot
                });
            }
            groupedHops.get(coordKey).routers.push(payload);
        }
        
    } else if (payload.type === 'dns') {
        state.setHostname(payload.ip, payload.hostname);
    }
});

// Pass the processed data to the WebGL View
view.renderArcs(state.getArcSegments());
view.renderActiveHops(Array.from(groupedHops.values()));