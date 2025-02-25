// tiffLoader.js

// Function to load and prepare a TIFF raster layer with automatic bounds detection and color styling
export async function loadTiff(url, layerName, tiffLayers, map) {
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

    // Apply color styling based on value ranges and handle NA values
    for (let i = 0; i < rasterArray.length; i++) {
        const value = rasterArray[i];

        // Check for NA value (-1) and set transparency
        if (value === -1) {
            imgData.data[4 * i + 3] = 0; // Set alpha to 0 (fully transparent)
            continue;
        }

        // Apply a color ramp: Black (low values), Blue (mid values), Yellow (high values)
        let r = 0, g = 0, b = 0; // Default to black
a
        if (value <= 85) { // Map low values to black (0,0,0) to blue (0,0,255)
            r = 0;
            g = 0;
            b = Math.round((value / 85) * 255);
        } else if (value <= 170) { // Map mid values from blue (0,0,255) to yellow (255,255,0)
            r = Math.round(((value - 85) / 85) * 255);
            g = Math.round(((value - 85) / 85) * 255);
            b = 255 - Math.round(((value - 85) / 85) * 255);
        } else { // Map high values from yellow (255,255,0) to white (255,255,255)
            r = 255;
            g = 255;
            b = Math.round(((value - 170) / 85) * 255);
        }

        imgData.data[4 * i + 0] = r; // R
        imgData.data[4 * i + 1] = g; // G
        imgData.data[4 * i + 2] = b; // B
        imgData.data[4 * i + 3] = 255; // A (opaque)
    }

    ctx.putImageData(imgData, 0, 0);

    const imgUrl = canvas.toDataURL();
    // Store the layer with default opacity
    tiffLayers[layerName] = L.imageOverlay(imgUrl, bounds, { opacity: 1 }); 
    tiffLayers[layerName].addTo(map); // Add the layer to the map
}