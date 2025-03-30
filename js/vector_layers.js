// vector_layers.js - Functions for handling vector and point data
export { getColorFromRamp, formatValue, updateVectorLegend };

export function updatePointLayerStyle(layer, property, colorRamp, opacity = 1, updateLegend = null) {
    if (!layer || !property || !colorRamp?.colors) {
        console.error('Missing required parameters for updatePointLayerStyle');
        return;
    }
    
    // Get all data for classification
    const data = {
        features: []
    };
    
    // Collect all features for analysis
    layer.eachLayer(featureLayer => {
        if (featureLayer.feature) {
            data.features.push(featureLayer.feature);
        }
    });
    
    if (data.features.length === 0) return;
    
    try {
        // Update styles and tooltips
        layer.eachLayer(featureLayer => {
            if (!featureLayer.feature?.properties) return;
            
            const value = featureLayer.feature.properties[property];
            const numValue = Number(value);
            
            if (!isNaN(numValue)) {
                // Get color for this value
                const color = getColorFromRamp(
                    numValue,
                    data,
                    property,
                    colorRamp
                );
                
                // Update style
                featureLayer.setStyle({
                    fillColor: color,
                    color: '#333',
                    weight: 1,
                    fillOpacity: opacity,
                    opacity: opacity
                });
            }
            
            // Update tooltip
            const tooltipContent = value === undefined
                ? `No data for ${property}`
                : `${property}: ${formatValue(value)}`;
                
            featureLayer.unbindTooltip();
            featureLayer.bindTooltip(tooltipContent, {
                permanent: false,
                direction: 'top'
            });
        });
        
        // Update legend if function provided
        if (typeof updateLegend === 'function') {
            updateVectorLegend(layer, property, colorRamp, updateLegend);
        }
    } catch (err) {
        console.error('Error updating point layer style:', err);
    }
}

/**
 * Load a vector layer from a GeoJSON file with updated tooltip handling
 * @param {string} url - URL of the GeoJSON file
 * @param {Object} options - Options for styling and interaction
 * @returns {Promise} - Promise resolving to the created layer
 */
export function loadVectorLayer(url, options = {}) {
    const defaultStyle = {
        color: "#3388ff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5
    };

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            // Store data and create the layer
            const layerData = { 
                raw: data,
                propertyFields: getPropertyFields(data),
                selectedProperty: options.selectedProperty || null,
                colorRamp: options.colorRamp || null
            };
            
            const vectorLayer = L.geoJSON(data, {
                style: feature => {
                    // Apply styling based on property and color ramp if provided
                    if (options.selectedProperty && options.colorRamp && feature.properties) {
                        return {
                            ...getStyleOptions(options, defaultStyle, feature),
                            fillColor: getColorFromRamp(
                                feature.properties[options.selectedProperty], 
                                data, 
                                options.selectedProperty, 
                                options.colorRamp
                            )
                        };
                    } 
                    return getStyleOptions(options, defaultStyle, feature);
                },
                onEachFeature: (feature, layer) => {
                    // Set default tooltip
                    if (feature.properties) {
                        layer.bindTooltip("Select an attribute to view values", {
                            permanent: false,
                            direction: 'top'
                        });
                    }
                }
            });
            
            // Attach data to the layer for later use
            vectorLayer.layerData = layerData;
            return vectorLayer;
        });
}

/**
 * Get style options, handling function or object style definitions
 */
function getStyleOptions(options, defaultStyle, feature) {
    return typeof options.style === 'function' 
        ? options.style(feature) 
        : (options.style || defaultStyle);
}

/**
 * Update a vector layer's style based on selected property and color ramp
 * @param {Object} layer - Leaflet GeoJSON layer
 * @param {string} property - Property name to use for coloring
 * @param {Object} colorRamp - Color ramp object
 * @param {number} opacity - Layer opacity
 * @param {Function} updateLegend - Function to update the legend (optional)
 */
