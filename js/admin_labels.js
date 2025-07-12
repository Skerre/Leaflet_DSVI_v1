// admin_labels.js - Functions for managing admin boundary labels and combined map controls

import { basemaps, basemapOptions } from './basemaps.js';

/**
 * Create label layers for administrative boundaries and combined map control
 * @param {Object} map - Leaflet map instance
 * @param {Object} vectorLayers - Object containing vector layers
 * @param {Object} countryOutline - Country outline layer
 * @param {Object} compareMap - Comparison map instance
 * @param {Object} infoPanel - Info panel instance
 * @returns {Object} - Object containing label layers
 */
export function createAdminLabelLayers(map, vectorLayers, countryOutline, compareMap, infoPanel) {
    // Initialize label layers container
    const labelLayers = {
        adm1: L.layerGroup(),
        adm2: L.layerGroup()
    };
    
    // Remove the default zoom control since we're using the top-left corner
    map.removeControl(map.zoomControl);
    
    // Create the combined control (features + basemaps + info panel)
    createMapFeaturesControl(map, labelLayers, countryOutline, compareMap, infoPanel);
    
    return labelLayers;
}

/**
 * Create a custom control combining all map controls including basemap selection and info panel
 * @param {Object} map - Leaflet map instance
 * @param {Object} labelLayers - Label layer groups
 * @param {Object} countryOutline - Country outline layer
 * @param {Object} compareMap - Comparison map instance
 * @param {Object} infoPanel - Info panel instance
 */
function createMapFeaturesControl(map, labelLayers, countryOutline, compareMap, infoPanel) {
    const MapFeaturesControl = L.Control.extend({
        options: { position: 'topleft' },
        
        onAdd: function() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control combined-map-control');
            
            // Add toggle button for minimizing/maximizing the panel
            const toggleButton = L.DomUtil.create('div', 'combined-control-toggle', container);
            toggleButton.innerHTML = 'Map Controls ▼';
            toggleButton.title = 'Toggle Map Controls';
            
            // Create content container that can be hidden/shown
            const contentContainer = L.DomUtil.create('div', 'combined-control-content', container);
            
            // Map Features Section
            const featuresTitle = L.DomUtil.create('div', 'combined-control-title', contentContainer);
            featuresTitle.innerHTML = 'Map Features';
            
            // Add outline toggle button
            const outlineButton = createButton('🗺️ Outline Mali', contentContainer);
            outlineButton.classList.add('active'); // Initially active
            
            // Add ADM1 button
            const adm1Button = createButton('ADM1 Labels', contentContainer);
            
            // Add ADM2 button
            const adm2Button = createButton('ADM2 Labels', contentContainer);
            
            // Separator
            const separator1 = L.DomUtil.create('div', 'combined-control-separator', contentContainer);
            
            // Map Basemaps Section
            const basemapsTitle = L.DomUtil.create('div', 'combined-control-title', contentContainer);
            basemapsTitle.innerHTML = 'Map Basemaps';
            
            // Left map selection
            const leftMapLabel = L.DomUtil.create('label', 'basemap-label', contentContainer);
            leftMapLabel.textContent = 'Left Map:';
            
            const leftMapSelect = L.DomUtil.create('select', 'basemap-select', contentContainer);
            
            // Add basemap options
            addBasemapOptions(leftMapSelect, 'osm');
            
            // Right map selection (only if compareMap exists)
            if (compareMap) {
                const rightMapLabel = L.DomUtil.create('label', 'basemap-label', contentContainer);
                rightMapLabel.textContent = 'Right Map:';
                
                const rightMapSelect = L.DomUtil.create('select', 'basemap-select', contentContainer);
                
                // Add basemap options with Satellite Imagery as default
                addBasemapOptions(rightMapSelect, 'esriWorldImagery');
                
                // Set event handler for right map
                L.DomEvent.on(rightMapSelect, 'change', function() {
                    updateBasemap(compareMap, this.value);
                });
            }
            
            // Separator
            const separator2 = L.DomUtil.create('div', 'combined-control-separator', contentContainer);
            
            // Info Panel Section
            const infoPanelTitle = L.DomUtil.create('div', 'combined-control-title', contentContainer);
            infoPanelTitle.innerHTML = 'Analysis Tools';
            
            // Add info panel toggle button
            const infoPanelButton = createButton('📊 Analysis Panel', contentContainer);
            infoPanelButton.classList.add('active'); // Initially active
            
            // Set click handlers for features
            L.DomEvent.on(outlineButton, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                L.DomEvent.stopPropagation(e);
                toggleCountryOutline(outlineButton, map, countryOutline);
            });
            
            L.DomEvent.on(adm1Button, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                L.DomEvent.stopPropagation(e);
                toggleLabels('adm1', adm1Button, labelLayers, map);
            });
            
            L.DomEvent.on(adm2Button, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                L.DomEvent.stopPropagation(e);
                toggleLabels('adm2', adm2Button, labelLayers, map);
            });
            
            // Set event handler for left map
            L.DomEvent.on(leftMapSelect, 'change', function() {
                updateBasemap(map, this.value);
            });
            
            // Set info panel handler
            L.DomEvent.on(infoPanelButton, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                L.DomEvent.stopPropagation(e);
                toggleInfoPanel(infoPanelButton, infoPanel);
            });
            
            // Set toggle handler
            L.DomEvent.on(toggleButton, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                L.DomEvent.stopPropagation(e);
                
                const isMinimized = container.classList.toggle('minimized');
                this.innerHTML = isMinimized ? 'Map Controls ▲' : 'Map Controls ▼';
            });
            
            // Prevent map clicks from propagating through the control
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            
            return container;
        }
    });
    
    map.addControl(new MapFeaturesControl());
}

