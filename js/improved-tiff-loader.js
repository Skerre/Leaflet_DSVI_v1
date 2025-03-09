// improved-tiff-loader.js

/**
 * Add hover tooltip functionality to display raster values
 * @param {Object} map - Leaflet map instance
 * @param {Array} rasterArray - Array of raster values
 * @param {Object} bounds - Bounds of the raster layer
 * @param {number} width - Width of the raster in pixels
 * @param {number} height - Height of the raster in pixels
 * @param {string} layerName - Name of the layer
 * @param {Object} tiffLayers - Object to store tiff layers
 */
function addHoverTooltip(map, rasterArray, bounds, width, height, layerName, tiffLayers) {
    // Create a tooltip instance
    const tooltip = L.tooltip({ permanent: false, direction: 'top', offset: [0, -10] });
    
    // Event: Mouse moves on the map
    function onMouseMove(e) {
        if (!bounds.contains(e.latlng)) {
            map.closeTooltip(tooltip);
            return;
        }

        const latLng = e.latlng;
        const x = Math.floor((latLng.lng - bounds.getWest()) / (bounds.getEast() - bounds.getWest()) * width);
        const y = Math.floor((bounds.getNorth() - latLng.lat) / (bounds.getNorth() - bounds.getSouth()) * height);

        const index = y * width + x;

        if (x >= 0 && x < width && y >= 0 && y < height) {
            const value = rasterArray[index];
            if (value !== undefined && !isNaN(value)) {
                tooltip.setLatLng(e.latlng).setContent(`Value: ${value.toFixed(2)}`);
                tooltip.addTo(map);
            } else {
                map.closeTooltip(tooltip);
            }
        } else {
            map.closeTooltip(tooltip);
        }
    }

    // Event: Mouse leaves the map
    function onMouseOut() {
        map.closeTooltip(tooltip);
    }

    // Attach events when the raster layer is added
    function attachEvents() {
        map.on('mousemove', onMouseMove);
        map.on('mouseout', onMouseOut);
    }

    // Detach events when the raster layer is removed
    function detachEvents() {
        map.off('mousemove', onMouseMove);
        map.off('mouseout', onMouseOut);
        map.closeTooltip(tooltip);
    }

    // Bind events to the layer lifecycle
    if (tiffLayers[layerName] && tiffLayers[layerName].on) {
        tiffLayers[layerName].on('add', attachEvents);
        tiffLayers[layerName].on('remove', detachEvents);
    }

    // Explicitly attach events if the layer is already on the map
    if (map.hasLayer(tiffLayers[layerName])) {
        attachEvents();
    }
}

/**
 * Alternative method using native Leaflet with improved rendering
 * @param {string} url - URL of the GeoTIFF file
 * @param {string} layerName - Layer name identifier
 * @param {Object} tiffLayers - Object to store the tiff layers
 * @param {Object} map - Leaflet map instance
 * @param {Object} colorScale - Color scale configuration
 */
