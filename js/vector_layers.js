// vector_layers.js - Functions for handling vector and point data

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
            // Store the raw data for later reference (for when attributes change)
            const layerData = { 
                raw: data,
                propertyFields: getPropertyFields(data),
                selectedProperty: options.selectedProperty || null,
                colorRamp: options.colorRamp || null
            };
            
            // Create the vector layer
            const vectorLayer = L.geoJSON(data, {
                style: feature => {
                    // If a property is selected and a color ramp is defined, apply it
                    if (options.selectedProperty && options.colorRamp && feature.properties) {
                        const value = feature.properties[options.selectedProperty];
                        return Object.assign({}, 
                            typeof options.style === 'function' ? options.style(feature) : (options.style || defaultStyle),
                            { fillColor: getColorFromRamp(value, data, options.selectedProperty, options.colorRamp) }
                        );
                    } else {
                        return typeof options.style === 'function' ? options.style(feature) : (options.style || defaultStyle);
                    }
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        // Initialize with a default tooltip
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
 * Update the tooltip content for a vector layer feature based on selected property
 * 
 * @param {Object} feature - GeoJSON feature
 * @param {Object} layer - Leaflet layer
 * @param {string} selectedProperty - Selected property name
 */
function updateVectorTooltip(feature, layer, selectedProperty) {
    if (!feature.properties) {
        layer.unbindTooltip();
        layer.bindTooltip("No properties available", {
            permanent: false,
            direction: 'top'
        });
        return;
    }
    
    if (!selectedProperty) {
        // If no property is selected, show a default tooltip
        layer.unbindTooltip();
        layer.bindTooltip("Select an attribute to view values", {
            permanent: false,
            direction: 'top'
        });
        return;
    }
    
    const value = feature.properties[selectedProperty];
    if (value === undefined) {
        layer.unbindTooltip();
        layer.bindTooltip(`No data for ${selectedProperty}`, {
            permanent: false,
            direction: 'top'
        });
        return;
    }
    
    // Format the tooltip to show only the selected property
    const formattedValue = typeof value === 'number' ? value.toLocaleString(undefined, {
        maximumFractionDigits: 2
    }) : value;
    
    // Unbind any existing tooltip and bind a new one
    layer.unbindTooltip();
    layer.bindTooltip(`${selectedProperty}: ${formattedValue}`, {
        permanent: false,
        direction: 'top'
    });
}

/**
 * Get property fields from the first feature in a GeoJSON object
 * @param {Object} geojsonData - GeoJSON data
 * @returns {Array} - Array of property field names
 */
function getPropertyFields(geojsonData) {
    if (geojsonData && geojsonData.features && geojsonData.features.length > 0 && geojsonData.features[0].properties) {
        return Object.keys(geojsonData.features[0].properties);
    }
    return [];
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
    // Ensure colorRamp and colors array exist
    if (!colorRamp || !colorRamp.colors || !Array.isArray(colorRamp.colors) || colorRamp.colors.length === 0) {
        console.error('Invalid color ramp:', colorRamp);
        return '#CCCCCC'; // Default gray color if color ramp is invalid
    }
    
    // Convert value to number if possible
    const numValue = Number(value);
    if (isNaN(numValue)) {
        // For non-numeric values, use a random color from the ramp
        return colorRamp.colors[Math.floor(Math.random() * colorRamp.colors.length)];
    }
    
    // Collect all numeric values for this property
    const values = data.features
        .map(feature => feature.properties[property])
        .filter(val => val !== undefined && val !== null)
        .map(val => Number(val))
        .filter(val => !isNaN(val));
    
    if (values.length === 0) {
        console.error('No valid numeric values found for property:', property);
        return colorRamp.colors[0];
    }
    
    // Sort values for quantile calculation
    values.sort((a, b) => a - b);
    
    // Default to 5 classes if not specified
    const numClasses = colorRamp.colors.length || 5;
    
    // Calculate quantile breaks (Equal Count/Quantile method)
    const breaks = [];
    for (let i = 0; i < numClasses; i++) {
        const index = Math.floor((i / numClasses) * values.length);
        breaks.push(values[index]);
    }
    // Add the maximum value as the final break
    if (breaks[breaks.length - 1] !== values[values.length - 1]) {
        breaks.push(values[values.length - 1]);
    }
    
    // Find which class the value falls into
    for (let i = 0; i < breaks.length - 1; i++) {
        if (numValue >= breaks[i] && numValue <= breaks[i+1]) {
            return colorRamp.colors[Math.min(i, colorRamp.colors.length - 1)];
        }
    }
    
    // Default to the last color if somehow we didn't find a match
    return colorRamp.colors[colorRamp.colors.length - 1];
}

/**
 * Update the legend for a vector layer based on attribute and color ramp
 * @param {Object} layer - Leaflet GeoJSON layer
 * @param {string} property - Property name being displayed
 * @param {Object} colorRamp - Color ramp object
 * @param {Function} updateLegend - Function to update the legend UI
 */
function updateVectorLegend(layer, property, colorRamp, updateLegend) {
    // Collect all values for the property
    const values = layer.layerData.raw.features
        .map(feature => feature.properties[property])
        .filter(val => val !== undefined && val !== null)
        .map(val => typeof val === 'number' ? val : Number(val))
        .filter(val => !isNaN(val));
    
    if (values.length === 0) return;
    
    // Sort values for quantile calculation
    values.sort((a, b) => a - b);
    
    // Calculate quantile breaks (Equal Count/Quantile method)
    const numClasses = colorRamp.colors.length;
    const breaks = [];
    for (let i = 0; i <= numClasses; i++) {
        const index = Math.min(Math.floor((i / numClasses) * values.length), values.length - 1);
        breaks.push(values[index]);
    }
    
    // Format breaks as readable labels
    const labels = [];
    for (let i = 0; i < breaks.length - 1; i++) {
        const start = formatValue(breaks[i]);
        const end = formatValue(breaks[i + 1]);
        labels.push(`${start} - ${end}`);
    }
    
    // Call the updateLegend function with the property name, colors, and labels
    updateLegend(
        `${property}`,
        colorRamp.colors,
        `Distribution by quantiles (${numClasses} classes)`,
        labels.slice(0, numClasses)
    );
}


/**
 * Format a numeric value for display in the legend
 * @param {number} value - Numeric value to format
 * @returns {string} - Formatted value string
 */
function formatValue(value) {
    if (Math.abs(value) >= 1000) {
        return value.toLocaleString(undefined, {
            maximumFractionDigits: 0
        });
    } else if (Math.abs(value) >= 1) {
        return value.toLocaleString(undefined, {
            maximumFractionDigits: 1
        });
    } else {
        return value.toLocaleString(undefined, {
            maximumFractionDigits: 2
        });
    }
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
    if (!layer || !layer.layerData || !property) {
        console.error('Missing required parameters for updateVectorLayerStyle:', 
            { hasLayer: !!layer, hasLayerData: !!(layer && layer.layerData), property });
        return;
    }
    
    if (!colorRamp || !colorRamp.colors) {
        console.error('Invalid color ramp:', colorRamp);
        return;
    }
    
    console.log('Updating vector layer style with:', 
        { property, colorRamp: colorRamp.colors.length + ' colors', opacity });
    
    // Update the stored layer data
    layer.layerData.selectedProperty = property;
    layer.layerData.colorRamp = colorRamp;
    
    // Ensure opacity is a valid number
    const validOpacity = opacity !== undefined && !isNaN(opacity) ? opacity : 1;
    
    try {
        // Update the style for each feature
        layer.setStyle(feature => {
            if (!feature || !feature.properties) {
                return { fillOpacity: validOpacity, opacity: validOpacity };
            }
            
            const value = feature.properties[property];
            
            return {
                fillColor: getColorFromRamp(value, layer.layerData.raw, property, colorRamp),
                fillOpacity: validOpacity,
                opacity: validOpacity,
                // Maintain other style properties
                weight: 2,
                color: '#333'
            };
        });
        
        // Update tooltips for each feature layer
        layer.eachLayer(featureLayer => {
            if (featureLayer.feature) {
                // Update tooltip content for this feature
                const feature = featureLayer.feature;
                if (!feature.properties) return;
                
                const value = feature.properties[property];
                if (value === undefined) {
                    featureLayer.unbindTooltip();
                    featureLayer.bindTooltip(`No data for ${property}`, {
                        permanent: false,
                        direction: 'top'
                    });
                    return;
                }
                
                // Format the tooltip to show only the selected property
                const formattedValue = typeof value === 'number' ? value.toLocaleString(undefined, {
                    maximumFractionDigits: 2
                }) : value;
                
                // Unbind any existing tooltip and bind a new one
                featureLayer.unbindTooltip();
                featureLayer.bindTooltip(`${property}: ${formattedValue}`, {
                    permanent: false,
                    direction: 'top'
                });
            }
        });
        
        // Update legend if a function was provided
        if (typeof updateLegend === 'function') {
            updateVectorLegend(layer, property, colorRamp, updateLegend);
        }
    } catch (err) {
        console.error('Error updating vector layer style:', err);
    }
}


/**
 * Load point data from a GeoJSON file
 * @param {string} url - URL of the GeoJSON file
 * @param {Object} options - Options for styling and interaction
 * @returns {Promise} - Promise resolving to the created layer
 */
export function loadPointLayer(url, options = {}) {
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            // Populate property selector dropdown if specified
            if (options.selectorId) {
                populateDropdown(data, options.selectorId);
            }

            // Create the point layer
            const pointsLayer = L.geoJSON(data, {
                pointToLayer: options.pointToLayer || ((feature, latlng) => {
                    return L.circleMarker(latlng, {
                        radius: 5,
                        fillColor: "#ff7800",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                }),
                onEachFeature: (feature, layer) => {
                    if (options.tooltipFunction) {
                        options.tooltipFunction(feature, layer);
                    } else {
                        updateTooltip(feature, layer, options.selectorId || 'pointValueSelector');
                    }
                }
            });
            
            return pointsLayer;
        });
}

/**
 * Update tooltip based on selected property
 * @param {Object} feature - GeoJSON feature
 * @param {Object} layer - Leaflet layer
 * @param {string} selectorId - ID of select element
 */
export function updateTooltip(feature, layer, selectorId = 'pointValueSelector') {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    const selectedProperty = selector.value;

    if (feature.properties && feature.properties[selectedProperty] !== undefined) {
        layer.bindTooltip(`Value: ${feature.properties[selectedProperty]}`, {
            permanent: false,
            direction: 'top'
        });
    } else {
        layer.bindTooltip('No value available', {
            permanent: false,
            direction: 'top'
        });
    }
}

/**
 * Populate a dropdown with feature properties
 * @param {Object} data - GeoJSON data
 * @param {string} selectorId - ID of select element
 */
export function populateDropdown(data, selectorId) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    selector.innerHTML = ''; // Clear existing options
    
    const firstFeature = data.features[0];
    if (firstFeature && firstFeature.properties) {
        const properties = Object.keys(firstFeature.properties);

        properties.forEach(prop => {
            const option = document.createElement('option');
            option.value = prop;
            option.textContent = prop;
            selector.appendChild(option);
        });
    } else {
        console.error('No properties found in the GeoJSON data.');
    }
}

/**
 * Populate a dropdown with property fields from a layer
 * @param {Object} layer - Leaflet GeoJSON layer
 * @param {string} selectorId - ID of the select element
 */
export function populateAttributeSelector(layer, selectorId) {
    if (!layer || !layer.layerData || !layer.layerData.propertyFields) return;
    
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    // Clear existing options
    selector.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select attribute...';
    selector.appendChild(defaultOption);
    
    // Add property options
    layer.layerData.propertyFields.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop;
        option.textContent = prop;
        selector.appendChild(option);
    });
}