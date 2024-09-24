// GeoJson_funcs.js

export let geoJsonLayer; // Exported to be accessible in main.js
export let pointLayer; // Exported to be accessible in main.js


// Function to load GeoJSON data for the vector layer with tooltips
export function loadGeoJsonLayer(map) {
    fetch('data/sample.geojson')
        .then(response => response.json())
        .then(data => {
            geoJsonLayer = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    // Check if the feature has properties to display in the tooltip
                    if (feature.properties && feature.properties.COUNTRY) {
                        layer.bindTooltip(`Name: ${feature.properties.COUNTRY}`, {
                            permanent: false,
                            direction: 'top',
                            offset: [0, -10],
                        });
                    }
                }
            }).addTo(map);
        });
}

// Function to load GeoJSON points as a point layer with tooltips
export function loadPointLayer(map) {
    fetch('data/sample-points.geojson')
        .then(response => response.json())
        .then(data => {
            pointLayer = L.geoJSON(data, {
                pointToLayer: (feature, latlng) => {
                    // Customize the marker for point layers
                    return L.circleMarker(latlng, {
                        radius: 5,
                        fillColor: "#ff7800",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                },
                onEachFeature: function (feature, layer) {
                    // Check if the feature has properties to display in the tooltip
                    if (feature.properties && feature.properties.LATNUM) {
                        layer.bindTooltip(`Description: ${feature.properties.LATNUM}`, {
                            permanent: false,
                            direction: 'top',
                            offset: [0, -10],
                        });
                    }
                }
            }).addTo(map);
        });
}