export function updateVectorLayerStyle(layer, property, colorRamp, opacity = 1, updateLegend = null) {
    if (!layer?.layerData || !property || !colorRamp?.colors) {
        console.error('Missing required parameters for updateVectorLayerStyle');
        return;
    }
    
    // Update the stored layer data
    layer.layerData.selectedProperty = property;
    layer.layerData.colorRamp = colorRamp;
    
    try {
        // Update styles and tooltips
        applyLayerStyle(layer, property, colorRamp, opacity);
        updateLayerTooltips(layer, property);
        
        // Update legend if a function was provided
        if (typeof updateLegend === 'function') {
            updateVectorLegend(layer, property, colorRamp, updateLegend);
        }
    } catch (err) {
        console.error('Error updating vector layer style:', err);
    }
}

/**
 * Apply style updates to a layer
 */
function applyLayerStyle(layer, property, colorRamp, opacity) {
    layer.setStyle(feature => {
        if (!feature?.properties) {
            return { fillOpacity: opacity, opacity: opacity };
        }
        
        return {
            fillColor: getColorFromRamp(
                feature.properties[property], 
                layer.layerData.raw, 
                property, 
                colorRamp
            ),
            fillOpacity: opacity,
            opacity: opacity,
            weight: 2,
            color: '#333'
        };
    });
}

/**
 * Update tooltips for each feature in a layer
 */
function updateLayerTooltips(layer, property) {
    layer.eachLayer(featureLayer => {
        if (!featureLayer.feature?.properties) return;
        
        const value = featureLayer.feature.properties[property];
        const tooltipContent = value === undefined
            ? `No data for ${property}`
            : `${property}: ${formatValue(value)}`;
            
        featureLayer.unbindTooltip();
        featureLayer.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top'
        });
    });
}

/**
 * Format a value for display in tooltips
 */
function formatValue(value) {
    return typeof value === 'number' 
        ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
        : value;
}

/**
 * Get a color from a ramp based on a value using quantile classification
 * @param {number|string} value - Value to determine color
 * @param {Object} data - GeoJSON data
 * @param {string} property - Property name to use for values
 * @param {Object} colorRamp - Color ramp with colors array
 * @returns {string} - Color hex code
 */
function getColorFromRamp(value, data, property, colorRamp) {
    // Validation
    if (!colorRamp?.colors?.length) {
        return '#CCCCCC'; // Default gray if invalid
    }
    
    // Handle non-numeric values
    const numValue = Number(value);
    if (isNaN(numValue)) {
        return colorRamp.colors[0];
    }
    
    // Get all property values for classification
    const values = data.features
        .map(feature => feature.properties[property])
        .filter(val => val !== undefined && val !== null)
        .map(val => Number(val))
        .filter(val => !isNaN(val))
        .sort((a, b) => a - b);
    
    if (values.length === 0) return colorRamp.colors[0];
    
    // Calculate quantile breaks
    const numClasses = colorRamp.colors.length;
    const breaks = calculateQuantileBreaks(values, numClasses);
    
    // Find the appropriate class
    for (let i = 0; i < breaks.length - 1; i++) {
        if (numValue >= breaks[i] && numValue <= breaks[i+1]) {
            return colorRamp.colors[Math.min(i, colorRamp.colors.length - 1)];
        }
    }
    
    return colorRamp.colors[colorRamp.colors.length - 1];
}

/**
 * Calculate quantile breaks for classification
 */
function calculateQuantileBreaks(values, numClasses) {
    const breaks = [];
    for (let i = 0; i < numClasses; i++) {
        const index = Math.floor((i / numClasses) * values.length);
        breaks.push(values[index]);
    }
    
    // Ensure the last break includes the maximum value
    if (breaks[breaks.length - 1] !== values[values.length - 1]) {
        breaks.push(values[values.length - 1]);
    }
    
    return breaks;
}

/**
 * Update the legend for a vector layer based on attribute and color ramp
 */
