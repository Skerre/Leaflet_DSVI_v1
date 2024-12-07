
// main.js

// Import the loadTiff function
import { loadTiff } from './test_tiff_loader.js';
// Import the GeoJSON layer functions from geojsonLayers.js
// import { loadGeoJsonLayer, styleByMean, tooltipWithMean } from './geojsonLayers.js';

// Import basemap functionality from basemaps.js
import {BasemapControl, addDefaultBasemap } from './basemaps.js';

// Initialize the map centered on Mali with the default basemap (OSM)
const map = L.map('map').setView([17.5707, -3.9962], 6); // Center on Mali with a zoom level of 6
console.log("Map CRS:", map.options.crs.code);    
// Add the default basemap on map load (assuming the addDefaultBasemap function is defined elsewhere)
addDefaultBasemap(map);

// Initialize the basemap selector to handle basemap switching
map.addControl(new BasemapControl());
// Define layer variables globally

const tiffLayers = {}; // Object to store TIFF layers with their identifiers
let pointLayer, geoJsonLayer
// Load GeoJSON layers with tooltips
// Load the GeoJSON data but don't add them to the map immediately
loadGeoJsonLayer(map);
loadPointLayer(map);


const colorScales = {
    tiffLayer1: {
        ranges: [0, 50, 100, 150, 200],
        colors: ['#000000', '#0000FF', '#00FF00', '#FFFF00', '#FF0000'] // Black to Red
    },
    tiffLayer2: {
        ranges: [0, 25, 50, 75, 100],
        colors: ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333'] // White to Dark Gray
    },
    tiffLayer3: {
        ranges: [0, 0.2, 0.4, 0.6, 0.8, 1],
        colors: ['#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'] // Blue to Red
    }
};

//Function to load GeoJSON data for the vector layer
function loadGeoJsonLayer() {
    fetch('data/sample.geojson')
        .then(response => response.json())
        .then(data => {
            geoJsonLayer = L.geoJSON(data, {
                style: (feature) => {
                    // Define default styling for the vector layer
                    return {
                        color: "#3388ff",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.5
                    };
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        const tooltipContent = Object.entries(feature.properties)
                            .map(([key, value]) => `<b>${key}:</b> ${value}`)
                            .join('<br>');
                
                        layer.bindTooltip(tooltipContent, {
                            permanent: false,
                            direction: 'top'
                        });
                    }
                }
            });
        })
        .catch(err => console.error('Error loading GeoJSON layer:', err));
}

//Function to load GeoJSON points as a point layer
// function loadPointLayer() {
//     fetch('data/sample-points.geojson')
//         .then(response => response.json())
//         .then(data => {
//             pointLayer = L.geoJSON(data, {
//                 pointToLayer: (feature, latlng) => {
//                     return L.circleMarker(latlng, {
//                         radius: 5,
//                         fillColor: "#ff7800",
//                         color: "#000",
//                         weight: 1,
//                         opacity: 1,
//                         fillOpacity: 0.8
//                     });
//                 }
//             });
//         });
// }

// Function to update tooltips based on the selected property
function updateTooltip(feature, layer) {
    const selectedProperty = document.getElementById('pointValueSelector').value;

    // Check if the selected property exists in the feature
    if (feature.properties && feature.properties[selectedProperty]) {
        layer.bindTooltip(`Value: ${feature.properties[selectedProperty]}`, {
            permanent: false,
            direction: 'top'
        });
    } else {
        layer.bindTooltip('No value available', {
            permanent: false,
            direction: 'top'
        });
    }
}

