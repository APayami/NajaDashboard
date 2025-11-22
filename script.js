// Mock crime data - coordinates and intensity (FORECASTED, not historical)
let crimeData = [];
let filteredCrimeData = [];
let routes = [];
let heatLayer = null;
let routeLayers = [];
let regionLayers = [];
let map;
let selectedRegion = null;
let isMapLocked = false;

// Tehran Municipality Regions with boundaries (polygons)
const tehranRegions = {
    'all': {
        name: 'همه مناطق',
        bounds: [[35.55, 51.20], [35.85, 51.65]], // Full Tehran bounds
        polygon: null
    },
    'downtown': {
        name: 'منطقه ۱۲ (مرکز شهر)',
        bounds: [[35.67, 51.35], [35.71, 51.43]],
        polygon: [
            [35.67, 51.35], [35.71, 51.35], [35.71, 51.43], [35.67, 51.43], [35.67, 51.35]
        ],
        center: [35.6892, 51.3890]
    },
    'north': {
        name: 'منطقه ۱ (شمال)',
        bounds: [[35.78, 51.38], [35.85, 51.50]],
        polygon: [
            [35.78, 51.38], [35.85, 51.38], [35.85, 51.50], [35.78, 51.50], [35.78, 51.38]
        ],
        center: [35.8150, 51.4400]
    },
    'south': {
        name: 'منطقه ۲۰ (جنوب)',
        bounds: [[35.55, 51.30], [35.62, 51.45]],
        polygon: [
            [35.55, 51.30], [35.62, 51.30], [35.62, 51.45], [35.55, 51.45], [35.55, 51.30]
        ],
        center: [35.5850, 51.3750]
    },
    'east': {
        name: 'منطقه ۸ (شرق)',
        bounds: [[35.70, 51.45], [35.78, 51.55]],
        polygon: [
            [35.70, 51.45], [35.78, 51.45], [35.78, 51.55], [35.70, 51.55], [35.70, 51.45]
        ],
        center: [35.7400, 51.5000]
    },
    'west': {
        name: 'منطقه ۹ (غرب)',
        bounds: [[35.65, 51.20], [35.72, 51.32]],
        polygon: [
            [35.65, 51.20], [35.72, 51.20], [35.72, 51.32], [35.65, 51.32], [35.65, 51.20]
        ],
        center: [35.6850, 51.2600]
    }
};

// Initialize map
function initMap() {
    // Tehran coordinates: 35.6892° N, 51.3890° E
    map = L.map('map').setView([35.6892, 51.3890], 12);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Draw region boundaries
    drawRegionBoundaries();
    
    // Generate forecasted crime data
    generateForecastedCrimeData();
    
    // Initialize heatmap
    updateHeatmap();
}

// Draw municipality region boundaries on map
function drawRegionBoundaries() {
    regionLayers = []; // Reset region layers
    Object.entries(tehranRegions).forEach(([key, region]) => {
        if (key !== 'all' && region.polygon) {
            const polygon = L.polygon(region.polygon, {
                color: '#666',
                weight: 2,
                opacity: 0.6,
                fillColor: 'transparent',
                fillOpacity: 0.1
            }).addTo(map);
            
            // Add region label
            const center = region.center || [
                region.polygon[0][0] + (region.polygon[2][0] - region.polygon[0][0])/2,
                region.polygon[0][1] + (region.polygon[2][1] - region.polygon[0][1])/2
            ];
            
            const label = L.marker(center, {
                icon: L.divIcon({
                    className: 'region-label',
                    html: `<div style="background: rgba(255,255,255,0.9); padding: 3px 8px; border-radius: 4px; font-size: 11px; border: 1px solid #666; font-weight: bold; direction: rtl;">${region.name}</div>`,
                    iconSize: [120, 20],
                    iconAnchor: [60, 10]
                })
            }).addTo(map);
            
            regionLayers.push(polygon, label);
        }
    });
}