/**
 * Add basemap options to select element
 * @param {HTMLElement} select - Select element to populate
 * @param {string} defaultBasemap - ID of the default selected basemap
 */
function addBasemapOptions(select, defaultBasemap) {
    // Use the existing basemapOptions from basemaps.js
    basemapOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        
        // Set the default selection
        if (option.value === defaultBasemap) {
            optionElement.selected = true;
        }
        
        select.appendChild(optionElement);
    });
}

/**
 * Update a map's basemap
 * @param {Object} map - Map instance
 * @param {string} basemapId - ID of the basemap to use
 */
function updateBasemap(map, basemapId) {
    // Remove all basemaps from this specific map
    map.eachLayer(function(layer) {
        // Check if this layer is a tile layer (basemap) by checking for _url property
        if (layer._url && layer.options && layer.options.attribution) {
            map.removeLayer(layer);
        }
    });
    
    // Create a new instance of the selected basemap for this map
    if (basemaps[basemapId]) {
        const basemapConfig = basemaps[basemapId];
        
        // Create a new tile layer instance with the same configuration
        const newBasemapLayer = L.tileLayer(basemapConfig._url, basemapConfig.options);
        newBasemapLayer.addTo(map);
    }
}

/**
 * Create a styled button element
 * @param {string} text - Button text
 * @param {HTMLElement} container - Parent container
 * @returns {HTMLElement} - Button element
 */
function createButton(text, container) {
    const button = L.DomUtil.create('button', 'combined-control-button', container);
    button.innerHTML = text;
    button.style.padding = '6px 10px';
    button.style.backgroundColor = '#f8f8f8';
    button.style.border = '1px solid #ccc';
    button.style.borderRadius = '3px';
    button.style.cursor = 'pointer';
    button.style.width = '100%';
    button.style.transition = 'all 0.3s';
    button.style.fontWeight = 'normal';
    
    // Add hover effect
    button.onmouseover = function() { 
        if (!this.classList.contains('active')) {
            this.style.backgroundColor = '#e6e6e6'; 
        }
    };
    button.onmouseout = function() { 
        if (!this.classList.contains('active')) {
            this.style.backgroundColor = '#f8f8f8'; 
        }
    };
    
    return button;
}

/**
 * Toggle the visibility of labels for an admin level
 * @param {string} level - Admin level (adm1 or adm2)
 * @param {HTMLElement} button - Button element that triggered the toggle
 * @param {Object} labelLayers - Label layer groups
 * @param {Object} map - Leaflet map instance
 */
function toggleLabels(level, button, labelLayers, map) {
    const isActive = button.classList.contains('active');
    
    if (isActive) {
        // Turn off labels
        button.classList.remove('active');
        button.style.backgroundColor = '#f8f8f8';
        button.style.fontWeight = 'normal';
        
        map.removeLayer(labelLayers[level]);
    } else {
        // Turn on labels
        button.classList.add('active');
        button.style.backgroundColor = '#d4edda';
        button.style.fontWeight = 'bold';
        
        // Check if labels are already generated
        if (labelLayers[level].getLayers().length === 0) {
            // Labels not yet generated, load the data and generate them
            loadAndGenerateLabels(level, labelLayers[level], map);
        }
        
        labelLayers[level].addTo(map);
    }
}

/**
 * Load and generate labels for admin boundaries when layer is not loaded
 * @param {string} level - Admin level (adm1 or adm2)
 * @param {Object} labelLayer - Label layer group to add markers to
 * @param {Object} map - Leaflet map instance
 */
function loadAndGenerateLabels(level, labelLayer, map) {
    const url = level === 'adm1' 
        ? 'data/adm1_summary_stats_1.geojson'  // Path to ADM1 data
        : 'data/adm2_summary_stats_3.geojson'; // Path to ADM2 data
    
    // Fetch the GeoJSON file directly
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const tempLayer = L.geoJSON(data);
            generateLabelsFromData(tempLayer, level, labelLayer);
        })
        .catch(error => {
            console.error(`Error loading ${level} data:`, error);
        });
}

