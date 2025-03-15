// main.js - Core application logic

// Import modules
import { addDefaultBasemap, basemaps } from './basemaps.js';
import { setupLayerControls } from './layer_controls.js';
import { initializeLegend, updateLegend, hideLegend } from './legend.js';
import { colorScales } from './color_scales.js';
import { loadVectorLayer } from './vector_layers.js';
import { initializeSplitMap } from './split-map.js';
import { CombinedBasemapControl } from './combined-basemap-control.js';

// Global layer storage
export const layers = {
    tiff: {},     // Store TIFF layers
    vector: {},   // Store vector layers
    point: null,  // Store point layer
    countryOutline: null // Store country outline
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
    
    // Create country outline toggle button
    createOutlineToggle(mainMap);
    
    // Setup layer controls
    setupLayerControls(mainMap, layers, colorScales, updateLegend, hideLegend);
    
    // Initialize opacity values display
    setupOpacityDisplays();
    
    // Add combined basemap control
    mainMap.addControl(new CombinedBasemapControl(mainMap, compareMap));
});

/**
 * Set up the main map with all functionality
 */
function setupMainMap(mapId) {
    const map = L.map(mapId, {
        zoomControl: true,
        attributionControl: true
    }).setView([17.5707, -3.9962], 6);
    
    addDefaultBasemap(map);
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
 * Create toggle button for country outline
 */
function createOutlineToggle(map) {
    const OutlineControl = L.Control.extend({
        options: { position: 'topleft' },
        
        onAdd: function() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control outline-toggle-control');
            const button = L.DomUtil.create('a', 'outline-toggle-button', container);
            button.href = '#';
            button.innerHTML = '🗺️ Toggle Outline';
            button.classList.add('active');
            
            L.DomEvent.on(button, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                toggleCountryOutline(button, map);
            });
            
            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });
    
    map.addControl(new OutlineControl());
}

/**
 * Toggle country outline visibility
 */
function toggleCountryOutline(button, map) {
    if (!layers.countryOutline) return;
    
    if (map.hasLayer(layers.countryOutline)) {
        map.removeLayer(layers.countryOutline);
        button.classList.remove('active');
    } else {
        map.addLayer(layers.countryOutline);
        button.classList.add('active');
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