export class GlobeView {
    constructor(containerId) {
        this.world = Globe()(document.getElementById(containerId))
            .globeImageUrl('https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/july/world.200407.3x21600x10800.jpg')
            .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
            .backgroundColor('#000000')
            .pointOfView({ lat: 50.0883, lng: 14.4124, altitude: 2.2 })
            // --- ARC CONFIGURATION ---
            
            .arcStartLat(d => d.startLat)
            .arcStartLng(d => d.startLng)
            .arcEndLat(d => d.endLat)
            .arcEndLng(d => d.endLng)
            
            // 1. The Color: Make the highlight a semi-transparent aura (alpha 0.4)
            .arcColor(d => d.isHighlight ? 'rgba(0, 255, 170, 0.4)' : ['#00ffc8', '#0800ff'])
            
            // 2. The Thickness: Make the aura very fat, keep the base thin
            .arcStroke(d => d.isHighlight ? 0.3 : 0.1)
            .arcAltitudeAutoScale(d => d.isHighlight ? 0.4005 : 0.4)
        
            .arcDashLength(d => d.isHighlight ? 1 : 0.1)
            .arcDashGap(d => d.isHighlight ? 0 : 0.05)
            .arcDashAnimateTime(5000)
            

            .htmlElementsData([]) // Starts empty
            .htmlLat(d => d.latitude)  
            .htmlLng(d => d.longitude)    
            .pointsData([])
            .pointLat(d => d.lat)
            .pointLng(d => d.lng)
            .pointColor(() => '#00ffaa')
            .pointRadius(0.16)
            .pointAltitude(0.001)
            .pointLabel(d => {
                // Build a single tooltip that lists ALL routers at this coordinate
                let html = `<div style="background: rgba(0,0,0,0.9); padding: 8px; border: 1px solid #555; border-radius: 4px; font-family: sans-serif; font-size: 12px; color: #fff;">`;
                html += `<strong>Location: ${d.city !== 'unknown' ? d.city : 'Unknown'}</strong><hr style="margin: 4px 0; border-color: #333;">`;
                d.routers.sort((a, b) => a.ttl - b.ttl).forEach(router => {
                    html += `TTL: ${router.ttl.toString().padStart(2, '0')} | IP: ${router.hop_ip.padStart(12," ")} | dIP: ${router.target}<br>`;
                });
                
                html += `</div>`;
                return html;
            })
            // --- COUNTRY BORDERS CONFIGURATION ---
            .polygonCapColor(() => 'rgba(0, 0, 0, 0)')   // Completely transparent surface
            .polygonSideColor(() => 'rgba(0, 0, 0, 0)')  // Completely transparent sides
            .polygonStrokeColor(() => 'rgba(255, 255, 255, 0.15)') // Faint grey/white borders
            .polygonAltitude(0.0001)
            
            // --- CITY LABELS CONFIGURATION ---
            .labelLat(d => d.properties.latitude)
            .labelLng(d => d.properties.longitude)
            .labelText(d => d.properties.nameascii)
            .labelSize(0.15)                               // Even smaller text
            .labelDotRadius(0.05)                          // Barely visible pinpoint
            .labelColor(() => 'rgba(255, 255, 255, 0.3)')  // Highly faded (30% opacity)
            .labelResolution(2)
            .labelAltitude(0.005)

            // --- ASYNC DATA FETCHING ---
            // 1. Fetch Country Borders (Natural Earth GeoJSON)
            fetch('https://unpkg.com/globe.gl/example/datasets/ne_110m_admin_0_countries.geojson')
                .then(res => res.json())
                .then(countries => {
                    this.world.polygonsData(countries.features);
                });

            // 2. Fetch Major World Cities (Natural Earth GeoJSON)
            fetch('https://unpkg.com/globe.gl/example/datasets/ne_110m_populated_places_simple.geojson')
                .then(res => res.json())
                .then(places => {
                    this.world.labelsData(places.features);
                });

            // Auto-resize on window resize
            window.addEventListener('resize', () => {
                this.world.width(window.innerWidth);
                this.world.height(window.innerHeight);
            });
    }

    renderArcs(arcList) {
        this.world.arcsData(arcList);
    }

    renderActiveHops(groupedData) {
        this.world.pointsData(groupedData);
    }
}