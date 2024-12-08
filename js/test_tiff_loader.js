// tiffLoader.js

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

// Updated `loadTiff` function to include the hover logic
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
    const rasterArray = rasterData[0]; // Assume single-band TIFF

    const canvas = document.createElement('canvas');
    canvas.width = image.getWidth();
    canvas.height = image.getHeight();
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(image.getWidth(), image.getHeight());

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

    // Enable mouse hover tooltips for this layer
    addHoverTooltip(map, rasterArray, bounds, image.getWidth(), image.getHeight(), layerName, tiffLayers);
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

// Function to calculate raster statistics
// function calculateStatistics(rasterArray) {
//     const validValues = rasterArray.filter(value => value !== -1); // Exclude nodata values
//     const min = Math.min(...validValues);
//     const max = Math.max(...validValues);
//     const mean = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;

//     return { min, max, mean };
// }

// // Function to display statistics
// function displayStatistics(layerName, stats) {
//     const statsContainer = document.getElementById('stats-container');
//     statsContainer.innerHTML = `
//         <h4>Statistics for ${layerName}</h4>
//         <p>Min: ${stats.min}</p>
//         <p>Max: ${stats.max}</p>
//         <p>Mean: ${stats.mean.toFixed(2)}</p>
//     `;
//     statsContainer.style.display = 'block'; // Ensure the stats are visible
// }