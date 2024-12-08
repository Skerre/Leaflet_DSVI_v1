// Function to load GeoJSON for administrative boundaries
export function loadAdminLayer(filePath, layerName, map, styleOptions = {}, tooltipGenerator = null) {
    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            // Create a new GeoJSON layer
            const adminLayer = L.geoJSON(data, {
                style: (feature) => {
                    // Apply the provided style options or a default style
                    return {
                        color: styleOptions.color || "#3388ff",
                        weight: styleOptions.weight || 2,
                        opacity: styleOptions.opacity || 1,
                        fillOpacity: styleOptions.fillOpacity || 0.5
                    };
                },
                onEachFeature: (feature, layer) => {
                    // Generate tooltips for administrative boundaries
                    if (tooltipGenerator && feature.properties) {
                        const tooltipContent = tooltipGenerator(feature.properties);
                        layer.bindTooltip(tooltipContent, {
                            permanent: false,
                            direction: 'top'
                        });
                    }
                }
            });

            // Add the layer to the map
            adminLayer.addTo(map);

            // Store the layer globally for toggling (optional)
            window[layerName] = adminLayer;
        })
        .catch(err => console.error(`Error loading GeoJSON layer from ${filePath}:`, err));
}
