// tiffLoader.js

// Function to load and prepare a TIFF raster layer with automatic bounds detection and customizable color styling
export async function loadTiff(url, layerName, tiffLayers, map, colorScale) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();

    // Extract geo-transform and tie points to calculate bounds
    const tiePoint = image.getTiePoints()[0];
    console.log("tiePoint", tiePoint);
    const pixelScale = image.getFileDirectory().ModelPixelScale;
    console.log("pixelScale", pixelScale);

    // Calculate geographic bounds based on tie points and pixel scale
    const minX = tiePoint.x;
    const maxY = tiePoint.y;
    const maxX = minX + pixelScale[0] * image.getWidth();
    const minY = maxY - pixelScale[1] * image.getHeight();

    const bounds = L.latLngBounds([
        [minY, minX], // Bottom-left corner (latitude, longitude)
        [maxY, maxX]  // Top-right corner (latitude, longitude)
    ]);

    const rasterData = await image.readRasters();
    const canvas = document.createElement('canvas');
    canvas.width = image.getWidth();
    canvas.height = image.getHeight();
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(image.getWidth(), image.getHeight());
    const rasterArray = rasterData[0]; // Assume a single-band TIFF

    // Apply the custom color scale based on the provided configuration
    for (let i = 0; i < rasterArray.length; i++) {
        const value = rasterArray[i];

        // Check for NA value (-1) and set transparency
        if (value === -1) {
            imgData.data[4 * i + 3] = 0; // Set alpha to 0 (fully transparent)
            continue;
        }

        // Get the color based on the custom color scale
        const color = getColorForValue(value, colorScale);
        imgData.data[4 * i + 0] = color[0]; // R
        imgData.data[4 * i + 1] = color[1]; // G
        imgData.data[4 * i + 2] = color[2]; // B
        imgData.data[4 * i + 3] = 255;      // A (opaque)
    }

    ctx.putImageData(imgData, 0, 0);

    const imgUrl = canvas.toDataURL();
    // Store the layer with default opacity
    tiffLayers[layerName] = L.imageOverlay(imgUrl, bounds, { opacity: 1 });
    tiffLayers[layerName].addTo(map); // Add the layer to the map
}

// Helper function to map a value to a color based on the provided color scale
function getColorForValue(value, colorScale) {
    const { ranges, colors } = colorScale;

    // Find the correct range for the value
    for (let i = 0; i < ranges.length - 1; i++) {
        if (value >= ranges[i] && value < ranges[i + 1]) {
            return hexToRgb(colors[i]);
        }
    }

    // If value exceeds all ranges, return the last color
    return hexToRgb(colors[colors.length - 1]);
}

// Convert a hex color to an RGB array
function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}
