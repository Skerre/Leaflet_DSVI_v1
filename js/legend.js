// legend.js - Functions for managing the map legend

/**
 * Initialize the legend with default content
 */
export function initializeLegend() {
    const legend = document.getElementById('legend');
    if (!legend) return;
    
    legend.innerHTML = `
        <h4>Map Legend</h4>
        <p>Activate layers to view more information.</p>
        <div class="color-scheme">
            <p>No active layers</p>
        </div>
    `;
    legend.style.display = 'block';
}

/**
 * Update the legend content dynamically for active layers
 * @param {string} layerName - Name of the active layer
 * @param {Array} colorScheme - Array of colors
 * @param {string} description - Description of the layer
 * @param {Array} labels - Array of labels for the color scheme
 * @param {Array} values - Optional array of value ranges
 * @param {string} unit - Optional unit of measurement
 */
export function updateLegend(layerName, colorScheme, description, labels, values = null, unit = '') {
    const legend = document.getElementById('legend');
    if (!legend) return;

    // Validate inputs
    if (!labels || labels.length !== colorScheme.length) {
        console.error("Labels array does not match the number of colors in the color scheme!");
        return;
    }

    // Determine if we should show directional indicator
    const isVulnerabilityData = layerName.toLowerCase().includes('vulnerability') || 
                               layerName.toLowerCase().includes('sv') ||
                               layerName.toLowerCase().includes('social');
    
    // Create enhanced labels with value ranges and descriptive terms
    const enhancedLabels = labels.map((label, index) => {
        let enhancedLabel = label;
        
        // Add value ranges if provided
        if (values && values[index]) {
            enhancedLabel = `${values[index]} ${unit}`.trim();
        }
        
        // Add descriptive terms for vulnerability data
        if (isVulnerabilityData) {
            const vulnTerms = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
            if (index < vulnTerms.length) {
                enhancedLabel += ` (${vulnTerms[index]})`;
            }
        }
        
        return enhancedLabel;
    });

    // Add directional indicator for better interpretation
    let directionalInfo = '';
    if (colorScheme.length > 1) {
        const firstColor = colorScheme[0];
        const lastColor = colorScheme[colorScheme.length - 1];
        
        // Determine if it's a vulnerability scale (typically blue to red)
        if (isVulnerabilityData) {
            directionalInfo = `
                <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 11px; color: #666;">
                    <strong>Interpretation:</strong> ${firstColor.includes('2b83ba') || firstColor.includes('blue') ? 'Blue' : 'Light'} = Lower vulnerability, 
                    ${lastColor.includes('d7191c') || lastColor.includes('red') ? 'Red' : 'Dark'} = Higher vulnerability
                </div>
            `;
        } else {
            directionalInfo = `
                <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 11px; color: #666;">
                    <strong>Scale:</strong> Light to Dark represents Low to High values
                </div>
            `;
        }
    }

    // Build legend content
    legend.innerHTML = `
        <div style="max-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${layerName}</h4>
            <p style="margin: 0 0 12px 0; font-size: 12px; color: #666; line-height: 1.3;">${description}</p>
            <div class="color-scheme">
                <div class="color-boxes">
                    ${colorScheme
                        .map(
                            (color, index) =>
                                `<div style="display:flex; align-items:center; margin-bottom:4px;">
                                    <div style="background:${color}; width:16px; height:16px; margin-right:6px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.2);"></div>
                                    <span style="font-size: 11px; color: #333;">${enhancedLabels[index]}</span>
                                </div>`
                        )
                        .join('')}
                </div>
                ${directionalInfo}
            </div>
        </div>
    `;
    legend.style.display = 'block';
}

/**
 * Enhanced update function specifically for vector layers with value ranges
 * @param {string} layerName - Name of the active layer
 * @param {Array} colorScheme - Array of colors
 * @param {string} description - Description of the layer
 * @param {Array} valueRanges - Array of value ranges (e.g., ["0-10", "10-20", ...])
 * @param {string} unit - Unit of measurement (e.g., "%", "km", "index")
 */
export function updateVectorLegend(layerName, colorScheme, description, valueRanges, unit = '') {
    const legend = document.getElementById('legend');
    if (!legend) return;

    // Validate inputs
    if (!valueRanges || valueRanges.length !== colorScheme.length) {
        console.error("Value ranges array does not match the number of colors in the color scheme!");
        return;
    }

    const isVulnerabilityData = layerName.toLowerCase().includes('vulnerability') || 
                               layerName.toLowerCase().includes('sv') ||
                               layerName.toLowerCase().includes('social');

    // Add directional indicator
    let directionalInfo = '';
    if (isVulnerabilityData) {
        directionalInfo = `
            <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 11px; color: #666;">
                <strong>Interpretation:</strong> Lower values = Lower vulnerability, Higher values = Higher vulnerability
            </div>
        `;
    } else {
        directionalInfo = `
            <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 11px; color: #666;">
                <strong>Scale:</strong> Values increase from light to dark colors
            </div>
        `;
    }

    // Build legend content
    legend.innerHTML = `
        <div style="max-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${layerName}</h4>
            <p style="margin: 0 0 12px 0; font-size: 12px; color: #666; line-height: 1.3;">${description}</p>
            <div class="color-scheme">
                <div class="color-boxes">
                    ${colorScheme
                        .map(
                            (color, index) =>
                                `<div style="display:flex; align-items:center; margin-bottom:4px;">
                                    <div style="background:${color}; width:16px; height:16px; margin-right:6px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.2);"></div>
                                    <span style="font-size: 11px; color: #333;">${valueRanges[index]} ${unit}</span>
                                </div>`
                        )
                        .join('')}
                </div>
                ${directionalInfo}
            </div>
        </div>
    `;
    legend.style.display = 'block';
}

/**
 * Hide the legend or revert to default state
 */
export function hideLegend() {
    const legend = document.getElementById('legend');
    if (!legend) return;
    
    legend.innerHTML = `
        <h4>Map Legend</h4>
        <p>Activate layers to view more information.</p>
        <div class="color-scheme">
            <p>No active layers</p>
        </div>
    `;
}