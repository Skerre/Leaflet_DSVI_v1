// grid-tiff-loader.js - A tile-based approach for sharper raster rendering

/**
 * Load and display a GeoTIFF using Leaflet's GridLayer for better resolution
 * @param {string} url - URL of the GeoTIFF file
 * @param {string} layerName - Layer name identifier
 * @param {Object} tiffLayers - Object to store the tiff layers
 * @param {Object} map - Leaflet map instance
 * @param {Object} colorScale - Color scale configuration
 */
export async function loadTiff(url, layerName, tiffLayers, map, colorScale) {
    // Add validation for colorScale
    if (!colorScale || !colorScale.ranges || !colorScale.colors) {
        console.error(`Invalid colorScale for ${layerName}:`, colorScale);
        throw new Error(`Invalid colorScale for layer "${layerName}". The colorScale must have ranges and colors properties.`);
    }

    try {
        // Fetch and parse the GeoTIFF file
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();
        const rasterData = await image.readRasters();
        const rasterArray = rasterData[0]; // Assume single-band TIFF

        // Get geographic information
        const tiePoint = image.getTiePoints()[0];
        const pixelScale = image.getFileDirectory().ModelPixelScale;
        const width = image.getWidth();
        const height = image.getHeight();

        // Calculate bounds
        const minX = tiePoint.x;
        const maxY = tiePoint.y;
        const maxX = minX + (pixelScale[0] * width);
        const minY = maxY - (pixelScale[1] * height);

        const bounds = L.latLngBounds([
            [minY, minX],
            [maxY, maxX]
        ]);

        // Create a custom GridLayer that renders the TIFF in tiles
        const TiffGridLayer = L.GridLayer.extend({
            createTile: function(coords) {
                const tile = document.createElement('canvas');
                tile.width = 256;
                tile.height = 256;
                
                const ctx = tile.getContext('2d');
                
                // Performance optimization: Pre-calculate color lookup tables
                const colorLookup = new Map();
        
                // Disable anti-aliasing explicitly
                ctx.imageSmoothingEnabled = false;
                ctx.mozImageSmoothingEnabled = false;
                ctx.webkitImageSmoothingEnabled = false;
                ctx.msImageSmoothingEnabled = false;
                
                // Get tile bounds
                const tileBounds = this._tileCoordsToBounds(coords);
                const tileMinX = tileBounds.getWest();
                const tileMaxX = tileBounds.getEast();
                const tileMinY = tileBounds.getSouth();
                const tileMaxY = tileBounds.getNorth();
                
                // Calculate pixel coordinates in the original TIFF
                const startX = Math.max(0, Math.floor(((tileMinX - minX) / (maxX - minX)) * width));
                const endX = Math.min(width, Math.ceil(((tileMaxX - minX) / (maxX - minX)) * width));
                const startY = Math.max(0, Math.floor(((maxY - tileMaxY) / (maxY - minY)) * height));
                const endY = Math.min(height, Math.ceil(((maxY - tileMinY) / (maxY - minY)) * height));
                
                if (startX >= endX || startY >= endY) {
                    return tile; // Empty tile
                }
                
                // Use larger canvas for intermediate rendering if needed
                const zoomLevel = coords.z;
                const scale = Math.min(Math.max(1, Math.ceil(zoomLevel / 10)), 2);
                
                if (scale > 1) {
                    const scaledCanvas = document.createElement('canvas');
                    scaledCanvas.width = 256 * scale;
                    scaledCanvas.height = 256 * scale;
                    const scaledCtx = scaledCanvas.getContext('2d');
                    scaledCtx.imageSmoothingEnabled = false;
                    
                    // Create image data for the scaled canvas
                    const scaledImgData = scaledCtx.createImageData(256 * scale, 256 * scale);
                    
                    // Fill with transparent pixels
                    for (let i = 0; i < scaledImgData.data.length; i += 4) {
                        scaledImgData.data[i + 3] = 0; // Transparent
                    }
                    
                    // For each pixel in the tile's area
                    for (let y = startY; y < endY; y++) {
                        for (let x = startX; x < endX; x++) {
                            // Get value from the raster
                            const rasterIndex = y * width + x;
                            const value = rasterArray[rasterIndex];
                            
                            // Skip transparent values
                            if (value === -1 || value === 0 || isNaN(value)) {
                                continue;
                            }
                            
                            // Map to the scaled tile's coordinate space
                            const tileX = Math.floor(((x - startX) / (endX - startX)) * 256 * scale);
                            const tileY = Math.floor(((y - startY) / (endY - startY)) * 256 * scale);
                            
                            if (tileX < 0 || tileX >= 256 * scale || tileY < 0 || tileY >= 256 * scale) {
                                continue;
                            }
                            
                            // Get color with caching for better performance
                            let color;
                            if (colorLookup.has(value)) {
                                color = colorLookup.get(value);
                            } else {
                                color = getColorForValue(value, colorScale);
                                colorLookup.set(value, color);
                            }
                            
                            // Set the pixel color
                            const tileIndex = (tileY * 256 * scale + tileX) * 4;
                            scaledImgData.data[tileIndex] = color[0];     // R
                            scaledImgData.data[tileIndex + 1] = color[1]; // G
                            scaledImgData.data[tileIndex + 2] = color[2]; // B
                            scaledImgData.data[tileIndex + 3] = 255;      // A
                        }
                    }
                    
                    // Put the image data on the scaled canvas
                    scaledCtx.putImageData(scaledImgData, 0, 0);
                    
                    // Then downsample to the final tile
                    ctx.drawImage(scaledCanvas, 0, 0, 256, 256);
                } else {
                    // Create image data for this tile at 1:1 scale
                    const tileImgData = ctx.createImageData(256, 256);
                    
                    // Fill with transparent pixels
                    for (let i = 0; i < tileImgData.data.length; i += 4) {
                        tileImgData.data[i + 3] = 0; // Transparent
                    }
                    
                    // For each pixel in the tile's area
                    for (let y = startY; y < endY; y++) {
                        for (let x = startX; x < endX; x++) {
                            // Get value from the raster
                            const rasterIndex = y * width + x;
                            const value = rasterArray[rasterIndex];
                            
                            // Skip transparent values
                            if (value === -1 || value === 0 || isNaN(value)) {
                                continue;
                            }
                            
                            // Map to the tile's coordinate space
                            const tileX = Math.floor(((x - startX) / (endX - startX)) * 256);
                            const tileY = Math.floor(((y - startY) / (endY - startY)) * 256);
                            
                            if (tileX < 0 || tileX >= 256 || tileY < 0 || tileY >= 256) {
                                continue;
                            }
                            
                            // Get color with caching for better performance
                            let color;
                            if (colorLookup.has(value)) {
                                color = colorLookup.get(value);
                            } else {
                                color = getColorForValue(value, colorScale);
                                colorLookup.set(value, color);
                            }
                            
                            // Set the pixel color
                            const tileIndex = (tileY * 256 + tileX) * 4;
                            tileImgData.data[tileIndex] = color[0];     // R
                            tileImgData.data[tileIndex + 1] = color[1]; // G
                            tileImgData.data[tileIndex + 2] = color[2]; // B
                            tileImgData.data[tileIndex + 3] = 255;      // A
                        }
                    }
                    
                    // Put the image data on the canvas
                    ctx.putImageData(tileImgData, 0, 0);
                }
                
                // Apply sharp rendering to the canvas
                tile.style.imageRendering = 'pixelated';
                
                return tile;
            }
        });
        
        // Create and add the layer to the map
        tiffLayers[layerName] = new TiffGridLayer({
            bounds: bounds,
            minZoom: 5,
            maxZoom: 18,
            tileSize: 256,
            opacity: 1,
            updateWhenIdle: true
        });
        
        tiffLayers[layerName].addTo(map);
        
        // Add tooltip for data values
        addHoverTooltip(map, rasterArray, bounds, width, height, layerName, tiffLayers);
        
        return tiffLayers[layerName];
    } catch (error) {
        console.error(`Error loading TIFF ${url}:`, error);
        throw error;
    }
}

/**
 * Add hover tooltip functionality to display raster values
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
    map.on('layeradd', (e) => {
        if (e.layer === tiffLayers[layerName]) {
            attachEvents();
        }
    });

    map.on('layerremove', (e) => {
        if (e.layer === tiffLayers[layerName]) {
            detachEvents();
        }
    });

    // Explicitly trigger `layeradd` when the layer is first added
    if (map.hasLayer(tiffLayers[layerName])) {
        attachEvents();
    }
}

/**
 * Get RGB color for a value based on the color scale
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