// Generate FORECASTED crime data (not historical) based on Tehran municipality regions
function generateForecastedCrimeData() {
    // Forecast data for different regions - these are predicted risks, not historical events
    const forecastData = {
        downtown: { 
            center: [35.6892, 51.3890], 
            spread: 0.025, 
            count: 180,
            riskLevel: 0.8 // High risk area
        },
        north: { 
            center: [35.8150, 51.4400], 
            spread: 0.035, 
            count: 95,
            riskLevel: 0.5 // Medium-low risk
        },
        south: { 
            center: [35.5850, 51.3750], 
            spread: 0.035, 
            count: 165,
            riskLevel: 0.85 // Very high risk
        },
        east: { 
            center: [35.7400, 51.5000], 
            spread: 0.035, 
            count: 140,
            riskLevel: 0.65 // Medium-high risk
        },
        west: { 
            center: [35.6850, 51.2600], 
            spread: 0.035, 
            count: 120,
            riskLevel: 0.7 // Medium-high risk
        }
    };
    
    crimeData = [];
    
    // Generate forecasted crime risk points (predicted hotspots, not historical incidents)
    for (const [district, config] of Object.entries(forecastData)) {
        const region = tehranRegions[district];
        if (!region || !region.polygon) continue;
        
        for (let i = 0; i < config.count; i++) {
            // Generate points within region boundaries
            let lat, lng;
            let attempts = 0;
            do {
                lat = config.center[0] + (Math.random() - 0.5) * config.spread;
                lng = config.center[1] + (Math.random() - 0.5) * config.spread;
                attempts++;
            } while (attempts < 50 && !isPointInPolygon([lat, lng], region.polygon));
            
            // Forecasted risk intensity based on area risk level + some variation
            const baseIntensity = config.riskLevel;
            const intensity = Math.min(1.0, baseIntensity + (Math.random() - 0.5) * 0.3);
            
            // Time period for forecast - distribute across different time ranges
            // This ensures data shows up regardless of time filter selection
            const timeDistributions = [
                { range: [0, 24], weight: 0.3 },      // Next 24 hours - 30%
                { range: [24, 168], weight: 0.4 },    // Next 7 days - 40%
                { range: [168, 720], weight: 0.3 }    // Next 30 days - 30%
            ];
            
            // Select time range based on weight
            const rand = Math.random();
            let selectedRange;
            if (rand < 0.3) {
                selectedRange = timeDistributions[0];
            } else if (rand < 0.7) {
                selectedRange = timeDistributions[1];
            } else {
                selectedRange = timeDistributions[2];
            }
            
            // Random time within selected range
            const minHours = selectedRange.range[0];
            const maxHours = selectedRange.range[1];
            const forecastHours = minHours + Math.random() * (maxHours - minHours);
            
            // Distribute across different times of day (morning, afternoon, evening, night)
            // This ensures data shows up regardless of time of day filter
            const timeOfDayDistributions = [
                { range: [6, 12], name: 'morning' },    // Morning: 6-12
                { range: [12, 18], name: 'afternoon' }, // Afternoon: 12-18
                { range: [18, 24], name: 'evening' },   // Evening: 18-24
                { range: [0, 6], name: 'night' }        // Night: 0-6
            ];
            
            // Select time of day (distribute evenly)
            const timeOfDayIndex = Math.floor(Math.random() * timeOfDayDistributions.length);
            const selectedTimeOfDay = timeOfDayDistributions[timeOfDayIndex];
            const hourInDay = selectedTimeOfDay.range[0] + 
                             Math.random() * (selectedTimeOfDay.range[1] - selectedTimeOfDay.range[0]);
            
            // Create forecast time with specific hour
            const forecastTime = new Date(Date.now() + forecastHours * 60 * 60 * 1000);
            forecastTime.setHours(Math.floor(hourInDay), Math.floor((hourInDay % 1) * 60), 0, 0);
            
            crimeData.push({
                lat,
                lng,
                intensity: Math.max(0.2, intensity), // Minimum 0.2 intensity
                district,
                forecastTime: forecastTime, // This is a forecast, not historical
                riskType: ['سرقت', 'نزاع و درگیری', 'زورگیری'][Math.floor(Math.random() * 3)],
                probability: Math.floor(intensity * 100) // Probability percentage
            });
        }
    }
    
    filteredCrimeData = [...crimeData];
}

