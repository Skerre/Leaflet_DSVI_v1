// Initialize the map centered on Mali with an appropriate zoom level
const map = L.map('map').setView([17.5707, -3.9962], 6); // Center on Mali with a zoom level of 6

// Add a base map layer (OpenStreetMap in this case)
const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Define layer variables globally
let geoJsonLayer, pointLayer;
const tiffLayers = {}; // Object to store TIFF layers with their identifiers

// Function to load GeoJSON data for the vector layer
function loadGeoJsonLayer() {
    fetch('data/sample.geojson')
        .then(response => response.json())
        .then(data => {
            geoJsonLayer = L.geoJSON(data);
        });
}

// Function to load GeoJSON points as a point layer
function loadPointLayer() {
    fetch('data/sample-points.geojson')
        .then(response => response.json())
        .then(data => {
            pointLayer = L.geoJSON(data, {
                pointToLayer: (feature, latlng) => {
                    return L.circleMarker(latlng, {
                        radius: 5,
                        fillColor: "#ff7800",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                }
            });
        });
}

// General function to load and prepare a TIFF raster layer with automatic bounds detection and color styling
// General function to load and prepare a TIFF raster layer with automatic bounds detection and color styling
async function loadTiff(url, layerName) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();

    // Extract geo-transform and tie points to calculate bounds
    const tiePoint = image.getTiePoints()[0];
    const pixelScale = image.getFileDirectory().ModelPixelScale;

    // Calculate geographic bounds based on tie points and pixel scale
    const minX = tiePoint.x;
    const maxY = tiePoint.y;
    const maxX = minX + pixelScale[0] * image.getWidth();
    const minY = maxY - pixelScale[1] * image.getHeight();

    const bounds = L.latLngBounds([
        [minY, minX], // Bottom-left corner (latitude, longitude)
        [maxY, maxX]  // Top-right corner (latitude, longitude)
    ]);

    const rasterData = await image.readRasters();
    const canvas = document.createElement('canvas');
    canvas.width = image.getWidth();
    canvas.height = image.getHeight();
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(image.getWidth(), image.getHeight());
    const rasterArray = rasterData[0]; // Assume a single-band TIFF

    // Apply color styling based on value ranges and handle NA values
    for (let i = 0; i < rasterArray.length; i++) {
        const value = rasterArray[i];

        // Check for NA value (-1) and set transparency
        if (value === -1) {
            imgData.data[4 * i + 3] = 0; // Set alpha to 0 (fully transparent)
            continue;
        }

        // Apply a color ramp: Black (low values), Blue (mid values), Yellow (high values)
        let r = 0, g = 0, b = 0; // Default to black

        if (value <= 85) { // Map low values to black (0,0,0) to blue (0,0,255)
            r = 0;
            g = 0;
            b = Math.round((value / 85) * 255);
        } else if (value <= 170) { // Map mid values from blue (0,0,255) to yellow (255,255,0)
            r = Math.round(((value - 85) / 85) * 255);
            g = Math.round(((value - 85) / 85) * 255);
            b = 255 - Math.round(((value - 85) / 85) * 255);
        } else { // Map high values from yellow (255,255,0) to white (255,255,255)
            r = 255;
            g = 255;
            b = Math.round(((value - 170) / 85) * 255);
        }

        imgData.data[4 * i + 0] = r; // R
        imgData.data[4 * i + 1] = g; // G
        imgData.data[4 * i + 2] = b; // B
        imgData.data[4 * i + 3] = 255; // A (opaque)
    }

    ctx.putImageData(imgData, 0, 0);

    const imgUrl = canvas.toDataURL();
    tiffLayers[layerName] = L.imageOverlay(imgUrl, bounds); // Store the layer with its identifier
}

// Load all necessary vector layers initially
loadGeoJsonLayer();
loadPointLayer();

// Event listeners for toggling layers on and off
document.getElementById('geojsonLayer').addEventListener('change', function () {
    if (this.checked) {
        if (!geoJsonLayer) {
            loadGeoJsonLayer();
            setTimeout(() => { geoJsonLayer.addTo(map); }, 500);
        } else {
            geoJsonLayer.addTo(map);
        }
    } else if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }
});

document.getElementById('pointLayer').addEventListener('change', function () {
    if (this.checked) {
        if (!pointLayer) {
            loadPointLayer();
            setTimeout(() => { pointLayer.addTo(map); }, 500);
        } else {
            pointLayer.addTo(map);
        }
    } else if (pointLayer) {
        map.removeLayer(pointLayer);
    }
});

// Generic function to handle TIFF layer toggling
function handleTiffLayerToggle(layerName, url) {
    document.getElementById(layerName).addEventListener('change', async function () {
        if (this.checked) {
            if (!tiffLayers[layerName]) {
                await loadTiff(url, layerName); // Load and add the TIFF layer
                tiffLayers[layerName].addTo(map);
            } else {
                tiffLayers[layerName].addTo(map);
            }
        } else if (tiffLayers[layerName]) {
            map.removeLayer(tiffLayers[layerName]);
        }
    });
}

// Example of how to set up multiple TIFF layers with different files
handleTiffLayerToggle('tiffLayer1', 'data/cell3.tif');
handleTiffLayerToggle('tiffLayer2', 'data/finan_4.tif');
handleTiffLayerToggle('tiffLayer3', 'data/pop3.tif');

// Dropdown menu functionality
const dropdownButtons = document.querySelectorAll('.dropdown-btn');
dropdownButtons.forEach(button => {
    button.addEventListener('click', function () {
        this.classList.toggle('active');
        const dropdownContent = this.nextElementSibling;
        if (dropdownContent.style.display === 'block') {
            dropdownContent.style.display = 'none';
        } else {
            dropdownContent.style.display = 'block';
        }
    });
});