function updateVectorLegend(layer, property, colorRamp, updateLegend) {
    const values = layer.layerData.raw.features
        .map(feature => feature.properties[property])
        .filter(val => val !== undefined && val !== null)
        .map(val => typeof val === 'number' ? val : Number(val))
        .filter(val => !isNaN(val))
        .sort((a, b) => a - b);
    
    if (values.length === 0) return;
    
    // Calculate breaks and format labels
    const numClasses = colorRamp.colors.length;
    const breaks = calculateQuantileBreaks(values, numClasses);
    const labels = formatLegendLabels(breaks);
    
    // Update legend
    updateLegend(
        property,
        colorRamp.colors,
        `Distribution by quantiles (${numClasses} classes)`,
        labels.slice(0, numClasses)
    );
}

/**
 * Format legend labels from break values
 */
function formatLegendLabels(breaks) {
    const labels = [];
    for (let i = 0; i < breaks.length - 1; i++) {
        labels.push(`${formatValue(breaks[i])} - ${formatValue(breaks[i + 1])}`);
    }
    return labels;
}

/**
 * Get property fields from GeoJSON data
 */
function getPropertyFields(geojsonData) {
    if (geojsonData?.features?.[0]?.properties) {
        return Object.keys(geojsonData.features[0].properties);
    }
    return [];
}

export function loadPointLayer(url, options = {}) {
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            // Populate property selector if specified
            if (options.selectorId) {
                populateDropdown(data, options.selectorId);
            }

            // Create the point layer
            const pointLayer = L.geoJSON(data, {
                pointToLayer: options.pointToLayer || createDefaultMarker,
                onEachFeature: (feature, layer) => {
                    if (options.tooltipFunction) {
                        options.tooltipFunction(feature, layer);
                    } else {
                        updateTooltip(feature, layer, options.selectorId || 'pointValueSelector');
                    }
                }
            });
            
            // Store property fields for later use (similar to vector layers)
            pointLayer.layerData = {
                raw: data,
                propertyFields: getPropertyFields(data),
                selectedProperty: options.selectedProperty || null,
                colorRamp: options.colorRamp || null
            };
            
            return pointLayer;
        });
}

/**
 * Create default marker for point layer
 */
function createDefaultMarker(feature, latlng) {
    return L.circleMarker(latlng, {
        radius: 5,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    });
}

/**
 * Update tooltip based on selected property
 */
export function updateTooltip(feature, layer, selectorId = 'pointValueSelector') {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    const selectedProperty = selector.value;
    const value = feature.properties?.[selectedProperty];
    
    layer.bindTooltip(
        value !== undefined 
            ? `Value: ${value}` 
            : 'No value available', 
        { permanent: false, direction: 'top' }
    );
}

/**
 * Populate dropdowns with properties from GeoJSON data
 */
export function populateDropdown(data, selectorId) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    selector.innerHTML = ''; // Clear existing options
    
    const properties = data.features?.[0]?.properties
        ? Object.keys(data.features[0].properties)
        : [];
        
    if (properties.length === 0) {
        console.error('No properties found in the GeoJSON data.');
        return;
    }

    properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop;
        option.textContent = prop;
        selector.appendChild(option);
    });
}

/**
 * Populate attribute selector with fields from a layer, excluding NAME_1 and NAME_2
 * @param {Object} layer - Vector layer with GeoJSON data
 * @param {string} selectorId - ID of the select element to populate
 */
export function populateAttributeSelector(layer, selectorId) {
    if (!layer?.layerData?.propertyFields) return;
    
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    // Clear and populate selector
    selector.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select attribute...';
    selector.appendChild(defaultOption);
    
    // Define fields to exclude
    const excludeFields = ['fid','GID_0','GID_1', 'GID_2','NAME_1', 'NAME_2', 'Cercle/District'];
    
    // Add property options, excluding the specified fields
    layer.layerData.propertyFields
        .filter(prop => !excludeFields.includes(prop))
        .forEach(prop => {
            const option = document.createElement('option');
            option.value = prop;
            option.textContent = prop;
            selector.appendChild(option);
        });
}