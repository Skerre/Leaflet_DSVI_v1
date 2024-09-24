
// Initialize the map centered on Mali with an appropriate zoom level
const map = L.map('map').setView([17.5707, -3.9962], 6);

// Add a base map layer (OpenStreetMap in this case)
const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Define global variables for layers
let geoJsonLayer, pointLayer;
const tiffLayers = {}; // Object to store TIFF layers with their identifiers

// Create a dynamic legend control and add it to the map
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = '<h4>Layer Legend</h4><p>Select a layer to see details</p>';
    return div;
};

// Add the legend to the map
legend.addTo(map);

// Function to update the legend with layer information
function updateLegend(layerName, description) {
    const legendDiv = document.querySelector('.legend');
    legendDiv.innerHTML = `<h4>${layerName}</h4><p>${description}</p>`;
}

// Sample descriptions for layers
const layerDescriptions = {
    'GeoJSON Layer': 'This layer shows vector data with different color points representing various data categories.',
    'Sample TIFF Layer 1': 'This raster layer uses a color ramp from black (low values) to blue and yellow (high values).',
    'Sample TIFF Layer 2': 'This raster layer displays environmental data with values ranging from cool colors to warm colors.',
    'Point Layer': 'Displays point data with orange markers, representing different locations of interest.',
};

// Event listeners to update the legend when a layer is toggled
document.getElementById('geojsonLayer').addEventListener('change', function () {
    if (this.checked) {
        updateLegend('GeoJSON Layer', layerDescriptions['GeoJSON Layer']);
        if (!geoJsonLayer) {
            loadGeoJsonLayer();
            setTimeout(() => { geoJsonLayer.addTo(map); }, 500);
        } else {
            geoJsonLayer.addTo(map);
        }
    } else if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
        updateLegend('Layer Legend', 'Select a layer to see details');
    }
});

document.getElementById('pointLayer').addEventListener('change', function () {
    if (this.checked) {
        updateLegend('Point Layer', layerDescriptions['Point Layer']);
        if (!pointLayer) {
            loadPointLayer();
            setTimeout(() => { pointLayer.addTo(map); }, 500);
        } else {
            pointLayer.addTo(map);
        }
    } else if (pointLayer) {
        map.removeLayer(pointLayer);
        updateLegend('Layer Legend', 'Select a layer to see details');
    }
});

// Function to load and display TIFF layers with descriptions in the legend
function handleTiffLayerToggle(layerName, url, description, opacitySliderId) {
    document.getElementById(layerName).addEventListener('change', async function () {
        if (this.checked) {
            updateLegend(description.name, description.text);
            if (!tiffLayers[layerName]) {
                await loadTiff(url, layerName);
                tiffLayers[layerName].addTo(map);
            } else {
                tiffLayers[layerName].addTo(map);
            }
        } else if (tiffLayers[layerName]) {
            map.removeLayer(tiffLayers[layerName]);
            updateLegend('Layer Legend', 'Select a layer to see details');
        }
    });

    document.getElementById(opacitySliderId).addEventListener('input', function () {
        if (tiffLayers[layerName]) {
            tiffLayers[layerName].setOpacity(this.value);
        }
    });
}

// Example of setting up multiple TIFF layers with legend descriptions
handleTiffLayerToggle('tiffLayer1', 'data/cell3.tif', {
    name: 'Sample TIFF Layer 1',
    text: layerDescriptions['Sample TIFF Layer 1']
}, 'tiffOpacity1');

handleTiffLayerToggle('tiffLayer2', 'data/pop3.tiff', {
    name: 'Sample TIFF Layer 2',
    text: layerDescriptions['Sample TIFF Layer 2']
}, 'tiffOpacity2');

// Function to update the opacity percentage display
function updateOpacityValue(slider, display) {
    const value = Math.round(slider.value * 100); // Convert to percentage
    display.textContent = `${value}%`; // Update the text content
}

// Add event listeners to update opacity percentage display when sliders are moved
document.getElementById('geojsonOpacity').addEventListener('input', function () {
    updateOpacityValue(this, document.getElementById('geojsonOpacityValue'));
    if (geoJsonLayer) {
        geoJsonLayer.setStyle({ fillOpacity: parseFloat(this.value), opacity: parseFloat(this.value) });
    }
});

document.getElementById('tiffOpacity1').addEventListener('input', function () {
    updateOpacityValue(this, document.getElementById('tiffOpacityValue1'));
    if (tiffLayers['tiffLayer1']) {
        tiffLayers['tiffLayer1'].setOpacity(parseFloat(this.value));
    }
});

document.getElementById('tiffOpacity2').addEventListener('input', function () {
    updateOpacityValue(this, document.getElementById('tiffOpacityValue2'));
    if (tiffLayers['tiffLayer2']) {
        tiffLayers['tiffLayer2'].setOpacity(parseFloat(this.value));
    }
});

document.getElementById('pointOpacity').addEventListener('input', function () {
    updateOpacityValue(this, document.getElementById('pointOpacityValue'));
    if (pointLayer) {
        pointLayer.setStyle({ fillOpacity: parseFloat(this.value), opacity: parseFloat(this.value) });
    }
});

// Initialize the percentage display values correctly on page load
function initializeOpacityValues() {
    updateOpacityValue(document.getElementById('geojsonOpacity'), document.getElementById('geojsonOpacityValue'));
    updateOpacityValue(document.getElementById('tiffOpacity1'), document.getElementById('tiffOpacityValue1'));
    updateOpacityValue(document.getElementById('tiffOpacity2'), document.getElementById('tiffOpacityValue2'));
    updateOpacityValue(document.getElementById('pointOpacity'), document.getElementById('pointOpacityValue'));
}

// Call the initialization function when the page loads
initializeOpacityValues();
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
    tiffLayers[layerName] = L.imageOverlay(imgUrl, bounds, { opacity: 1 }); // Store the layer with default opacity
}

// Load all necessary vector layers initially
loadGeoJsonLayer();
loadPointLayer();