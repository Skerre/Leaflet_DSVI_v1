// layer_controls.js - Event handlers for layer controls

import { loadVectorLayer, loadPointLayer, updateTooltip, updateVectorLayerStyle, populateAttributeSelector } from './vector_layers.js';
import { loadTiff } from './tiff_loader.js';
import { setupColorRampSelector, getColorRamp } from './color_ramp_selector.js';

// Layer configuration - maps checkbox IDs to loading functions and parameters
const layerConfig = {
    // Vector layers
    geojsonLayer: {
        type: 'vector',
        url: 'data/sample_adm1_vector.geojson',
        style: {
            color: "#3388ff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.5
        },
        opacityControl: 'geojsonOpacity',
        opacityDisplay: 'geojsonOpacityValue',
        attributeSelector: 'vectorAttribute1',
        colorRampSelector: 'vectorColorRamp1',
        colorRampPreview: 'vectorColorPreview1'
    },
    geojsonLayer2: {
        type: 'vector',
        url: 'data/adm2_summary_stats_3.geojson',
        style: {
            color: "#FF5733",
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.4
        },
        opacityControl: 'geojsonOpacity2',
        opacityDisplay: 'geojsonOpacityValue2',
        attributeSelector: 'vectorAttribute2',
        colorRampSelector: 'vectorColorRamp2',
        colorRampPreview: 'vectorColorPreview2'
    },
    // Point layer
    pointLayer: {
        type: 'point',
        url: 'data/sample-points_2.geojson',
        opacityControl: 'pointOpacity',
        opacityDisplay: 'pointOpacityValue',
        selectorId: 'pointValueSelector'
    },
    // Raster layers
    tiffLayer1: {
        type: 'raster',
        url: 'data/celltower_density_epsg4326_lowres.tif',
        opacityControl: 'tiffOpacity1',
        opacityDisplay: 'tiffOpacityValue1',
        colorScale: 'cellTowerDensity',
        legendTitle: 'Cell Tower Density',
        legendDescription: 'Color gradient representing cell tower density.',
        legendLabels: ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
    },
    tiffLayer2: {
        type: 'raster',
        url: 'data/pop_epsg4326_lowres.tif',
        opacityControl: 'tiffOpacity2',
        opacityDisplay: 'tiffOpacityValue2',
        colorScale: 'populationDensity',
        legendTitle: 'Population Density',
        legendDescription: 'White to Dark Gray gradient representing population density.',
        legendLabels: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
    },
    tiffLayer3: {
        type: 'raster',
        url: 'data/SV_May23_HR_IR_MIS_2021_agg_epsg4326_lowres.tif',
        opacityControl: 'tiffOpacity3',
        opacityDisplay: 'tiffOpacityValue3',
        colorScale: 'socialVulnerability',
        legendTitle: 'Social Vulnerability',
        legendDescription: 'Gradient representing social vulnerability index.',
        legendLabels: ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
    },
    tiffLayer4: {
        type: 'raster',
        url: 'data/rwi_density_epsg4326_lowres.tif',
        opacityControl: 'tiffOpacity4',
        opacityDisplay: 'tiffOpacityValue4',
        colorScale: 'relativeWealth',
        legendTitle: 'Relative Wealth',
        legendDescription: 'Gradient representing relative wealth index.',
        legendLabels: ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
    }
};

/**
 * This is the main function that needs to be modified to pass the updateLegend function
 * 
 * Setup all layer controls and their event listeners
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Object to store all layers
 * @param {Object} colorScales - Color scales for raster layers
 * @param {Function} updateLegend - Function to update the legend
 * @param {Function} hideLegend - Function to hide the legend
 */
export function setupLayerControls(map, layers, colorScales, updateLegend, hideLegend) {
    // Setup layer toggles
    Object.keys(layerConfig).forEach(layerId => {
        setupLayerToggle(layerId, map, layers, colorScales, updateLegend, hideLegend);
        
        // Setup opacity controls if they exist
        const config = layerConfig[layerId];
        if (config.opacityControl && config.opacityDisplay) {
            setupOpacityControl(config.opacityControl, config.opacityDisplay, layerId, layers, updateLegend);
        }
        
        // Setup attribute and color ramp selectors for vector layers
        if (config.type === 'vector' && config.attributeSelector && config.colorRampSelector) {
            setupVectorAttributeControls(layerId, map, layers, config, updateLegend);
        }
    });
    
    // Setup property selector for point layer if it exists
    const pointSelector = document.getElementById('pointValueSelector');
    if (pointSelector) {
        pointSelector.addEventListener('change', function() {
            if (layers.point) {
                layers.point.eachLayer(layer => {
                    if (layer.feature) {
                        updateTooltip(layer.feature, layer, 'pointValueSelector');
                    }
                });
            }
        });
    }
}


