import { GlobeView } from './GlobeView.js';
import { RouteState } from './RouteState.js';
import { Sidebar } from './Sidebar.js';

// 1. Initialize the state and the 3D map
const state = new RouteState();
const view = new GlobeView('globeViz');
let isPaused = true;
let highlightArcs = [];

const controlWs = new WebSocket('ws://localhost:8765');
const dataWs = new WebSocket('ws://localhost:8766');

dataWs.onmessage = (event) => {
    if (!isPaused) {
        try {
            const payload = JSON.parse(event.data);
            if (payload.type === "trace") {
                state.addHop(payload);
                refreshMap(); 
                sidebar.renderRoutes(state);
            } else if (payload.type === "dns") {
                if (payload.hostname !== "unknown") {
                    state.setHostname(payload.ip, payload.hostname);
                    sidebar.renderRoutes(state);
                }
            }
        } catch (e) {
            console.error("Failed to parse C++ payload:", e);
        }
    }
};

function refreshMap() {
    view.renderArcs([...state.getArcs(), ...highlightArcs]);
    view.renderActiveHops([...state.getPoints()]);
}

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

        if (isPaused) {
            console.log("Sending kill signal to C++ engine...");
            if (controlWs.readyState === WebSocket.OPEN) {
                controlWs.send(JSON.stringify({ type: "stop_engine" }));
            }
        } else {
            console.log("Wiping frontend memory and starting engine...");
            state.clear();
            highlightArcs = [];
            refreshMap();
            sidebar.renderRoutes(state);
            const config = sidebar.getSettings();
            if (controlWs.readyState === WebSocket.OPEN) {
                controlWs.send(JSON.stringify(config));
            } else {
                console.error("WebSocket is not connected!");
            }
            
            // 3. Auto-switch to routes view to watch incoming data
            sidebar.setTab('routes'); 
        }
    },
    onSettingsClick: () => {
        console.log("Settings panel opened");
        sidebar.setTab('settings');
    },
    onRoutesClick: () => {
        console.log("Routes tab clicked");
        sidebar.setTab('routes');
        sidebar.renderRoutes(state);
    }
});

// Pass the processed data to the WebGL View
refreshMap();
sidebar.setTab('routes');
sidebar.renderRoutes(state);