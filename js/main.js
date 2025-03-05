// main.js - Core application logic

// Import only the modules we actually use
import { BasemapControl, addDefaultBasemap } from './basemaps.js';
import { setupLayerControls } from './layer_controls.js';
import { initializeLegend, updateLegend, hideLegend } from './legend.js';
import { colorScales } from './color_scales.js';

// Initialize the map centered on Mali
const map = L.map('map').setView([17.5707, -3.9962], 6);

// Global layer storage
export const layers = {
    tiff: {},   // Store TIFF layers
    vector: {}, // Store vector layers
    point: null // Store point layer
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Add basemap and controls
    addDefaultBasemap(map);
    map.addControl(new BasemapControl());
    
    // Initialize UI components
    initializeLegend();
    setupDropdownToggles();
    
    // Setup layer controls with access to map, layers, and legend functions
    setupLayerControls(map, layers, colorScales, updateLegend, hideLegend);
    
    // Initialize opacity values display
    setupOpacityDisplays();
});

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