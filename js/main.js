// main.js - Core application logic

// Import modules
import { addDefaultBasemap, basemaps } from './basemaps.js'; 
import { setupLayerControls } from './layer_controls.js'; 
import { initializeLegend, updateLegend, hideLegend } from './legend.js';
import { colorScales } from './color_scales.js'; 
import { loadVectorLayer } from './vector_layers.js';
import { initializeSplitMap } from './split-map.js';
import { createAdminLabelLayers, generateAdminLabels } from './admin_labels.js';
import { initializeInfoPopup } from './info_popup.js';
import { WelcomePopup } from './welcome_popup.js';
import { InfoPanel } from './info_panel.js';
import { CombinedBasemapControl } from './combined-basemap-control.js';

// Global layer storage
export const layers = {
    tiff: {},     // Store TIFF layers
    vector: {},   // Store vector layers
    point: {},    // Store point layer
    countryOutline: null, // Store country outline
    labels: null  // Store label layers
};

// Info panel instance
export let infoPanel = null;

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize split map
    const { mainMap, compareMap } = initializeSplitMap('map', 'compare-map', setupMainMap, setupCompareMap, 80);
    
    // Store main map reference globally
    window.map = mainMap;
    
    // Initialize UI components
    initializeLegend();
    initializeInfoPopup(); // Initialize the info popup system
    setupDropdownToggles();
    
    // Load Mali outline by default
    await loadCountryOutline(mainMap);
    
    // Initialize admin label layers with info panel
    layers.labels = createAdminLabelLayers(mainMap, layers.vector, layers.countryOutline, compareMap, infoPanel);
    
    // Setup layer controls (this will auto-load Social-Vulnerability Admin Level 1)
    setupLayerControls(mainMap, layers, colorScales, updateLegend, hideLegend, infoPanel);
    
    // Initialize opacity values display
    setupOpacityDisplays();
    
    // Ensure Social Vulnerability dropdown is open by default
    openSocialVulnerabilityDropdown();
    
    // NOTE: Combined control is now created in createAdminLabelLayers
    
    // Initialize welcome popup (will only show if not shown before)
    setTimeout(() => {
        new WelcomePopup();
    }, 500); // Small delay to ensure page is fully loaded
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

    // Initialize Info Panel
    infoPanel = new InfoPanel({
        title: 'Layer Analysis & Reports',
        width: '420px',
        maxHeight: '75vh'
    });
    infoPanel.setMap(map);
    
    // Show the panel initially (minimized)
    infoPanel.show();
    
    // Set global reference for download functionality
    window.infoPanelInstance = infoPanel;
    
    // NOTE: Combined control will be added after both maps are created

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
 * Open Social Vulnerability dropdown by default
 */
function openSocialVulnerabilityDropdown() {
    const svButton = document.querySelector('.social-vulnerability-btn');
    const svContainer = svButton?.nextElementSibling;
    
    if (svButton && svContainer) {
        svButton.classList.add('active');
        svContainer.style.display = 'block';
    }
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

// Make WelcomePopup available globally for testing/help
window.showWelcome = function() {
    new WelcomePopup(true);
};