/**
 * This function needs to be modified to pass along the updateLegend function
 * 
 * Setup vector layer attribute controls
 * @param {string} layerId - ID of the layer
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Object containing all layers
 * @param {Object} config - Layer configuration
 * @param {Function} updateLegend - Function to update the legend
 */
function setupVectorAttributeControls(layerId, map, layers, config, updateLegend) {
    // Setup color ramp selector
    setupColorRampSelector(config.colorRampSelector, config.colorRampPreview, (ramp) => {
        updateVectorLayerFromControls(layerId, layers, updateLegend);
    });
    
    // Setup attribute selector change event
    const attributeSelector = document.getElementById(config.attributeSelector);
    if (attributeSelector) {
        attributeSelector.addEventListener('change', function() {
            updateVectorLayerFromControls(layerId, layers, updateLegend);
        });
    }
}

/**
 * This function needs to be modified to accept and pass along the updateLegend function
 * 
 * Update vector layer based on selected attribute and color ramp
 * @param {string} layerId - ID of the layer
 * @param {Object} layers - Object containing all layers
 * @param {Function} updateLegend - Function to update the legend
 */
function updateVectorLayerFromControls(layerId, layers, updateLegend) {
    const config = layerConfig[layerId];
    if (!config || !layers.vector[layerId]) return;
    
    // Get selected attribute
    const attributeSelector = document.getElementById(config.attributeSelector);
    if (!attributeSelector) return;
    const selectedAttribute = attributeSelector.value;
    if (!selectedAttribute) return;
    
    // Get selected color ramp
    const colorRampSelector = document.getElementById(config.colorRampSelector);
    if (!colorRampSelector) return;
    const selectedRampId = colorRampSelector.value;
    if (!selectedRampId) return;
    
    const colorRamp = getColorRamp(selectedRampId);
    if (!colorRamp) return;
    
    // Get opacity value
    const opacitySlider = document.getElementById(config.opacityControl);
    const opacity = opacitySlider ? parseFloat(opacitySlider.value) : 0.5;
    
    // Update the layer style and pass the updateLegend function
    updateVectorLayerStyle(layers.vector[layerId], selectedAttribute, colorRamp, opacity, updateLegend);
}
/**
 * Setup layer toggle functionality for a specific layer
 * @param {string} layerId - ID of the layer checkbox
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Object to store all layers
 * @param {Object} colorScales - Color scales for raster layers
 * @param {Function} updateLegend - Function to update the legend
 * @param {Function} hideLegend - Function to hide the legend
 */
function setupLayerToggle(layerId, map, layers, colorScales, updateLegend, hideLegend) {
    const checkbox = document.getElementById(layerId);
    if (!checkbox) return;
    
    const config = layerConfig[layerId];
    if (!config) return;
    
    checkbox.addEventListener('change', async function() {
        if (this.checked) {
            try {
                await loadLayer(layerId, map, layers, colorScales, updateLegend);
                
                // If it's a vector layer, populate attribute selector
                if (config.type === 'vector' && config.attributeSelector) {
                    populateAttributeSelector(layers.vector[layerId], config.attributeSelector);
                }
            } catch (error) {
                console.error(`Error loading layer ${layerId}:`, error);
                this.checked = false;
            }
        } else {
            removeLayer(layerId, map, layers, hideLegend);
        }
    });
}

/**
 * Load a layer by ID
 * @param {string} layerId - ID of the layer
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Object to store all layers
 * @param {Object} colorScales - Color scales for raster layers
 * @param {Function} updateLegend - Function to update the legend
 */
/**
 * Load a layer by ID
 * @param {string} layerId - ID of the layer
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Object to store all layers
 * @param {Object} colorScales - Color scales for raster layers
 * @param {Function} updateLegend - Function to update the legend
 */