export async function loadTiffAdvanced(url, layerName, tiffLayers, map, colorScale) {
    // Add validation for colorScale
    if (!colorScale || !colorScale.ranges || !colorScale.colors) {
        console.error(`Invalid colorScale for ${layerName}:`, colorScale);
        throw new Error(`Invalid colorScale for layer "${layerName}". The colorScale must have ranges and colors properties.`);
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();

    const tiePoint = image.getTiePoints()[0];
    const pixelScale = image.getFileDirectory().ModelPixelScale;

    const minX = tiePoint.x;
    const maxY = tiePoint.y;
    const maxX = minX + pixelScale[0] * image.getWidth();
    const minY = maxY - pixelScale[1] * image.getHeight();

    const bounds = L.latLngBounds([
        [minY, minX],
        [maxY, maxX]
    ]);

    const rasterData = await image.readRasters();
    const rasterArray = rasterData[0]; // Assume single-band TIFF
    
    // Get min and max values for better color mapping
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < rasterArray.length; i++) {
        const value = rasterArray[i];
        if (value !== -1 && value !== 0 && !isNaN(value)) {
            min = Math.min(min, value);
            max = Math.max(max, value);
        }
    }
    
    // Create a larger canvas for better resolution
    const scaleFactor = 2; // Increase resolution for better quality
    const canvas = document.createElement('canvas');
    canvas.width = image.getWidth() * scaleFactor;
    canvas.height = image.getHeight() * scaleFactor;
    const ctx = canvas.getContext('2d');
    
    // Create a temporary buffer at the original size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.getWidth();
    tempCanvas.height = image.getHeight();
    const tempCtx = tempCanvas.getContext('2d');
    const tempImgData = tempCtx.createImageData(image.getWidth(), image.getHeight());
    
    // Fill the temporary buffer with color-mapped pixels
    for (let i = 0; i < rasterArray.length; i++) {
        const value = rasterArray[i];
        // assumes that NA values are -1
        if (value === -1 || value === 0 || isNaN(value)) {
            tempImgData.data[4 * i + 3] = 0; // Fully transparent
            continue;
        }

        const color = getColorForValue(value, colorScale);
        tempImgData.data[4 * i + 0] = color[0]; // R
        tempImgData.data[4 * i + 1] = color[1]; // G
        tempImgData.data[4 * i + 2] = color[2]; // B
        tempImgData.data[4 * i + 3] = 255;      // A
    }
    
    // Put the image data into the temporary canvas
    tempCtx.putImageData(tempImgData, 0, 0);
    
    // Draw the temporary canvas onto the scaled canvas with high-quality scaling
    ctx.imageSmoothingEnabled = false; // Use nearest-neighbor for sharper edges
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    
    // Convert to image URL
    const imgUrl = canvas.toDataURL();
    
    // Create overlay with CSS class for crisp rendering
    const overlayOptions = {
        opacity: 1,
        crossOrigin: true,
        interactive: true,
        className: 'crisp-image'
    };
    
    tiffLayers[layerName] = L.imageOverlay(imgUrl, bounds, { opacity: 1 });
tiffLayers[layerName].addTo(map);

// Get the actual image element that Leaflet creates and apply styles directly
tiffLayers[layerName].on('load', function() {
    const imgElement = this._image;
    if (imgElement) {
        imgElement.style.imageRendering = 'pixelated'; // Chrome
        imgElement.style.imageRendering = '-moz-crisp-edges'; // Firefox
        imgElement.style.imageRendering = 'crisp-edges'; // Standard
        imgElement.style.msInterpolationMode = 'nearest-neighbor'; // IE
    }
});
    
    // Add hover tooltip functionality
    addHoverTooltip(map, rasterArray, bounds, image.getWidth(), image.getHeight(), layerName, tiffLayers);
    
    // Add a CSS class if it doesn't exist yet
    // if (!document.getElementById('crisp-image-style')) {
    //     const style = document.createElement('style');
    //     style.id = 'crisp-image-style';
    //     style.textContent = `
    //         .crisp-image {
    //             image-rendering: -moz-crisp-edges;
    //             image-rendering: -webkit-crisp-edges;
    //             image-rendering: pixelated;
    //             image-rendering: crisp-edges;
    //         }
    //     `;
    //     document.head.appendChild(style);
    // }
}

/**
 * Get RGB color for a value based on the color scale
 * @param {number} value - Value to map to a color
 * @param {Object} colorScale - Color scale configuration
 * @returns {Array} - RGB color array
 */
function getColorForValue(value, colorScale) {
    // Handle case where colorScale is undefined or invalid
    if (!colorScale || !colorScale.ranges || !colorScale.colors) {
        return [128, 128, 128]; // Return gray if color scale is invalid
    }

    const { ranges, colors } = colorScale;
    
    // Make sure ranges and colors exist and have length
    if (!Array.isArray(ranges) || !Array.isArray(colors) || ranges.length < 2 || colors.length < 1) {
        return [128, 128, 128]; // Return gray if invalid structure
    }

    // Find the appropriate color range for the value
    for (let i = 0; i < ranges.length - 1; i++) {
        if (value >= ranges[i] && value < ranges[i + 1]) {
            return hexToRgb(colors[i]);
        }
    }
    
    // Return the last color if the value is at or above the highest range
    return hexToRgb(colors[colors.length - 1]);
}

/**
 * Convert hex color to RGB array
 * @param {string} hex - Hex color string
 * @returns {Array} - RGB color array
 */
function hexToRgb(hex) {
    // Check if this is a valid hex color
    if (!hex || typeof hex !== 'string' || !hex.match(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)) {
        return [128, 128, 128]; // Return gray as fallback
    }

    // Remove '#' if present
    hex = hex.replace('#', '');
    
    // Convert 3-digit hex to 6-digit
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    // Parse the hex values
    const bigint = parseInt(hex, 16);
    return [
        (bigint >> 16) & 255, // Red
        (bigint >> 8) & 255,  // Green
        bigint & 255          // Blue
    ];
}

// Export the original function too for backward compatibility
export { loadTiffAdvanced as loadTiff };