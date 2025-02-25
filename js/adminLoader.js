export function loadAdminLayer(filePath, layerName, map, styleOptions = {}, tooltipGenerator = null) {
    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            // Create the GeoJSON layer
            const adminLayer = L.geoJSON(data, {
                style: (feature) => {
                    // Apply default or provided styles
                    return {
                        color: styleOptions.color || "#3388ff",
                        weight: styleOptions.weight || 2,
                        opacity: styleOptions.opacity || 1,
                        fillOpacity: styleOptions.fillOpacity || 0.5
                    };
                },
                onEachFeature: (feature, layer) => {
                    // Apply tooltip generator if provided
                    if (tooltipGenerator && feature.properties) {
                        const tooltipContent = tooltipGenerator(feature.properties);
                        layer.bindTooltip(tooltipContent, {
                            permanent: false,
                            direction: 'top'
                        });
                    }
                }
            });

            // Add the layer to the map and store it globally for toggling
            adminLayer.addTo(map);
            window[layerName] = adminLayer;
        })
        .catch(err => console.error(`Error loading GeoJSON from ${filePath}:`, err));
}
