// info_popup.js - Information popup functionality

/**
 * Initialize the information popup system
 */
export function initializeInfoPopup() {
    const popup = document.getElementById('info-popup');
    const closeBtn = document.getElementById('info-popup-close');
    
    if (!popup || !closeBtn) {
        console.error('Info popup elements not found');
        return;
    }
    
    // Close popup when clicking close button
    closeBtn.addEventListener('click', hideInfoPopup);
    
    // Close popup when clicking outside
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            hideInfoPopup();
        }
    });
    
    // Close popup with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && popup.style.display !== 'none') {
            hideInfoPopup();
        }
    });
}

/**
 * Show the information popup with data for a clicked feature
 * @param {Object} feature - GeoJSON feature object
 * @param {string} layerType - Type of layer (e.g., 'sv-admin1', 'sv-admin2', etc.)
 */
export function showInfoPopup(feature, layerType = 'default') {
    const popup = document.getElementById('info-popup');
    const title = document.getElementById('info-popup-title');
    const body = document.getElementById('info-popup-body');
    
    if (!popup || !title || !body || !feature?.properties) {
        return;
    }
    
    // Set title based on layer type and available name fields
    const areaName = getAreaName(feature.properties, layerType);
    title.textContent = areaName || 'Area Information';
    
    // Generate content based on layer type
    const content = generatePopupContent(feature.properties, layerType);
    body.innerHTML = content;
    
    // Show popup
    popup.style.display = 'block';
}

/**
 * Hide the information popup
 */
