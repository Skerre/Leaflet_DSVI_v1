// Initialize the map
const map = L.map('map').setView([0, 0], 2);

// Add a base map layer (OpenStreetMap in this case)
const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Load and add the GeoJSON vector layer
fetch('data/cell3.geojson')
    .then(response => response.json())
    .then(data => {
        const geoJsonLayer = L.geoJSON(data).addTo(map);

        document.getElementById('geojsonLayer').addEventListener('change', function () {
            if (this.checked) {
                geoJsonLayer.addTo(map);
            } else {
                map.removeLayer(geoJsonLayer);
            }
        });
    });


// Load and display TIFF raster layer
async function loadTiff(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();

    const bounds = L.latLngBounds([[0, 0], [image.getHeight(), image.getWidth()]]);
    const rasterData = await image.readRasters();
    const canvas = document.createElement('canvas');
    canvas.width = image.getWidth();
    canvas.height = image.getHeight();
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(image.getWidth(), image.getHeight());
    const rasterArray = rasterData[0]; // Assume a single-band TIFF

    for (let i = 0; i < rasterArray.length; i++) {
        const value = rasterArray[i];
        imgData.data[4 * i + 0] = value; // R
        imgData.data[4 * i + 1] = value; // G
        imgData.data[4 * i + 2] = value; // B
        imgData.data[4 * i + 3] = 255;   // A (opaque)
    }
    ctx.putImageData(imgData, 0, 0);

    const imgUrl = canvas.toDataURL();
    const rasterLayer = L.imageOverlay(imgUrl, bounds).addTo(map);

    document.getElementById('rasterLayer').addEventListener('change', function () {
        if (this.checked) {
            rasterLayer.addTo(map);
        } else {
            map.removeLayer(rasterLayer);
        }
    });

    map.fitBounds(bounds);
}

loadTiff('data/cell3.tif');

// Load and add the point layer (GeoJSON with point features)
fetch('data/points.geojson')
    .then(response => response.json())
    .then(data => {
        const pointLayer = L.geoJSON(data, {
            pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            }
        }).addTo(map);

        document.getElementById('pointLayer').addEventListener('change', function () {
            if (this.checked) {
                pointLayer.addTo(map);
            } else {
                map.removeLayer(pointLayer);
            }
        });
    });
