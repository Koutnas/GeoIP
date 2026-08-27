import { GlobeView } from './GlobeView.js';
import { RouteState } from './RouteState.js';
import { Sidebar } from './Sidebar.js';

// 1. Initialize the state and the 3D map
const state = new RouteState();
const view = new GlobeView('globeViz');
let isPaused = true;
let highlightArcs = [];


function refreshMap() {
    view.renderArcs([...state.getArcs(), ...highlightArcs]);
    view.renderActiveHops([...state.getPoints()]);
}

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
    {"type":"trace","dest_ip": "54.253.67.150", "hop_ip": "54.253.67.150", "ttl": "0", "latitude": "-33.867200", "longitude": "151.199700","city":"Sydney"},
    {"type":"trace","dest_ip": "54.253.67.150", "hop_ip": "10.92.6.149", "ttl": "3", "latitude": "unknown", "longitude": "unknown","city":"unknown"},
    {"type":"trace","dest_ip": "54.253.67.150", "hop_ip": "192.168.0.1", "ttl": "1", "latitude": "unknown", "longitude": "unknown","city":"unknown"},
    {"type":"trace","dest_ip": "54.253.67.150", "hop_ip": "62.141.11.97", "ttl": "2", "latitude": "50.147700", "longitude": "14.100500","city":"Kladno"},
    {"type":"trace","dest_ip": "54.253.67.150", "hop_ip": "62.115.139.104", "ttl": "10", "latitude": "48.858200", "longitude": "2.338700","city":"unknown"},
    {"type":"trace","dest_ip": "54.253.67.150", "hop_ip": "62.115.124.26", "ttl": "5", "latitude": "48.858200", "longitude": "2.338700","city":"unknown"},
    {"type":"trace","dest_ip": "54.253.67.150", "hop_ip": "62.115.139.33", "ttl": "8", "latitude": "48.858200", "longitude": "2.338700","city":"unknown"},
    {"type":"trace","dest_ip": "54.253.67.150", "hop_ip": "62.115.139.17", "ttl": "11", "latitude": "48.858200", "longitude": "2.338700","city":"unknown"},
    {"type":"trace","dest_ip": "54.253.67.150", "hop_ip": "62.115.139.244", "ttl": "7", "latitude": "48.858200", "longitude": "2.338700","city":"unknown"},
    {"type":"trace","dest_ip": "54.253.67.150", "hop_ip": "62.115.115.76", "ttl": "9", "latitude": "48.858200", "longitude": "2.338700","city":"unknown"},

];

const groupedHops = new Map();

const sidebar = new Sidebar({
    onRouteSelect: (destIp) => {
        if (state.selectedTarget === destIp) {
            state.setSelected(null); 
            highlightArcs = [];
        } else {
            // Select: Build the duplicate arcs
            state.setSelected(destIp);
            const hops = state.routes.get(destIp) || [];
            
            highlightArcs = [];
            for (let i = 0; i < hops.length - 1; i++) {
                // Ensure coordinates are valid and it actually moved locations
                if (hops[i].latitude !== 'unknown' && hops[i+1].latitude !== 'unknown') {
                    if (hops[i].latitude !== hops[i+1].latitude || hops[i].longitude !== hops[i+1].longitude) {
                        highlightArcs.push({
                            startLat: parseFloat(hops[i].latitude),
                            startLng: parseFloat(hops[i].longitude),
                            endLat: parseFloat(hops[i+1].latitude),
                            endLng: parseFloat(hops[i+1].longitude),
                            isHighlight: true // <-- The magic flag for Globe.gl
                        });
                    }
                }
            }
        }
        view.renderArcs([...state.getArcs(), ...highlightArcs]);
        sidebar.renderRoutes(state); 
    },
   onTogglePlayback: () => {
        isPaused = !isPaused; 
        sidebar.setPlaybackState(isPaused); 
        console.log(isPaused ? "Data stream paused" : "Data stream resumed");
    },
    onSettingsClick: () => {
        console.log("Settings panel opened");
        // TODO: Implement settings modal
    },
    onRoutesClick: () => {
        console.log("Routes tab clicked");
        sidebar.renderRoutes(state);
    }
});

// Process the mock data ONCE
mockData.forEach(payload => {
    if (payload.type === 'trace') {
        
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
refreshMap();