// Check if point is inside polygon
function isPointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// Update heatmap based on filtered data
function updateHeatmap() {
    // Remove existing heat layer
    if (heatLayer) {
        map.removeLayer(heatLayer);
    }
    
    // Prepare heat data
    const heatData = filteredCrimeData.map(crime => [
        crime.lat,
        crime.lng,
        crime.intensity
    ]);
    
    // Create new heat layer with stronger, more intense colors
    heatLayer = L.heatLayer(heatData, {
        radius: 30,
        blur: 20,
        maxZoom: 17,
        max: 1.0,
        gradient: {
            0.0: 'rgba(0, 255, 0, 0.4)',      // Green - lighter intensity
            0.2: 'rgba(255, 255, 0, 0.6)',    // Yellow - medium-low
            0.4: 'rgba(255, 165, 0, 0.8)',    // Orange - medium
            0.6: 'rgba(255, 69, 0, 0.9)',     // Red-orange - medium-high
            0.8: 'rgba(255, 0, 0, 1.0)',      // Red - high intensity
            1.0: 'rgba(139, 0, 0, 1.0)'       // Dark red - very high intensity
        }
    }).addTo(map);
    
    // Update statistics
    updateStatistics();
}

// Update statistics display
function updateStatistics() {
    document.getElementById('totalIncidents').textContent = filteredCrimeData.length;
    document.getElementById('activePatrols').textContent = routes.length;
}

// Convert Jalali date string (1404-02-20) to Gregorian Date object
function jalaliToGregorian(jalaliDateStr, timeStr = '00:00') {
    if (!jalaliDateStr) return null;
    
    // Parse Jalali date: YYYY-MM-DD
    const parts = jalaliDateStr.split('-');
    if (parts.length !== 3) return null;
    
    const jalaliYear = parseInt(parts[0]);
    const jalaliMonth = parseInt(parts[1]);
    const jalaliDay = parseInt(parts[2]);
    
    // Parse time: HH:MM
    const timeParts = timeStr.split(':');
    const hours = timeParts[0] ? parseInt(timeParts[0]) : 0;
    const minutes = timeParts[1] ? parseInt(timeParts[1]) : 0;
    
    // Convert Jalali to Gregorian using PersianDate library
    if (typeof persianDate !== 'undefined') {
        const pd = persianDate([jalaliYear, jalaliMonth, jalaliDay]);
        const gregorianDate = pd.toCalendar('gregory').toDate();
        // Set time
        gregorianDate.setHours(hours, minutes, 0, 0);
        return gregorianDate;
    } else {
        // Fallback: simple conversion (approximate)
        // Jalali year is about 621 years ahead of Gregorian
        const gregorianYear = jalaliYear - 621;
        const gregorianDate = new Date(gregorianYear, jalaliMonth - 1, jalaliDay, hours, minutes);
        return gregorianDate;
    }
}

