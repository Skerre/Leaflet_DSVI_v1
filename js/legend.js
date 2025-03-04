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
 */
export function updateLegend(layerName, colorScheme, description, labels) {
    const legend = document.getElementById('legend');
    if (!legend) return;

    // Validate inputs
    if (!labels || labels.length !== colorScheme.length) {
        console.error("Labels array does not match the number of colors in the color scheme!");
        return;
    }

    // Build legend content
    legend.innerHTML = `
        <h4>${layerName}</h4>
        <p>${description}</p>
        <div class="color-scheme">
            <p>Color Scheme:</p>
            <div class="color-boxes">
                ${colorScheme
                    .map(
                        (color, index) =>
                            `<div style="display:flex; align-items:center; margin-bottom:5px;">
                                <div style="background:${color}; width:20px; height:20px; margin-right:5px;"></div>
                                <span>${labels[index]}</span>
                            </div>`
                    )
                    .join('')}
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