async function loadLayer(layerId, map, layers, colorScales, updateLegend) {
    const config = layerConfig[layerId];
    
    switch (config.type) {
        case 'vector':
            if (!layers.vector[layerId]) {
                layers.vector[layerId] = await loadVectorLayer(config.url, {
                    style: config.style
                });
            }
            layers.vector[layerId].addTo(map);
            break;
            
        case 'point':
            if (!layers.point) {
                layers.point = await loadPointLayer(config.url, {
                    selectorId: config.selectorId
                });
            }
            layers.point.addTo(map);
            break;
            
        case 'raster':
            try {
                // Check if the specified colorScale exists
                if (!colorScales || !colorScales[config.colorScale]) {
                    console.error(`Color scale '${config.colorScale}' not found. Available scales:`, 
                        colorScales ? Object.keys(colorScales) : 'None');
                    throw new Error(`Color scale '${config.colorScale}' not found for layer ${layerId}`);
                }
                
                const selectedColorScale = colorScales[config.colorScale];
                console.log(`Loading raster layer ${layerId} with colorScale:`, selectedColorScale);
                
                if (!layers.tiff[layerId]) {
                    await loadTiff(
                        config.url, 
                        layerId, 
                        layers.tiff, 
                        map, 
                        selectedColorScale
                    );
                } else {
                    layers.tiff[layerId].addTo(map);
                }
                
                // Update legend for raster layers
                updateLegend(
                    config.legendTitle,
                    selectedColorScale.colors,
                    config.legendDescription,
                    config.legendLabels
                );
            } catch (error) {
                console.error(`Error loading raster layer ${layerId}:`, error);
                throw error;
            }
            break;
    }
}

/**
 * Remove a layer by ID
 * @param {string} layerId - ID of the layer
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Object containing all layers
 * @param {Function} hideLegend - Function to hide the legend
 */
function removeLayer(layerId, map, layers, hideLegend) {
    const config = layerConfig[layerId];
    
    switch (config.type) {
        case 'vector':
            if (layers.vector[layerId]) {
                map.removeLayer(layers.vector[layerId]);
            }
            break;
            
        case 'point':
            if (layers.point) {
                map.removeLayer(layers.point);
            }
            break;
            
        case 'raster':
            if (layers.tiff[layerId]) {
                map.removeLayer(layers.tiff[layerId]);
                // Hide stats container
                const statsContainer = document.getElementById('stats-container');
                if (statsContainer) statsContainer.style.display = 'none';
                hideLegend();
            }
            break;
    }
}

/**
 * This function needs to be modified to pass along the updateLegend function
 * 
 * Setup opacity control for a layer
 * @param {string} sliderId - ID of the range input
 * @param {string} displayId - ID of the display element
 * @param {string} layerId - ID of the associated layer
 * @param {Object} layers - Object containing all layers
 * @param {Function} updateLegend - Function to update the legend
 */
function setupOpacityControl(sliderId, displayId, layerId, layers, updateLegend) {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    if (!slider || !display) return;
    
    slider.addEventListener('input', function() {
        // Update display
        const value = Math.round(this.value * 100);
        display.textContent = `${value}%`;
        
        // Update layer opacity
        const config = layerConfig[layerId];
        if (!config) return;
        
        switch (config.type) {
            case 'raster':
                if (layers.tiff[layerId]) {
                    layers.tiff[layerId].setOpacity(this.value);
                }
                break;
                
            case 'vector':
                if (layers.vector[layerId]) {
                    // Always apply basic opacity
                    layers.vector[layerId].setStyle({ 
                        fillOpacity: this.value, 
                        opacity: this.value 
                    });
                    
                    // Additionally update color-based styling if selectors are configured
                    if (config.attributeSelector && config.colorRampSelector) {
                        const attributeSelector = document.getElementById(config.attributeSelector);
                        const colorRampSelector = document.getElementById(config.colorRampSelector);
                        
                        // Only try to update advanced styling if both selectors have values
                        if (attributeSelector && attributeSelector.value && 
                            colorRampSelector && colorRampSelector.value) {
                            updateVectorLayerFromControls(layerId, layers, updateLegend);
                        }
                    }
                }
                break;
                
            case 'point':
                if (layers.point) {
                    layers.point.setStyle({ 
                        fillOpacity: this.value, 
                        opacity: this.value 
                    });
                }
                break;
        }
    });
}