export function hideInfoPopup() {
    const popup = document.getElementById('info-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

/**
 * Get the appropriate area name from properties
 * @param {Object} properties - Feature properties
 * @param {string} layerType - Type of layer
 * @returns {string} - Area name
 */
function getAreaName(properties, layerType) {
    // Priority order for name fields
    const nameFields = [
        'NAME_1', 'NAME_2', 'NAME_3',
        'Cercle/District', 'District', 'Commune',
        'name', 'Name', 'AREA_NAME',
        'ADM1_NAME', 'ADM2_NAME', 'ADM3_NAME'
    ];
    
    for (const field of nameFields) {
        if (properties[field] && properties[field].trim()) {
            return properties[field].trim();
        }
    }
    
    return 'Unknown Area';
}

/**
 * Generate popup content based on layer type and properties
 * @param {Object} properties - Feature properties
 * @param {string} layerType - Type of layer
 * @returns {string} - HTML content for popup
 */
function generatePopupContent(properties, layerType) {
    let content = '';
    
    // Administrative Information Section
    content += generateAdministrativeSection(properties);
    
    // Social Vulnerability Section (if applicable)
    if (layerType.includes('sv-admin') || properties.Social-Vulnerability !== undefined) {
        content += generateSocialVulnerabilitySection(properties);
    }
    
    // Statistics Section
    content += generateStatisticsSection(properties, layerType);
    
    // Additional Data Section
    content += generateAdditionalDataSection(properties);
    
    return content || '<p class="info-no-data">No detailed information available for this area.</p>';
}

/**
 * Generate administrative information section
 * @param {Object} properties - Feature properties
 * @returns {string} - HTML content
 */
function generateAdministrativeSection(properties) {
    const adminFields = {
        'Country': ['COUNTRY', 'GID_0', 'NAME_0'],
        'Region/State': ['NAME_1', 'ADM1_NAME', 'REGION'],
        'District/Province': ['NAME_2', 'ADM2_NAME', 'Cercle/District'],
        'Commune/Local': ['NAME_3', 'ADM3_NAME', 'COMMUNE'],
        'Administrative ID': ['GID_1', 'GID_2', 'GID_3', 'ADMIN_ID']
    };
    
    let content = '<div class="info-section"><h4>Administrative Information</h4>';
    let hasData = false;
    
    Object.entries(adminFields).forEach(([label, fields]) => {
        const value = getFirstAvailableValue(properties, fields);
        if (value) {
            content += createInfoItem(label, value);
            hasData = true;
        }
    });
    
    if (!hasData) {
        content += '<p class="info-no-data">No administrative information available.</p>';
    }
    
    content += '</div>';
    return content;
}

/**
 * Generate social vulnerability section
 * @param {Object} properties - Feature properties
 * @returns {string} - HTML content
 */
function generateSocialVulnerabilitySection(properties) {
    let content = '<div class="info-section"><h4>Social Vulnerability</h4>';
    
    // Main Social-Vulnerability score
    if (properties.Social-Vulnerability !== undefined) {
        const svValue = formatValue(properties.Social-Vulnerability);
        const svCategory = categorizeSVScore(properties.Social-Vulnerability);
        content += createInfoItem('Social-Vulnerability Score', `${svValue} (${svCategory})`, true);
    }
    
    // Look for other vulnerability-related fields
    const vulnerabilityFields = {
        'Poverty Rate': ['POVERTY_RATE', 'poverty', 'poor_rate'],
        'Education Index': ['EDUCATION', 'education_index', 'EDU_INDEX'],
        'Health Index': ['HEALTH', 'health_index', 'HEALTH_IDX'],
        'Infrastructure': ['INFRASTRUCTURE', 'infra_index', 'INFRA'],
        'Economic Index': ['ECONOMIC', 'econ_index', 'ECO_INDEX']
    };
    
    let hasVulnData = properties.Social-Vulnerability !== undefined;
    
    Object.entries(vulnerabilityFields).forEach(([label, fields]) => {
        const value = getFirstAvailableValue(properties, fields);
        if (value !== null) {
            content += createInfoItem(label, formatValue(value));
            hasVulnData = true;
        }
    });
    
    if (!hasVulnData) {
        content += '<p class="info-no-data">No social vulnerability data available.</p>';
    }
    
    content += '</div>';
    return content;
}

/**
 * Generate statistics section
 * @param {Object} properties - Feature properties
 * @param {string} layerType - Type of layer
 * @returns {string} - HTML content
 */
function generateStatisticsSection(properties, layerType) {
    const statsFields = {
        'Population': ['POPULATION', 'POP', 'pop_total', 'total_pop'],
        'Area (km²)': ['AREA', 'area_km2', 'AREA_KM2', 'Shape_Area'],
        'Density': ['DENSITY', 'pop_density', 'POP_DENS'],
        'Households': ['HOUSEHOLDS', 'HH', 'households_total'],
        'GDP per Capita': ['GDP_PC', 'gdp_per_capita', 'GDP_PERCAP']
    };
    
    let content = '<div class="info-section"><h4>Key Statistics</h4>';
    let hasStats = false;
    
    Object.entries(statsFields).forEach(([label, fields]) => {
        const value = getFirstAvailableValue(properties, fields);
        if (value !== null) {
            content += createInfoItem(label, formatValue(value));
            hasStats = true;
        }
    });
    
    if (!hasStats) {
        content += '<p class="info-no-data">No statistical data available.</p>';
    }
    
    content += '</div>';
    return content;
}

/**
 * Generate additional data section for other available fields
 * @param {Object} properties - Feature properties
 * @returns {string} - HTML content
 */
function generateAdditionalDataSection(properties) {
    // Fields to exclude from additional data (already shown in other sections)
    const excludeFields = new Set([
        'fid', 'GID_0', 'GID_1', 'GID_2', 'GID_3',
        'NAME_0', 'NAME_1', 'NAME_2', 'NAME_3',
        'Cercle/District', 'COUNTRY', 'REGION',
        'ADM1_NAME', 'ADM2_NAME', 'ADM3_NAME',
        'ADMIN_ID', 'Social-Vulnerability', 'POPULATION', 'POP',
        'AREA', 'DENSITY', 'HOUSEHOLDS', 'GDP_PC',
        'Shape_Area', 'Shape_Length'
    ]);
    
    let content = '<div class="info-section"><h4>Additional Data</h4>';
    let hasAdditionalData = false;
    
    Object.entries(properties).forEach(([key, value]) => {
        if (!excludeFields.has(key) && value !== null && value !== undefined && value !== '') {
            content += createInfoItem(key.replace(/_/g, ' '), formatValue(value));
            hasAdditionalData = true;
        }
    });
    
    if (!hasAdditionalData) {
        content += '<p class="info-no-data">No additional data available.</p>';
    }
    
    content += '</div>';
    return content;
}

/**
 * Get the first available value from a list of field names
 * @param {Object} properties - Feature properties
 * @param {Array} fields - Array of field names to check
 * @returns {*} - First available value or null
 */
function getFirstAvailableValue(properties, fields) {
    for (const field of fields) {
        if (properties[field] !== undefined && properties[field] !== null && properties[field] !== '') {
            return properties[field];
        }
    }
    return null;
}

/**
 * Create an info item HTML element
 * @param {string} label - Label for the item
 * @param {*} value - Value to display
 * @param {boolean} highlight - Whether to highlight the value
 * @returns {string} - HTML string
 */
function createInfoItem(label, value, highlight = false) {
    const highlightClass = highlight ? ' highlight' : '';
    return `
        <div class="info-item">
            <span class="info-label">${label}:</span>
            <span class="info-value${highlightClass}">${value}</span>
        </div>
    `;
}

/**
 * Format a value for display
 * @param {*} value - Value to format
 * @returns {string} - Formatted value
 */
function formatValue(value) {
    if (value === null || value === undefined) {
        return 'N/A';
    }
    
    if (typeof value === 'number') {
        // Format numbers with appropriate precision
        if (value > 1000000) {
            return (value / 1000000).toFixed(2) + 'M';
        } else if (value > 1000) {
            return (value / 1000).toFixed(1) + 'K';
        } else if (value % 1 !== 0) {
            return value.toFixed(3);
        }
        return value.toLocaleString();
    }
    
    return String(value);
}

/**
 * Categorize Social Vulnerability score
 * @param {number} score - Social-Vulnerability score
 * @returns {string} - Category label
 */
function categorizeSVScore(score) {
    if (score < 0.2) return 'Very Low';
    if (score < 0.4) return 'Low';
    if (score < 0.6) return 'Medium';
    if (score < 0.8) return 'High';
    return 'Very High';
}

/**
 * Add click handler to a layer for showing info popup
 * @param {Object} layer - Leaflet layer
 * @param {string} layerType - Type of layer
 */
export function addInfoPopupHandler(layer, layerType = 'default') {
    if (!layer || !layer.eachLayer) return;
    
    layer.eachLayer(function(featureLayer) {
        if (featureLayer.feature) {
            featureLayer.on('click', function(e) {
                // Prevent event propagation
                L.DomEvent.stopPropagation(e);
                
                // Show info popup
                showInfoPopup(featureLayer.feature, layerType);
            });
            
            // Change cursor on hover
            featureLayer.on('mouseover', function() {
                featureLayer._path.style.cursor = 'pointer';
            });
            
            featureLayer.on('mouseout', function() {
                featureLayer._path.style.cursor = '';
            });
        }
    });
}