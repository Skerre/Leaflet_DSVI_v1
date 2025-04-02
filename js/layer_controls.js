// layer_controls.js - Event handlers for layer controls

import { loadVectorLayer, 
    loadPointLayer, 
    updateTooltip, 
    updateVectorLayerStyle, 
    updatePointLayerStyle, 
    populateAttributeSelector } from './vector_layers.js';
import { loadTiff } from './zoom-adaptive-tiff-loader.js';
import { setupColorRampSelector, getColorRamp } from './color_ramp_selector.js';
import { generateAdminLabels } from './admin_labels.js';

// Layer configuration - maps checkbox IDs to loading functions and parameters
const layerConfig = {
    // Vector layers
    geojsonLayer: {
        type: 'vector',
        url: 'data/adm1_summary_stats_1.geojson',
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
    streetNetworkLayer: {
        type: 'vector',
        url: 'data/street_subset.geojson', // Update with your actual file path
        style: {
            color: "#3388ff",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0
        },
        opacityControl: 'streetNetworkOpacity',
        opacityDisplay: 'streetNetworkOpacityValue',
        attributeSelector: 'streetNetworkAttribute',
        colorRampSelector: 'streetNetworkColorRamp',
        colorRampPreview: 'streetNetworkColorPreview'
    },
    pointLayer: {
        type: 'point',
        url: 'data/DHS_stats.geojson',
        opacityControl: 'pointOpacity',
        opacityDisplay: 'pointOpacityValue',
        selectorId: 'pointValueSelector',
        // Add these new properties:
        colorRampSelector: 'pointColorRamp',
        colorRampPreview: 'pointColorPreview',
        attributeSelector: 'pointValueSelector'  // Reuse existing selector
    },
    pointLayer2: {
        type: 'point',
        url: 'data/cities.geojson',
        opacityControl: 'pointOpacity2',
        opacityDisplay: 'pointOpacityValue2',
        selectorId: 'pointValueSelector2',
        // Add these new properties:
        colorRampSelector: 'pointColorRamp2',
        colorRampPreview: 'pointColorPreview2',
        attributeSelector: 'pointValueSelector2'  // Reuse existing selector
    },
    // Raster layers
    tiffLayer1: {
        type: 'raster',
        url: 'data/celltower.tif',
        opacityControl: 'tiffOpacity1',
        opacityDisplay: 'tiffOpacityValue1',
        colorScale: 'cellTowerDensity',
        legendTitle: 'Cell Tower Density',
        legendDescription: 'Color gradient representing cell tower density.',
        legendLabels: ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
    },
    tiffLayer2: {
        type: 'raster',
        url: 'data/pop.tif',
        opacityControl: 'tiffOpacity2',
        opacityDisplay: 'tiffOpacityValue2',
        colorScale: 'populationDensity',
        legendTitle: 'Population Density',
        legendDescription: 'White to Dark Gray gradient representing population density.',
        legendLabels: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
    },
    tiffLayer3: {
        type: 'raster',
        url: 'data/SV_May23_HR_IR_MIS_2021_agg.tif',
        opacityControl: 'tiffOpacity3',
        opacityDisplay: 'tiffOpacityValue3',
        colorScale: 'socialVulnerability',
        legendTitle: 'Social Vulnerability',
        legendDescription: 'Gradient representing social vulnerability index.',
        legendLabels: ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
    },
    tiffLayer4: {
        type: 'raster',
        url: 'data/rwi.tif',
        opacityControl: 'tiffOpacity4',
        opacityDisplay: 'tiffOpacityValue4',
        colorScale: 'relativeWealth',
        legendTitle: 'Relative Wealth',
        legendDescription: 'Gradient representing relative wealth index.',
        legendLabels: ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
    },
    tiffLayer5: {
        type: 'raster',
        url: 'data/.tif',
        opacityControl: 'tiffOpacity5',
        opacityDisplay: 'tiffOpacityValue5',
        colorScale: 'nightlightintensity',
        legendTitle: 'Nightlights',
        legendDescription: 'Gradient representing nightlight intensity.',
        legendLabels: ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
    },
    tiffLayer6: {
        type: 'raster',
        url: 'data/ndvi2.tif',
        opacityControl: 'tiffOpacity6',
        opacityDisplay: 'tiffOpacityValue6',
        colorScale: 'ndvi',
        legendTitle: 'Vegetation Health',
        legendDescription: 'Gradient representing Normalized Difference Vegetation Index.',
        legendLabels: ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
    },
    tiffLayer7: {
        type: 'raster',
        url: 'data/conflict.tif',
        opacityControl: 'tiffOpacity7',
        opacityDisplay: 'tiffOpacityValue7',
        colorScale: 'conflict',
        legendTitle: 'Conflicts (ACLED)',
        legendDescription: 'Gradient representing number of conflict events in the past 15 years.',
        legendLabels: ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
    },
    tiffLayer8: {
        type: 'raster',
        url: 'data/temp_compr.tif',
        opacityControl: 'tiffOpacity8',
        opacityDisplay: 'tiffOpacityValue8',
        colorScale: 'temp',
        legendTitle: 'Conflicts (ACLED)',
        legendDescription: 'Gradient representing number of conflict events in the past 15 years.',
        legendLabels: ['Low', 'Medium-Low', 'Medium', 'High', 'Very High']
    }
};

/**
 * Setup all layer controls and their event listeners
 * @param {Object} map - Leaflet map instance
 * @param {Object} layers - Object to store all layers
 * @param {Object} colorScales - Color scales for raster layers
 * @param {Function} updateLegend - Function to update the legend
 * @param {Function} hideLegend - Function to hide the legend
 */
export function setupLayerControls(map, layers, colorScales, updateLegend, hideLegend) {
    // Initialize layer handlers
    Object.keys(layerConfig).forEach(layerId => {
        setupLayerToggle(layerId, map, layers, colorScales, updateLegend, hideLegend);
        
        const config = layerConfig[layerId];
        
        // Setup opacity control if configured
        if (config.opacityControl && config.opacityDisplay) {
            setupOpacityControl(config.opacityControl, config.opacityDisplay, layerId, layers, updateLegend);
        }
        
        // Setup vector layer attribute and color controls
        if (config.type === 'vector' && config.attributeSelector && config.colorRampSelector) {
            setupVectorControls(layerId, map, layers, config, updateLegend);
        }

        if (config.type === 'point' && config.colorRampSelector) {
            setupPointControls(layerId, map, layers, config, updateLegend);
        }
    });
    
    // Setup point layer property selector
    setupPointLayerSelector(layers);
}
/**
 * Setup point layer color ramp controls
 */
function setupPointControls(layerId, map, layers, config, updateLegend) {
    // Setup color ramp selector
    setupColorRampSelector(config.colorRampSelector, config.colorRampPreview, () => {
        updatePointLayerFromControls(layerId, layers, updateLegend);
    });
    
    const attributeSelector = document.getElementById(config.attributeSelector);
    if (attributeSelector) {
        attributeSelector.addEventListener('change', () => {
            updatePointLayerFromControls(layerId, layers, updateLegend);
        });
    }
}

/**
 * Setup point layer property selector
 */
function setupPointLayerSelector(layers) {
    // Process all point layer selectors
    Object.keys(layerConfig).forEach(layerId => {
        const config = layerConfig[layerId];
        if (config.type === 'point' && config.selectorId) {
            const selector = document.getElementById(config.selectorId);
            if (!selector) return;
            
            selector.addEventListener('change', function() {
                if (!layers.point[layerId]) return;
                
                layers.point[layerId].eachLayer(layer => {
                    if (layer.feature) {
                        updateTooltip(layer.feature, layer, config.selectorId);
                    }
                });
            });
        }
    });
}

/**
 * Setup vector layer attribute controls
 */
function setupVectorControls(layerId, map, layers, config, updateLegend) {
    // Setup color ramp selector
    setupColorRampSelector(config.colorRampSelector, config.colorRampPreview, () => {
        updateVectorLayerFromControls(layerId, layers, updateLegend);
    });
    
    // Setup attribute selector change event
    const attributeSelector = document.getElementById(config.attributeSelector);
    if (attributeSelector) {
        attributeSelector.addEventListener('change', () => {
            updateVectorLayerFromControls(layerId, layers, updateLegend);
        });
    }
}

/**
 * Update vector layer based on selected attribute and color ramp
 */
function updateVectorLayerFromControls(layerId, layers, updateLegend) {
    const config = layerConfig[layerId];
    if (!config || !layers.vector[layerId]) return;
    
    // Get selected attribute
    const attributeSelector = document.getElementById(config.attributeSelector);
    if (!attributeSelector || !attributeSelector.value) return;
    
    // Get selected color ramp
    const colorRampSelector = document.getElementById(config.colorRampSelector);
    if (!colorRampSelector || !colorRampSelector.value) return;
    
    const colorRamp = getColorRamp(colorRampSelector.value);
    if (!colorRamp) return;
    
    // Get opacity value
    const opacitySlider = document.getElementById(config.opacityControl);
    const opacity = opacitySlider ? parseFloat(opacitySlider.value) : 0.5;
    
    // Update the layer style
    updateVectorLayerStyle(
        layers.vector[layerId], 
        attributeSelector.value, 
        colorRamp, 
        opacity, 
        updateLegend
    );
}

/**
 * Setup layer toggle functionality for a specific layer
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
                
                // If vector layer, populate attribute selector
                if (config.type === 'vector' && config.attributeSelector && layers.vector[layerId]) {
                    populateAttributeSelector(layers.vector[layerId], config.attributeSelector);
                    
                    // Add this block to generate labels for admin boundaries
                    if (layerId === 'geojsonLayer' && layers.labels) {
                        // This is the admin level 1 layer
                        generateAdminLabels(layers.vector[layerId], 'adm1', layers.labels.adm1);
                    } else if (layerId === 'geojsonLayer2' && layers.labels) {
                        // This is the admin level 2 layer
                        generateAdminLabels(layers.vector[layerId], 'adm2', layers.labels.adm2);
                    }
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
 * Update point layer based on selected attribute and color ramp
 */
function updatePointLayerFromControls(layerId, layers, updateLegend) {
    const config = layerConfig[layerId];
    if (!config || !layers.point[layerId]) return;
    
    // Get selected attribute
    const attributeSelector = document.getElementById(config.attributeSelector);
    if (!attributeSelector || !attributeSelector.value) return;
    
    // Get selected color ramp
    const colorRampSelector = document.getElementById(config.colorRampSelector);
    if (!colorRampSelector || !colorRampSelector.value) return;
    
    const colorRamp = getColorRamp(colorRampSelector.value);
    if (!colorRamp) return;
    
    // Get opacity value
    const opacitySlider = document.getElementById(config.opacityControl);
    const opacity = opacitySlider ? parseFloat(opacitySlider.value) : 1;
    
    // Update the point layer style
    updatePointLayerStyle(
        layers.point[layerId], 
        attributeSelector.value, 
        colorRamp, 
        opacity, 
        updateLegend
    );
}

/**
 * Load a layer by ID
 */
async function loadLayer(layerId, map, layers, colorScales, updateLegend) {
    const config = layerConfig[layerId];
    
    switch (config.type) {
        case 'vector':
            if (!layers.vector[layerId]) {
                layers.vector[layerId] = await loadVectorLayer(config.url, { style: config.style });
            }
            layers.vector[layerId].addTo(map);
            break;
            
            case 'point':
                if (!layers.point[layerId]) {
                    layers.point[layerId] = await loadPointLayer(config.url, { 
                        selectorId: config.selectorId,
                        attributeSelector: config.attributeSelector,
                        colorRampSelector: config.colorRampSelector
                    });
                }
                layers.point[layerId].addTo(map);
                break;
            
        case 'raster':
            // Verify color scale exists
            const selectedColorScale = colorScales[config.colorScale];
            if (!selectedColorScale) {
                throw new Error(`Color scale '${config.colorScale}' not found for layer ${layerId}`);
            }
            
            if (!layers.tiff[layerId]) {
                await loadTiff(config.url, layerId, layers.tiff, map, selectedColorScale);
                console.log(`Raster Layer ${layerId} loaded:`, {
                    url: config.url,
                    bounds: layers.tiff[layerId] ? layers.tiff[layerId].getBounds() : 'N/A'
                });
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
            break;
    }
}

/**
 * Remove a layer by ID
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
                if (layers.point[layerId]) {
                    map.removeLayer(layers.point[layerId]);
                }
                break;
            
        case 'raster':
            if (layers.tiff[layerId]) {
                map.removeLayer(layers.tiff[layerId]);
                // Hide stats container
                const statsContainer = document.getElementById('stats-container');
                if (statsContainer) {
                    statsContainer.style.display = 'none';
                }
                hideLegend();
            }
            break;
    }
}

/**
 * Setup opacity control for a layer
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
        
        updateLayerOpacity(config.type, layerId, layers, this.value, updateLegend);
    });
}

/**
 * Update a layer's opacity based on type
 */
function updateLayerOpacity(layerType, layerId, layers, opacity, updateLegend) {
    switch (layerType) {
        case 'raster':
            if (layers.tiff[layerId]) {
                layers.tiff[layerId].setOpacity(opacity);
            }
            break;
            
        case 'vector':
            if (!layers.vector[layerId]) return;
            
            // Apply basic opacity
            layers.vector[layerId].setStyle({ 
                fillOpacity: opacity, 
                opacity: opacity 
            });
            
            // Update color-based styling if configured
            const config = layerConfig[layerId];
            if (config.attributeSelector && config.colorRampSelector) {
                const attributeSelector = document.getElementById(config.attributeSelector);
                const colorRampSelector = document.getElementById(config.colorRampSelector);
                
                if (attributeSelector && attributeSelector.value && 
                    colorRampSelector && colorRampSelector.value) {
                    updateVectorLayerFromControls(layerId, layers, updateLegend);
                }
            }
            break;
            
            case 'point':
                if (layers.point[layerId]) {
                    layers.point[layerId].setStyle({ 
                        fillOpacity: opacity, 
                        opacity: opacity 
                    });
                    
                    // Update color-based styling if configured
                    const config = layerConfig[layerId];
                    if (config.attributeSelector && config.colorRampSelector) {
                        updatePointLayerFromControls(layerId, layers, updateLegend);
                    }
                }
                break;
    }
}