/**
 * Generate labels from a temporary layer
 * @param {Object} layer - GeoJSON layer with admin boundaries
 * @param {string} level - Admin level (adm1 or adm2)
 * @param {Object} labelLayer - Label layer group to add markers to
 */
function generateLabelsFromData(layer, level, labelLayer) {
    // Clear existing labels
    labelLayer.clearLayers();
    
    const nameField = level === 'adm1' ? 'NAME_1' : 'Cercle/District';
    
    try {
        layer.eachLayer(function(featureLayer) {
            if (!featureLayer.feature || !featureLayer.feature.properties) return;
            
            const name = featureLayer.feature.properties[nameField];
            if (!name) return;
            
            // Get the center of the polygon for label placement
            const bounds = featureLayer.getBounds();
            const center = bounds.getCenter();
            
            // Create a marker with a tooltip for the label
            const marker = L.marker(center, {
                icon: L.divIcon({
                    className: 'admin-label-icon',
                    html: `<div class="admin-label ${level}-label">${name}</div>`,
                    iconSize: [100, 20],
                    iconAnchor: [50, 10]
                }),
                interactive: false // Prevent the label from being clickable
            });
            
            labelLayer.addLayer(marker);
        });
        
        console.log(`Generated ${level} labels independently`);
    } catch (err) {
        console.error(`Error generating ${level} labels:`, err);
    }
}

/**
 * Toggle country outline visibility
 * @param {HTMLElement} button - Button element that triggered the toggle
 * @param {Object} map - Leaflet map instance
 * @param {Object} countryOutline - Country outline layer
 */
function toggleCountryOutline(button, map, countryOutline) {
    if (!countryOutline) return;
    
    const isActive = button.classList.contains('active');
    
    if (isActive) {
        // Turn off outline
        button.classList.remove('active');
        button.style.backgroundColor = '#f8f8f8';
        button.style.fontWeight = 'normal';
        map.removeLayer(countryOutline);
    } else {
        // Turn on outline
        button.classList.add('active');
        button.style.backgroundColor = '#d4edda';
        button.style.fontWeight = 'bold';
        countryOutline.addTo(map);
    }
}

/**
 * Toggle info panel visibility
 * @param {HTMLElement} button - Button element that triggered the toggle
 * @param {Object} infoPanel - Info panel instance
 */
function toggleInfoPanel(button, infoPanel) {
    if (!infoPanel) return;
    
    const isActive = button.classList.contains('active');
    
    if (isActive) {
        // Turn off info panel
        button.classList.remove('active');
        button.style.backgroundColor = '#f8f8f8';
        button.style.fontWeight = 'normal';
        
        if (infoPanel.isVisible) {
            infoPanel.hide();
        }
    } else {
        // Turn on info panel
        button.classList.add('active');
        button.style.backgroundColor = '#d4edda';
        button.style.fontWeight = 'bold';
        
        if (!infoPanel.isVisible) {
            infoPanel.show();
        }
    }
}

/**
 * Generate labels for admin boundaries - used when vector layers are loaded
 * This is called from layer_controls.js when a vector layer is activated
 * @param {Object} layer - GeoJSON layer with admin boundaries
 * @param {string} level - Admin level (adm1 or adm2)
 * @param {Object} labelLayer - Label layer group to add markers to
 */
export function generateAdminLabels(layer, level, labelLayer) {
    // Clear existing labels
    labelLayer.clearLayers();
    
    const nameField = level === 'adm1' ? 'NAME_1' : 'Cercle/District';
    
    if (!layer || !layer.getLayers) {
        console.error("Invalid layer provided to generateAdminLabels");
        return;
    }
    
    try {
        layer.eachLayer(function(featureLayer) {
            if (!featureLayer.feature || !featureLayer.feature.properties) return;
            
            const name = featureLayer.feature.properties[nameField];
            if (!name) return;
            
            // Get the center of the polygon for label placement
            const bounds = featureLayer.getBounds();
            const center = bounds.getCenter();
            
            // Create a marker with a tooltip for the label
            const marker = L.marker(center, {
                icon: L.divIcon({
                    className: 'admin-label-icon',
                    html: `<div class="admin-label ${level}-label">${name}</div>`,
                    iconSize: [100, 20],
                    iconAnchor: [50, 10]
                }),
                interactive: false // Prevent the label from being clickable
            });
            
            labelLayer.addLayer(marker);
        });
        
        console.log(`Generated ${level} labels from layer`);
    } catch (err) {
        console.error(`Error generating ${level} labels:`, err);
    }
}