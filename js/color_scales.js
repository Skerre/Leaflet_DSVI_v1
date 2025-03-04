// color_scales.js - Color scale definitions for data visualization

/**
 * Color scales for different data layers
 */
export const colorScales = {
    // Cell tower density color scale
    cellTowerDensity: {
        ranges: [0, 2, 5, 10, 25],
        colors: ['#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'], // Blue to Red
    },
    
    // Population density color scale
    populationDensity: {
        ranges: [0, 25, 50, 75, 100],
        colors: ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333'], // White to Dark Gray
    },
    
    // Social vulnerability color scale
    socialVulnerability: {
        ranges: [0, 0.2, 0.4, 0.6, 0.8, 1],
        colors: ['#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'], // Blue to Red
    },
    
    // Relative wealth color scale
    relativeWealth: {
        ranges: [0.1, 2, 4, 6, 8, 10],
        colors: ['#0000FF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'], // Blue to Red
    }
};

/**
 * Generate a color scale based on a min, max, and color ramp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {Array} colorRamp - Array of color hex codes
 * @param {number} steps - Number of steps in the scale
 * @returns {Object} - Color scale object with ranges and colors
 */
export function generateColorScale(min, max, colorRamp, steps = 5) {
    const range = max - min;
    const stepSize = range / steps;
    
    const ranges = [];
    for (let i = 0; i <= steps; i++) {
        ranges.push(min + (stepSize * i));
    }
    
    return {
        ranges: ranges,
        colors: colorRamp
    };
}

/**
 * Predefined color ramps for different types of data, each with 5 classes
 */
export const colorRamps = {
    blueToRed: {
        name: 'Blue to Red',
        colors: ['#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c']
    },
    redToBlue: {
        name: 'Red to Blue',
        colors: ['#d7191c', '#fdae61', '#ffffbf', '#abd9e9', '#2c7bb6']
    },
    whiteToBlack: {
        name: 'White to Black',
        colors: ['#ffffff', '#d9d9d9', '#bdbdbd', '#737373', '#252525']
    },
    purpleToOrange: {
        name: 'Purple to Orange',
        colors: ['#7b3294', '#c2a5cf', '#f7f7f7', '#fdae61', '#e66101']
    },
    greenToRed: {
        name: 'Green to Red',
        colors: ['#1a9641', '#a6d96a', '#ffffbf', '#fdae61', '#d7191c']
    },
    blueToYellow: {
        name: 'Blue to Yellow',
        colors: ['#0571b0', '#92c5de', '#f7f7f7', '#f4a582', '#ca0020']
    },
    // Popular QGIS/CartoDB color schemes
    viridis: {
        name: 'Viridis',
        colors: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725']
    },
    magma: {
        name: 'Magma',
        colors: ['#000004', '#51127c', '#b73779', '#fb8761', '#fcfdbf']
    },
    plasma: {
        name: 'Plasma',
        colors: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636']
    },
    inferno: {
        name: 'Inferno',
        colors: ['#000004', '#420a68', '#932667', '#dd513a', '#fca50a']
    },
    spectral: {
        name: 'Spectral',
        colors: ['#9e0142', '#f46d43', '#ffffbf', '#66c2a5', '#5e4fa2']
    },
    rdYlGn: {
        name: 'Red-Yellow-Green',
        colors: ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850']
    },
    rdYlBu: {
        name: 'Red-Yellow-Blue',
        colors: ['#d73027', '#fc8d59', '#ffffbf', '#91bfdb', '#4575b4']
    }
};