// admin_labels.js - Functions for managing admin boundary labels

/**
 * Create label layers for administrative boundaries
 * @param {Object} map - Leaflet map instance
 * @param {Object} vectorLayers - Object containing vector layers
 * @param {Object} countryOutline - Country outline layer
 * @returns {Object} - Object containing label layers
 */
export function createAdminLabelLayers(map, vectorLayers, countryOutline) {
    // Initialize label layers container
    const labelLayers = {
        adm1: L.layerGroup(),
        adm2: L.layerGroup()
    };
    
    // Create the combined control panel
    createCombinedMapControl(map, labelLayers, countryOutline);
    
    return labelLayers;
}

/**
 * Create a custom control combining outline toggle and admin labels
 * @param {Object} map - Leaflet map instance
 * @param {Object} labelLayers - Label layer groups
 * @param {Object} countryOutline - Country outline layer
 */
function createCombinedMapControl(map, labelLayers, countryOutline) {
    const CombinedControl = L.Control.extend({
        options: { position: 'topleft' },
        
        onAdd: function() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control combined-map-control');
            container.style.backgroundColor = 'white';
            container.style.padding = '8px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '8px';
            container.style.borderRadius = '4px';
            container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
            
            // Add title
            const title = L.DomUtil.create('div', 'combined-control-title', container);
            title.innerHTML = 'Map Features';
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '5px';
            title.style.borderBottom = '1px solid #ccc';
            title.style.paddingBottom = '5px';
            
            // Add outline toggle button
            const outlineButton = createButton('🗺️ Outline', container);
            outlineButton.classList.add('active'); // Initially active
            
            // Add ADM1 button
            const adm1Button = createButton('ADM1 Labels', container);
            
            // Add ADM2 button
            const adm2Button = createButton('ADM2 Labels', container);
            
            // Set up click handlers
            L.DomEvent.on(outlineButton, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                toggleCountryOutline(outlineButton, map, countryOutline);
            });
            
            L.DomEvent.on(adm1Button, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                toggleLabels('adm1', adm1Button, labelLayers, map);
            });
            
            L.DomEvent.on(adm2Button, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                toggleLabels('adm2', adm2Button, labelLayers, map);
            });
            
            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });
    
    map.addControl(new CombinedControl());
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
    button.style.minWidth = '120px';
    
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
        
        // Fix: Use correct method to remove layer
        map.removeLayer(labelLayers[level]);
    } else {
        // Turn on labels
        button.classList.add('active');
        button.style.backgroundColor = '#d4edda';
        button.style.fontWeight = 'bold';
        
        labelLayers[level].addTo(map);
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
 * Generate labels for admin boundaries
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
        
        console.log(`Generated ${level} labels`);
    } catch (err) {
        console.error(`Error generating ${level} labels:`, err);
    }
}