// main.js - Core application logic

// Import modules
import { addDefaultBasemap, basemaps } from './basemaps.js'; 
import { setupLayerControls } from './layer_controls.js'; 
import { initializeLegend, updateLegend, hideLegend } from './legend.js';
import { colorScales } from './color_scales.js'; 
import { loadVectorLayer } from './vector_layers.js';
import { initializeSplitMap } from './split-map.js';
import { createAdminLabelLayers, generateAdminLabels } from './admin_labels.js';

// Global layer storage
export const layers = {
    tiff: {},     // Store TIFF layers
    vector: {},   // Store vector layers
    point: {},  // Store point layer
    countryOutline: null, // Store country outline
    labels: null  // Store label layers
};

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize split map
    const { mainMap, compareMap } = initializeSplitMap('map', 'compare-map', setupMainMap, setupCompareMap, 80);
    
    // Store main map reference globally
    window.map = mainMap;
    
    // Initialize UI components
    initializeLegend();
    setupDropdownToggles();
    
    // Load Mali outline by default
    await loadCountryOutline(mainMap);
    
    // Initialize admin label layers
    layers.labels = createAdminLabelLayers(mainMap, layers.vector, layers.countryOutline, compareMap);
    
    // Setup layer controls
    setupLayerControls(mainMap, layers, colorScales, updateLegend, hideLegend);
    
    // Initialize opacity values display
    setupOpacityDisplays();
});

/**
 * Set up the main map with all functionality
 */
function setupMainMap(mapId) {
    const map = L.map(mapId, {
        zoomControl: true,  // We'll remove this in createAdminLabelLayers
        attributionControl: true
    }).setView([17.5707, -3.9962], 6);
    map.attributionControl.setPrefix(' The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations.')
    map.attributionControl.setPosition('bottomleft')
    
    console.log('Main Map CRS Information:', {
        mapId: mapId,
        crs: map.options.crs,
        crsCode: map.options.crs.code,
        projection: map.options.crs.projection ? map.options.crs.projection.toString() : 'No projection info'
    });
    
    addDefaultBasemap(map);
    // Add scale bar
    L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false,
        maxWidth: 200
    }).addTo(map);

    return map;
}

/**
 * Set up the comparison map with basemap only
 */
function setupCompareMap(mapId) {
    const map = L.map(mapId, {
        zoomControl: false,
        attributionControl: false
    }).setView([17.5707, -3.9962], 6);
    
    basemaps.esriWorldImagery.addTo(map);
    
    return map;
}

/**
 * Load country outline
 */
async function loadCountryOutline(map) {
    try {
        const outlineLayer = await loadVectorLayer('data/cutline.geojson', {
            style: {
                color: "#3388ff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0
            }
        });
        
        outlineLayer.eachLayer(layer => {
            layer.unbindTooltip();
        });
        
        outlineLayer.addTo(map);
        layers.countryOutline = outlineLayer;
    } catch (error) {
        console.error("Failed to load country outline:", error);
    }
}

/**
 * Dropdown menu toggle functionality
 */
function setupDropdownToggles() {
    document.querySelectorAll('.dropdown-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            
            const container = this.nextElementSibling;
            if (container && container.classList.contains('dropdown-container')) {
                container.style.display = container.style.display === 'block' ? 'none' : 'block';
            }
        });
    });
}

/**
 * Initialize the opacity value displays
 */
function setupOpacityDisplays() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const displayId = slider.id.replace('Opacity', 'OpacityValue');
        const display = document.getElementById(displayId);
        
        if (display) {
            const value = Math.round(slider.value * 100);
            display.textContent = `${value}%`;
        }
    });
}