// Convert Gregorian Date to Jalali string (1404-02-20)
function gregorianToJalali(date) {
    if (!date) return '';
    const pd = persianDate(date);
    const jalali = pd.toCalendar('persian');
    const year = jalali.year();
    const month = String(jalali.month()).padStart(2, '0');
    const day = String(jalali.date()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Apply filters
function applyFilters() {
    const placeFilter = document.getElementById('placeFilter').value;
    const selectedDateJalali = document.getElementById('selectedDate').value;
    const timeOfDayFilter = document.getElementById('timeOfDayFilter').value;
    const crimeTypeFilter = document.getElementById('crimeTypeFilter').value;
    
    // Handle region selection and map locking
    if (placeFilter !== 'all') {
        selectedRegion = tehranRegions[placeFilter];
        lockMapToRegion(selectedRegion);
    } else {
        selectedRegion = null;
        unlockMap();
    }
    
    filteredCrimeData = crimeData.filter(crime => {
        // Place filter - ensure points are within selected region
        if (placeFilter !== 'all') {
            if (crime.district !== placeFilter) {
                return false;
            }
            // Double check point is in polygon
            if (selectedRegion && selectedRegion.polygon) {
                if (!isPointInPolygon([crime.lat, crime.lng], selectedRegion.polygon)) {
                    return false;
                }
            }
        }
        
        // Date filter (for forecasted times)
        let timeValid = true;
        
        if (selectedDateJalali) {
            const selectedDateTime = jalaliToGregorian(selectedDateJalali, '00:00');
            if (selectedDateTime) {
                // Show data for the selected date (24 hour window)
                const startOfDay = new Date(selectedDateTime);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(selectedDateTime);
                endOfDay.setHours(23, 59, 59, 999);
                // Add some buffer to ensure data shows
                const buffer = 12 * 60 * 60 * 1000; // 12 hour buffer on each side
                timeValid = crime.forecastTime >= new Date(startOfDay.getTime() - buffer) && 
                           crime.forecastTime <= new Date(endOfDay.getTime() + buffer);
            }
        } else {
            // If no date selected, show all forecasted data (future dates)
            const now = new Date();
            timeValid = crime.forecastTime >= now;
        }
        
        if (!timeValid) return false;
        
        // Crime type filter
        if (crimeTypeFilter !== 'all') {
            if (crime.riskType !== crimeTypeFilter) {
                return false;
            }
        }
        
        // Time of day filter (for forecasted time) - more lenient to show adjacent hours
        if (timeOfDayFilter !== 'all') {
            const hour = crime.forecastTime.getHours();
            let timeOfDayValid = false;
            
            switch (timeOfDayFilter) {
                case 'morning':
                    // Morning: 6-12, but also show 4-14 for better visibility
                    timeOfDayValid = (hour >= 4 && hour < 14);
                    break;
                case 'afternoon':
                    // Afternoon: 12-18, but also show 10-20 for better visibility
                    timeOfDayValid = (hour >= 10 && hour < 20);
                    break;
                case 'evening':
                    // Evening: 18-24, but also show 16-2 (next day) for better visibility
                    timeOfDayValid = (hour >= 16 || hour < 2);
                    break;
                case 'night':
                    // Night: 0-6, but also show 22-8 for better visibility
                    timeOfDayValid = (hour >= 22 || hour < 8);
                    break;
            }
            
            if (!timeOfDayValid) return false;
        }
        
        return true;
    });
    
    updateHeatmap();
}

// Lock map view to selected region (disable zoom/pan)
function lockMapToRegion(region) {
    if (!region || !region.bounds) return;
    
    isMapLocked = true;
    
    // Set map bounds to region
    map.fitBounds(region.bounds, {
        padding: [50, 50],
        maxZoom: 14
    });
    
    // Disable dragging
    map.dragging.disable();
    
    // Disable touch zoom
    map.touchZoom.disable();
    
    // Disable double click zoom
    map.doubleClickZoom.disable();
    
    // Disable scroll wheel zoom
    map.scrollWheelZoom.disable();
    
    // Disable box zoom
    map.boxZoom.disable();
    
    // Disable keyboard
    map.keyboard.disable();
    
    // Disable zoom controls
    if (map.zoomControl) {
        map.zoomControl.remove();
    }
    
    // Show lock notice
    const lockNotice = document.getElementById('mapLockNotice');
    if (lockNotice) {
        lockNotice.style.display = 'block';
    }
}

// Unlock map (enable all interactions)
function unlockMap() {
    if (!isMapLocked && map.zoomControl) return; // Already unlocked and has zoom control
    
    isMapLocked = false;
    
    // Enable all interactions
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    
    // Re-enable zoom controls if not already present
    if (!map.zoomControl) {
        map.addControl(L.control.zoom());
    }
    
    // Hide lock notice
    const lockNotice = document.getElementById('mapLockNotice');
    if (lockNotice) {
        lockNotice.style.display = 'none';
    }
}

// Reset filters
function resetFilters() {
    document.getElementById('placeFilter').value = 'all';
    document.getElementById('selectedDate').value = '';
    document.getElementById('timeOfDayFilter').value = 'all';
    document.getElementById('crimeTypeFilter').value = 'all';
    
    // Unlock map
    selectedRegion = null;
    unlockMap();
    
    // Reset map view to full Tehran
    map.fitBounds(tehranRegions['all'].bounds, {
        padding: [20, 20]
    });
    
    filteredCrimeData = [...crimeData];
    updateHeatmap();
}


// Calculate patrol routes using k-means clustering approach - only within selected region
function calculatePatrolRoutes() {
    const patrolCount = parseInt(document.getElementById('patrolCount').value) || 3;
    
    if (filteredCrimeData.length === 0) {
        alert('داده جرمی موجود نیست. لطفاً فیلترها را تنظیم کنید.');
        return;
    }
    
    // Clear existing routes
    clearRoutes();
    
    // Get region bounds - use selected region if one is selected, otherwise use all filtered data bounds
    let routeBounds;
    let routePolygon = null;
    
    if (selectedRegion && selectedRegion.bounds && selectedRegion.polygon) {
        // Use selected region's bounds
        routeBounds = L.latLngBounds(selectedRegion.bounds);
        routePolygon = selectedRegion.polygon;
    } else {
        // Use bounds of filtered crime data
        if (filteredCrimeData.length === 0) {
            alert('داده جرمی موجود نیست. لطفاً فیلترها را تنظیم کنید.');
            return;
        }
        const lats = filteredCrimeData.map(c => c.lat);
        const lngs = filteredCrimeData.map(c => c.lng);
        routeBounds = L.latLngBounds(
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
        );
    }
    
    // Filter points to only those within the region bounds/polygon
    let points = filteredCrimeData.map(crime => ({
        lat: crime.lat,
        lng: crime.lng,
        intensity: crime.intensity
    }));
    
    // If region is selected, ensure all points are within the polygon
    if (routePolygon) {
        points = points.filter(point => 
            isPointInPolygon([point.lat, point.lng], routePolygon)
        );
    }
    
    if (points.length === 0) {
        alert('نقاط ریسک در این منطقه یافت نشد.');
        return;
    }
    
    // Get bounds from filtered points
    const latMin = Math.min(...points.map(p => p.lat));
    const latMax = Math.max(...points.map(p => p.lat));
    const lngMin = Math.min(...points.map(p => p.lng));
    const lngMax = Math.max(...points.map(p => p.lng));
    
    // Calculate grid dimensions based on route bounds
    const cols = Math.ceil(Math.sqrt(patrolCount));
    const rows = Math.ceil(patrolCount / cols);
    
    const latSpan = latMax - latMin;
    const lngSpan = lngMax - lngMin;
    
    const cellLat = latSpan / rows;
    const cellLng = lngSpan / cols;
    
    routes = [];
    
    for (let i = 0; i < patrolCount; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Calculate cell center within route bounds
        const cellCenterLat = latMin + (row + 0.5) * cellLat;
        const cellCenterLng = lngMin + (col + 0.5) * cellLng;
        
        // Ensure cell center is within region polygon if region is selected
        if (routePolygon && !isPointInPolygon([cellCenterLat, cellCenterLng], routePolygon)) {
            // Skip this cell if outside polygon
            continue;
        }
        
        // Find crimes in this cell with high intensity
        const cellCrimes = points.filter(point => {
            const latDiff = Math.abs(point.lat - cellCenterLat);
            const lngDiff = Math.abs(point.lng - cellCenterLng);
            return latDiff <= cellLat / 2 && lngDiff <= cellLng / 2;
        });
        
        // Sort by intensity and pick top locations for route
        cellCrimes.sort((a, b) => b.intensity - a.intensity);
        let routePoints = cellCrimes.slice(0, Math.min(5, cellCrimes.length));
        
        // If no crimes in cell, create a default route around the cell center (only if in polygon)
        if (routePoints.length === 0) {
            if (!routePolygon || isPointInPolygon([cellCenterLat, cellCenterLng], routePolygon)) {
                // Create small route within cell
                const offset = Math.min(cellLat, cellLng) * 0.3;
                routePoints = [
                    { lat: cellCenterLat, lng: cellCenterLng, intensity: 0.3 },
                    { lat: cellCenterLat + offset, lng: cellCenterLng, intensity: 0.3 },
                    { lat: cellCenterLat, lng: cellCenterLng + offset, intensity: 0.3 }
                ];
            } else {
                continue; // Skip if outside region
            }
        }
        
        // Filter route points to ensure they're within polygon
        if (routePolygon) {
            routePoints = routePoints.filter(point =>
                isPointInPolygon([point.lat, point.lng], routePolygon)
            );
            
            if (routePoints.length === 0) continue;
        }
        
        // Store waypoints for routing
        routes.push({
            id: routes.length + 1,
            waypoints: routePoints,
            center: { lat: cellCenterLat, lng: cellCenterLng },
            pointCount: routePoints.length,
            path: null // Will be populated with actual road path
        });
    }
    
    if (routes.length === 0) {
        alert('نتوانست مسیر گشت در محدوده انتخاب شده ایجاد کند.');
        return;
    }
    
    // Get actual road routes for each patrol route
    getRoadRoutes().then(() => {
        visualizeRoutes();
        displayRouteInfo();
    });
}

// Get actual road paths using OSRM routing service
async function getRoadRoutes() {
    // Use OSRM public demo server for routing
    const osrmUrl = 'https://router.project-osrm.org/route/v1/driving/';
    
    for (const route of routes) {
        if (!route.waypoints || route.waypoints.length === 0) {
            continue;
        }
        
        // Create waypoints for routing (longitude, latitude format for OSRM)
        const coordinates = route.waypoints.map(point => `${point.lng},${point.lat}`);
        
        // Add return to start for closed loop
        if (route.waypoints.length > 1) {
            coordinates.push(coordinates[0]); // Return to start
        }
        
        const waypointsStr = coordinates.join(';');
        
        try {
            // Request route from OSRM
            const response = await fetch(`${osrmUrl}${waypointsStr}?overview=full&geometries=geojson`);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                // Extract coordinates from GeoJSON geometry
                const geometry = data.routes[0].geometry;
                
                if (geometry && geometry.coordinates) {
                    // Convert [lng, lat] to [lat, lng] for Leaflet
                    route.path = geometry.coordinates.map(coord => [coord[1], coord[0]]);
                } else {
                    // Fallback to straight line if routing fails
                    route.path = route.waypoints.map(point => [point.lat, point.lng]);
                    if (route.path.length > 1) {
                        route.path.push(route.path[0]); // Close loop
                    }
                }
            } else {
                // Fallback to straight line if routing fails
                route.path = route.waypoints.map(point => [point.lat, point.lng]);
                if (route.path.length > 1) {
                    route.path.push(route.path[0]); // Close loop
                }
            }
        } catch (error) {
            console.warn('Routing failed for route', route.id, error);
            // Fallback to straight line if API call fails
            route.path = route.waypoints.map(point => [point.lat, point.lng]);
            if (route.path.length > 1) {
                route.path.push(route.path[0]); // Close loop
            }
        }
    }
}

// Visualize routes on the map
function visualizeRoutes() {
    const colors = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
        '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
        '#808080', '#000080', '#008000', '#800000', '#008080',
        '#FF1493', '#32CD32', '#FF4500', '#4682B4', '#DC143C'
    ];
    
    routes.forEach((route, index) => {
        if (!route.path || route.path.length === 0) {
            return; // Skip if no path calculated
        }
        
        const color = colors[index % colors.length];
        
        // Draw route polyline along actual roads
        const polyline = L.polyline(route.path, {
            color: color,
            weight: 5,
            opacity: 0.8,
            smoothFactor: 1.0
        }).addTo(map);
        
        // Add start marker at first waypoint (actual checkpoint location)
        const startPoint = route.waypoints && route.waypoints.length > 0 
            ? [route.waypoints[0].lat, route.waypoints[0].lng]
            : route.path[0];
            
        const startMarker = L.marker(startPoint, {
            icon: L.divIcon({
                className: 'route-start-marker',
                html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(map);
        
        startMarker.bindPopup(`<strong>مسیر گشت ${route.id}</strong><br>نقطه شروع`);
        
        // Add route label at center
        const label = L.marker(route.center, {
            icon: L.divIcon({
                className: 'route-label',
                html: `<div style="background: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">مسیر ${route.id}</div>`,
                iconSize: [60, 20],
                iconAnchor: [30, 10]
            })
        }).addTo(map);
        
        routeLayers.push(polyline, startMarker, label);
    });
}

// Display route information
function displayRouteInfo() {
    const routesList = document.getElementById('routesList');
    const routeInfo = document.getElementById('routeInfo');
    
    routesList.innerHTML = '';
    
    routes.forEach(route => {
        const routeItem = document.createElement('div');
        routeItem.className = 'route-item';
        routeItem.innerHTML = `
            <strong>مسیر ${route.id}</strong>
            <span>${route.pointCount} نقطه توقف | فاصله: ~${(route.path.length * 0.5).toFixed(1)} کیلومتر</span>
        `;
        routesList.appendChild(routeItem);
    });
    
    routeInfo.style.display = 'block';
}

// Clear routes from map
function clearRoutes() {
    routeLayers.forEach(layer => map.removeLayer(layer));
    routeLayers = [];
    routes = [];
    
    document.getElementById('routeInfo').style.display = 'none';
    document.getElementById('routesList').innerHTML = '';
    updateStatistics();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    initMap();
    
    // Filter controls
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    
    // Patrol route calculator
    document.getElementById('calculateRoutes').addEventListener('click', calculatePatrolRoutes);
    document.getElementById('clearRoutes').addEventListener('click', clearRoutes);
    
    // Update statistics on load
    updateStatistics();
});

