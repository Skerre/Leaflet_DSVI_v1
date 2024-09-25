
// main.js

// Import the loadTiff function
import { loadTiff } from './tiffloader.js';
// Import the GeoJSON layer functions from geojsonLayers.js
//import { loadGeoJsonLayer, loadPointLayer } from './GeoJson_funcs.js';
// Import the Basemaps from basemaps.js
import { basemaps, addDefaultBasemap, BasemapControl } from './basemaps.js';

// Initialize the map centered on Mali with the default basemap (OSM)
const map = L.map('map').setView([17.5707, -3.9962], 6); // Center on Mali with a zoom level of 6

// Add the default basemap on map load
addDefaultBasemap(map);

// Create a custom icon using an image
// const customIcon = L.icon({
//     iconUrl: 'assets/catinglass.png', // Path to your image
//     iconSize: [200, 200], // Size of the icon [width, height]
//     iconAnchor: [100, 0], // Anchor point of the icon [x, y] relative to its size
//     popupAnchor: [0, 0] // Position of the popup anchor relative to the icon anchor
// });

// // Add a marker with the custom icon at the specified coordinates
// const marker = L.marker([41.0738487, 28.9548261], { icon: customIcon }).addTo(map);
// // Optional: Bind a popup or tooltip to the marker
// marker.bindPopup("hahahahhahaha.").openPopup();

// Add the custom basemap control to the map
map.addControl(new BasemapControl());

// Define layer variables globally
let geoJsonLayer, pointLayer
const tiffLayers = {}; // Object to store TIFF layers with their identifiers

// Load GeoJSON layers with tooltips
// Load the GeoJSON data but don't add them to the map immediately
loadGeoJsonLayer(map);
loadPointLayer(map);


//Function to load GeoJSON data for the vector layer
function loadGeoJsonLayer() {
    fetch('data/sample.geojson')
        .then(response => response.json())
        .then(data => {
            geoJsonLayer = L.geoJSON(data);
        });
}

//Function to load GeoJSON points as a point layer
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

// Function to update the opacity percentage display
function updateOpacityValue(slider, display) {
    const value = Math.round(slider.value * 100); // Convert to percentage
    display.textContent = `${value}%`; // Update the text content
}

// Add event listeners to update opacity percentage display when sliders are moved
document.getElementById('geojsonOpacity').addEventListener('input', function () {
    updateOpacityValue(this, document.getElementById('geojsonOpacityValue'));
    if (geoJsonLayer) {
        geoJsonLayer.setStyle({ fillOpacity: this.value, opacity: this.value });
    }
});

document.getElementById('tiffOpacity1').addEventListener('input', function () {
    updateOpacityValue(this, document.getElementById('tiffOpacityValue1'));
    if (tiffLayers['tiffLayer1']) {
        tiffLayers['tiffLayer1'].setOpacity(this.value);
    }
});

document.getElementById('tiffOpacity2').addEventListener('input', function () {
    updateOpacityValue(this, document.getElementById('tiffOpacityValue2'));
    if (tiffLayers['tiffLayer2']) {
        tiffLayers['tiffLayer2'].setOpacity(this.value);
    }
});

document.getElementById('pointOpacity').addEventListener('input', function () {
    updateOpacityValue(this, document.getElementById('pointOpacityValue'));
    if (pointLayer) {
        pointLayer.setStyle({ fillOpacity: this.value, opacity: this.value });
    }
});

//LAST

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
// Event listeners for toggling layers on and off
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


// NEW
// // Event listener for toggling the vector layer
// document.getElementById('toggleVectorLayer').addEventListener('change', function () {
//     if (this.checked) {
//         if (geoJsonLayer) {
//             geoJsonLayer.addTo(map); // Add the layer to the map when checked
//         } else {
//             console.error('Vector layer not loaded yet.');
//         }
//     } else {
//         if (geoJsonLayer) {
//             map.removeLayer(geoJsonLayer); // Remove the layer when unchecked
//         }
//     }
// });

// // Event listener for toggling the point layer
// document.getElementById('togglePointLayer').addEventListener('change', function () {
//     if (this.checked) {
//         if (pointLayer) {
//             pointLayer.addTo(map); // Add the layer to the map when checked
//         } else {
//             console.error('Point layer not loaded yet.');
//         }
//     } else {
//         if (pointLayer) {
//             map.removeLayer(pointLayer); // Remove the layer when unchecked
//         }
//     }
// });

// Event listener for GeoJSON layer opacity slider
document.getElementById('geojsonOpacity').addEventListener('input', function () {
    if (geoJsonLayer) {
        geoJsonLayer.setStyle({ fillOpacity: this.value, opacity: this.value });
    }
});


// Event listener for Point Layer opacity slider
document.getElementById('pointOpacity').addEventListener('input', function () {
    if (pointLayer) {
        pointLayer.setStyle({ fillOpacity: this.value, opacity: this.value });
    }
});

