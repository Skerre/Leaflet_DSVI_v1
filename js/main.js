// main.js - Core application logic

// Import modules
import { BasemapControl, addDefaultBasemap } from './basemaps.js';
import { setupLayerControls } from './layer_controls.js';
import { initializeLegend, updateLegend, hideLegend } from './legend.js';
import { colorScales } from './color_scales.js';
import { loadVectorLayer } from './vector_layers.js';

// Initialize the map centered on Mali
const map = L.map('map').setView([17.5707, -3.9962], 6);

// Global layer storage
export const layers = {
    tiff: {},   // Store TIFF layers
    vector: {}, // Store vector layers
    point: null, // Store point layer
    countryOutline: null // Store country outline
};

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    // Add basemap and controls
    addDefaultBasemap(map);
    map.addControl(new BasemapControl());
    
    // Initialize UI components
    initializeLegend();
    setupDropdownToggles();
    
    // Load Mali outline by default
    await loadCountryOutline();
    
    // Create country outline toggle button
    createOutlineToggle();
    
    // Setup layer controls with access to map, layers, and legend functions
    setupLayerControls(map, layers, colorScales, updateLegend, hideLegend);
    
    // Initialize opacity values display
    setupOpacityDisplays();
});

/**
 * Load country outline (Mali) from the admin level 1 data
 */
async function loadCountryOutline() {
    try {
        // Load the administrative boundary level 1 data
        const outlineLayer = await loadVectorLayer('data/cutline.geojson', {
            style: {
                color: "#3388ff", // Blue outline
                weight: 2,        // Line thickness
                opacity: 1,
                fillOpacity: 0.1   // Very transparent fill
            }
        });
        
        // Remove tooltips from all features in the layer
        outlineLayer.eachLayer(layer => {
            layer.unbindTooltip();
        });
        
        // Add the outline to the map
        outlineLayer.addTo(map);
        
        // Store in global layers object
        layers.countryOutline = outlineLayer;
        
        console.log("Country outline loaded successfully");
    } catch (error) {
        console.error("Failed to load country outline:", error);
    }
}
/**
 * Create toggle button for country outline
 */
function createOutlineToggle() {
    // Create a custom control for the outline toggle
    const OutlineControl = L.Control.extend({
        options: {
            position: 'topright'
        },
        
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control outline-toggle-control');
            
            const button = L.DomUtil.create('a', 'outline-toggle-button', container);
            button.href = '#';
            button.innerHTML = '<span style="font-size: 16px;">🗺️</span>Toggle country outline';
            
            // Add active class since outline is visible by default
            button.classList.add('active');
            
            L.DomEvent.on(button, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                toggleCountryOutline(button);
            });
            
            // Prevent map click events when clicking the button
            L.DomEvent.disableClickPropagation(container);
            
            return container;
        }
    });
    
    // Add the control to the map
    map.addControl(new OutlineControl());
}

/**
 * Toggle country outline visibility
 */
function toggleCountryOutline(button) {
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
    const dropdownButtons = document.querySelectorAll('.dropdown-btn');
    
    dropdownButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Toggle active class
            this.classList.toggle('active');
            
            // Toggle dropdown container visibility
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
    const opacitySliders = document.querySelectorAll('input[type="range"]');
    
    opacitySliders.forEach(slider => {
        const displayId = slider.id.replace('Opacity', 'OpacityValue');
        const display = document.getElementById(displayId);
        
        if (display) {
            const value = Math.round(slider.value * 100);
            display.textContent = `${value}%`;
        }
    });
}