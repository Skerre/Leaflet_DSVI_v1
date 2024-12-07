// tiffLoader.js

export async function loadTiff(url, layerName, tiffLayers, map, colorScale) {
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
    const canvas = document.createElement('canvas');
    canvas.width = image.getWidth();
    canvas.height = image.getHeight();
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(image.getWidth(), image.getHeight());
    const rasterArray = rasterData[0];

    for (let i = 0; i < rasterArray.length; i++) {
        const value = rasterArray[i];
        if (value === -1) {
            imgData.data[4 * i + 3] = 0; // Fully transparent
            continue;
        }

        const color = getColorForValue(value, colorScale);
        imgData.data[4 * i + 0] = color[0]; // R
        imgData.data[4 * i + 1] = color[1]; // G
        imgData.data[4 * i + 2] = color[2]; // B
        imgData.data[4 * i + 3] = 255;      // A
    }

    ctx.putImageData(imgData, 0, 0);

    const imgUrl = canvas.toDataURL();
    tiffLayers[layerName] = L.imageOverlay(imgUrl, bounds, { opacity: 1 });
    tiffLayers[layerName].addTo(map);
}

function getColorForValue(value, colorScale) {
    const { ranges, colors } = colorScale;

    for (let i = 0; i < ranges.length - 1; i++) {
        if (value >= ranges[i] && value < ranges[i + 1]) {
            return hexToRgb(colors[i]);
        }
    }
    return hexToRgb(colors[colors.length - 1]);
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}