// Generic function to handle TIFF layer toggling
function handleTiffLayerToggle(layerName, url, opacitySliderId) {
    document.getElementById(layerName).addEventListener('change', async function () {
        if (this.checked) {
            if (!tiffLayers[layerName]) {
                await loadTiff(url, layerName, tiffLayers, map); // Call the external function
            } else {
                tiffLayers[layerName].addTo(map);
            }
        } else if (tiffLayers[layerName]) {
            map.removeLayer(tiffLayers[layerName]);
        }
    });


    // Event listener for TIFF layer opacity slider
    document.getElementById(opacitySliderId).addEventListener('input', function () {
        if (tiffLayers[layerName]) {
            tiffLayers[layerName].setOpacity(this.value);
        }
    });
}

// Example of how to set up multiple TIFF layers with different files and sliders
// handleTiffLayerToggle('tiffLayer1', 'data/cell3.tif', 'tiffOpacity1');
// handleTiffLayerToggle('tiffLayer2', 'data/pop3.tif', 'tiffOpacity2');


// Event listener for the first TIFF layer
document.getElementById('tiffLayer1').addEventListener('change', async function () {
    if (this.checked) {
        if (!tiffLayers['tiffLayer1']) {
            // Load the TIFF layer if it hasn't been loaded yet
            await loadTiff('data/cell3.tif', 'tiffLayer1', tiffLayers, map);
            tiffLayers['tiffLayer1'].addTo(map);
            // Update the legend specifically for this raster layer
            updateLegend('Sample TIFF Layer 1', ['#000', '#00f', '#ff0'], 'This raster layer shows data with a black to yellow color gradient representing various data values.');
        } else {
            // Add the existing layer to the map
            tiffLayers['tiffLayer1'].addTo(map);
            updateLegend('Sample TIFF Layer 1', ['#000', '#00f', '#ff0'], 'This raster layer shows data with a black to yellow color gradient representing various data values.');
        }
    } else if (tiffLayers['tiffLayer1']) {
        // Remove the layer from the map if it exists
        map.removeLayer(tiffLayers['tiffLayer1']);
        hideLegend(); // Revert the legend to its default state
        tiffLayers['tiffLayer1'] = null; // Clear the reference to ensure it doesn't persist
    }
});

// Event listener for the second TIFF layer
document.getElementById('tiffLayer2').addEventListener('change', async function () {
    if (this.checked) {
        if (!tiffLayers['tiffLayer2']) {
            // Load the TIFF layer if it hasn't been loaded yet
            await loadTiff('data/pop3.tif', 'tiffLayer2', tiffLayers, map);
            tiffLayers['tiffLayer2'].addTo(map);
            // Update the legend specifically for this raster layer
            updateLegend('Sample TIFF Layer 2', ['#000', '#00f', '#ff0'], 'This raster layer shows data with a color gradient, reflecting different data intensities.');
        } else {
            // Add the existing layer to the map
            tiffLayers['tiffLayer2'].addTo(map);
            updateLegend('Sample TIFF Layer 2', ['#000', '#00f', '#ff0'], 'This raster layer shows data with a color gradient, reflecting different data intensities.');
        }
    } else if (tiffLayers['tiffLayer2']) {
        // Remove the layer from the map if it exists
        map.removeLayer(tiffLayers['tiffLayer2']);
        hideLegend(); // Revert the legend to its default state
        tiffLayers['tiffLayer2'] = null; // Clear the reference to ensure it doesn't persist
    }
});


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


//
// ADDED NEWLY 24.09
//

// Function to initialize the legend with default content
function initializeLegend() {
    const legend = document.getElementById('legend');
    legend.innerHTML = `
        <h4>Map Legend</h4>
        <p>Activate layers to view more information.</p>
        <div class="color-scheme">
            <p>No active layers</p>
        </div>
    `;
    legend.style.display = 'block'; // Ensure the legend is visible by default
}

// Call the initializeLegend function on map load
initializeLegend();

// Function to update the legend content dynamically for active layers
function updateLegend(layerName, colorScheme, description) {
    const legend = document.getElementById('legend');
    legend.innerHTML = `
        <h4>${layerName}</h4>
        <p>${description}</p>
        <div class="color-scheme">
            <p>Color Scheme:</p>
            <div class="color-boxes">
                ${colorScheme.map(color => `<div style="background:${color}; width:20px; height:20px; display:inline-block; margin:0 5px;"></div>`).join('')}
            </div>
        </div>
    `;
    legend.style.display = 'block'; // Ensure the legend remains visible
}

// Function to revert the legend to its default state when no layers are active
function hideLegend() {
    const legend = document.getElementById('legend');
    legend.innerHTML = `
        <h4>Map Legend</h4>
        <p>Activate layers to view more information.</p>
        <div class="color-scheme">
            <p>No active layers</p>
        </div>
    `;
}

// Example usage for GeoJSON layer (you can expand for other layers)
document.getElementById('geojsonLayer').addEventListener('change', function () {
    if (this.checked) {
        if (!geoJsonLayer) {
            loadGeoJsonLayer();
            setTimeout(() => {
                geoJsonLayer.addTo(map);
                updateLegend('GeoJSON Layer', ['#ff7800', '#000'], 'This layer shows vector data with orange markers.');
            }, 500);
        } else {
            geoJsonLayer.addTo(map);
            updateLegend('GeoJSON Layer', ['#ff7800', '#000'], 'This layer shows vector data with orange markers.');
        }
    } else if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
        hideLegend();
    }
});