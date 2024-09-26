// geojsonLayers.js

export let geoJsonLayer; // Exported to be accessible in main.js
export let pointLayer; // Exported to be accessible in main.js

// Function to compute a color based on the _mean value
function getColor(value, min, max) {
    const ratio = (value - min) / (max - min);
    const red = Math.round(255 * (1 - ratio)); // Red decreases as ratio increases
    const green = Math.round(255 * ratio);     // Green increases as ratio increases
    return `rgb(${red}, ${green}, 0)`;
}

// Reusable function to load and create a GeoJSON layer without adding it to the map
export function loadGeoJsonLayer({
    map, 
    url, 
    styleFunction = null, 
    pointToLayerFunction = null, 
    tooltipFunction = null
} = {}) {
    if (!map || !url) {
        console.error('Map object or URL is missing.');
        return Promise.reject('Map object or URL is missing.'); // Return a rejected promise to handle this case
    }

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            let minMean, maxMean;
            if (styleFunction && styleFunction.requiresMeanValues) {
                const meanValues = data.features.map(feature => feature.properties._mean);
                minMean = Math.min(...meanValues);
                maxMean = Math.max(...meanValues);
            }

            const geoJsonOptions = {
                style: feature => (styleFunction ? styleFunction(feature, minMean, maxMean) : {}),
                pointToLayer: pointToLayerFunction || ((feature, latlng) => L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                })),
                onEachFeature: (feature, layer) => {
                    if (tooltipFunction) {
                        tooltipFunction(feature, layer);
                    }
                }
            };

            // Create the GeoJSON layer but do not add it to the map
            const layer = L.geoJSON(data, geoJsonOptions);

            // Return the created layer wrapped in a resolved promise
            return layer;
        })
        .catch(error => {
            console.error('Error loading GeoJSON layer:', error);
            return Promise.reject(error); // Return a rejected promise if an error occurs
        });
}

// Sample style function for vector layers with color based on _mean values
export function styleByMean(feature, minMean, maxMean) {
    const value = feature.properties._mean;
    const fillColor = getColor(value, minMean, maxMean);
    return {
        color: fillColor,
        fillColor: fillColor,
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7
    };
}

// Sample tooltip function
export function tooltipWithMean(feature, layer) {
    if (feature.properties && feature.properties._mean !== undefined) {
        layer.bindTooltip(`Mean: ${feature.properties._mean.toFixed(2)}`, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
        });
    }
}