// Function to load GeoJSON points as a point layer
function loadPointLayer() {
    fetch('data/sample-points.geojson')
        .then(response => response.json())
        .then(data => {
            // Populate the dropdown with properties from the first feature
            populateDropdown(data);

            // Create the point layer
            pointLayer = L.geoJSON(data, {
                pointToLayer: (feature, latlng) => {
                    // Create a circle marker for each point
                    return L.circleMarker(latlng, {
                        radius: 5,
                        fillColor: "#ff7800",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                },
                onEachFeature: (feature, layer) => {
                    // Bind tooltips dynamically
                    updateTooltip(feature, layer);
                }
            });
        })
        .catch(err => console.error('Error loading point layer:', err));
}

// Populate the dropdown menu with property keys dynamically
function populateDropdown(data) {
    const selector = document.getElementById('pointValueSelector');
    const firstFeature = data.features[0];

    if (firstFeature && firstFeature.properties) {
        const properties = Object.keys(firstFeature.properties);

        // Populate the dropdown
        properties.forEach(prop => {
            const option = document.createElement('option');
            option.value = prop;
            option.textContent = prop;
            selector.appendChild(option);
        });
    } else {
        console.error('No properties found in the GeoJSON data.');
    }
}




// Function to update the opacity percentage display
function updateOpacityValue(slider, display) {
    const value = Math.round(slider.value * 100); // Convert to percentage
    display.textContent = `${value}%`; // Update the text content
}

//event listener point dropdown menu
document.getElementById('pointValueSelector').addEventListener('change', function () {
    if (pointLayer) {
        pointLayer.eachLayer(layer => {
            // Update tooltip for each point
            if (layer.feature) {
                updateTooltip(layer.feature, layer);
            }
        });
    }
});

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

document.getElementById('tiffOpacity3').addEventListener('input', function () {
    updateOpacityValue(this, document.getElementById('tiffOpacityValue3'));
    if (tiffLayers['tiffLayer3']) {
        tiffLayers['tiffLayer3'].setOpacity(this.value);
    }
});


document.getElementById('pointOpacity').addEventListener('input', function () {
    updateOpacityValue(this, document.getElementById('pointOpacityValue'));
    if (pointLayer) {
        pointLayer.setStyle({ fillOpacity: this.value, opacity: this.value });
    }
});

//LAST

//Event listeners for toggling layers on and off
document.getElementById('geojsonLayer').addEventListener('change', function () {
    if (this.checked) {
        if (!geoJsonLayer) {
            loadGeoJsonLayer();
            setTimeout(() => {
                if (geoJsonLayer) geoJsonLayer.addTo(map);
            }, 500); // Delay to ensure the layer is loaded before adding it
        } else {
            geoJsonLayer.addTo(map);
        }
    } else {
        if (geoJsonLayer) {
            map.removeLayer(geoJsonLayer);
        }
    }
});

// Event listeners for toggling layers on and off
document.getElementById('pointLayer').addEventListener('change', function () {
    if (this.checked) {
        if (!pointLayer) {
            loadPointLayer();
            setTimeout(() => {
                if (pointLayer) pointLayer.addTo(map);
            }, 500); // Delay to ensure the layer is loaded before adding it
        } else {
            pointLayer.addTo(map);
        }
    } else {
        if (pointLayer) {
            map.removeLayer(pointLayer);
        }
    }
});


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
            await loadTiff('data/cell3.tif', 'tiffLayer1', tiffLayers, map, colorScales.tiffLayer1);
        }
        // Add the layer to the map and update the legend
        tiffLayers['tiffLayer1'].addTo(map);
        updateLegend(
            'Sample TIFF Layer 1',
            colorScales.tiffLayer1.colors,
            'Black to Red gradient for data values.',
            ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
        );
    } else if (tiffLayers['tiffLayer1']) {
        // Remove the layer from the map and hide the legend
        map.removeLayer(tiffLayers['tiffLayer1']);
        hideLegend();
    }
});

document.getElementById('tiffLayer2').addEventListener('change', async function () {
    if (this.checked) {
        if (!tiffLayers['tiffLayer2']) {
            // Load the TIFF layer if it hasn't been loaded yet
            await loadTiff('data/pop_epsg3857.tif', 'tiffLayer2', tiffLayers, map, colorScales.tiffLayer2);
        }
        // Add the layer to the map and update the legend
        tiffLayers['tiffLayer2'].addTo(map);
        updateLegend(
            'Sample TIFF Layer 2',
            colorScales.tiffLayer2.colors,
            'White to Dark Gray gradient for data values.',
            ['Very Low', 'Low', 'Medium', 'High', 'Very High']
        );
    } else if (tiffLayers['tiffLayer2']) {
        // Remove the layer from the map and hide the legend
        map.removeLayer(tiffLayers['tiffLayer2']);
        hideLegend();
    }
});

document.getElementById('tiffLayer3').addEventListener('change', async function () {
    if (this.checked) {
        if (!tiffLayers['tiffLayer3']) {
            // Load the TIFF layer if it hasn't been loaded yet
            await loadTiff('data/ln_May23_HR_IR_MIS_2021_mean_agg_sv_sc_clip.tif', 'tiffLayer3', tiffLayers, map, colorScales.tiffLayer3);
        }
        // Add the layer to the map and update the legend
        tiffLayers['tiffLayer3'].addTo(map);
        updateLegend(
            'Social Vulnerability',
            colorScales.tiffLayer3.colors,
            'Gradient representing social vulnerability.',
            ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
        );
    } else if (tiffLayers['tiffLayer3']) {
        // Remove the layer from the map and hide the legend
        map.removeLayer(tiffLayers['tiffLayer3']);
        hideLegend();
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
function updateLegend(layerName, colorScheme, description, labels) {
    const legend = document.getElementById('legend');

    // Ensure labels array matches the number of colors
    if (!labels || labels.length !== colorScheme.length) {
        console.error("Labels array does not match the number of colors in the color scheme!");
        return;
    }

    // Build legend content
    legend.innerHTML = `
        <h4>${layerName}</h4>
        <p>${description}</p>
        <div class="color-scheme">
            <p>Color Scheme:</p>
            <div class="color-boxes">
                ${colorScheme
                    .map(
                        (color, index) =>
                            `<div style="display:flex; align-items:center; margin-bottom:5px;">
                                <div style="background:${color}; width:20px; height:20px; margin-right:5px;"></div>
                                <span>${labels[index]}</span>
                            </div>`
                    )
                    .join('')}
            </div>
        </div>
    `;
    legend.style.display = 'block'; // Ensure the legend is visible
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

// Example of matching checkbox IDs
document.getElementById('geojsonLayer').addEventListener('change', function () {
    if (this.checked) {
        if (geoJsonLayer) {
            geoJsonLayer.addTo(map); // Add the layer when checked
        }
    } else {
        if (geoJsonLayer) {
            map.removeLayer(geoJsonLayer); // Remove when unchecked
        }
    }
});
