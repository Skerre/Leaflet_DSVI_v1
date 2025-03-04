// main.js - Core application logic

// Import modules
import { loadTiff } from './tiff_loader.js';
import { BasemapControl, addDefaultBasemap } from './basemaps.js';
import { loadVectorLayer, loadPointLayer } from './vector_layers.js';
import { setupLayerControls } from './layer_controls.js';
import { initializeLegend, updateLegend, hideLegend } from './legend.js';
import { colorScales, colorRamps } from './color_scales.js';

// Initialize the map centered on Mali
const map = L.map('map').setView([17.5707, -3.9962], 6);

// Add the default basemap and initialize controls
addDefaultBasemap(map);
map.addControl(new BasemapControl());

// Global layer storage
export const layers = {
    tiff: {},   // Store TIFF layers
    vector: {}, // Store vector layers
    point: null // Store point layer
};

// Initialize UI
initializeLegend();
setupDropdownToggles();

// Setup layer controls and event listeners
setupLayerControls(map, layers, colorScales, updateLegend, hideLegend);

// Dropdown menu toggle functionality
function setupDropdownToggles() {
    const dropdownButtons = document.querySelectorAll('.dropdown-btn');
    
    dropdownButtons.forEach(button => {
        // Add click event listener
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const dropdownContent = this.nextElementSibling;
            if (dropdownContent && dropdownContent.classList.contains('dropdown-container')) {
                if (dropdownContent.style.display === 'block') {
                    dropdownContent.style.display = 'none';
                } else {
                    dropdownContent.style.display = 'block';
                }
            }
        });
    });
}

// Initialize opacity values display
const opacitySliders = document.querySelectorAll('input[type="range"]');
opacitySliders.forEach(slider => {
    const displayId = slider.id.replace('Opacity', 'OpacityValue');
    const display = document.getElementById(displayId);
    if (display) {
        const value = Math.round(slider.value * 100);
        display.textContent = `${value}%`;
    }
});