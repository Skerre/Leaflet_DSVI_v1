// basemaps.js

// Define the different basemap layers
export const basemaps = {
    osmHot: L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors, Tiles courtesy of Humanitarian OpenStreetMap Team'
    }),
    osmMonochrome: L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }),
    esriwsm: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
        maxZoom: 19
    }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }),
    Topographic: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }),
    cartoLight: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }),
    stamenTerrain: L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 18
    }),
    stamenWatercolor: L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 18
    })

};

// Function to add the default basemap (OSM) to the map
export function addDefaultBasemap(map) {
    basemaps.osm.addTo(map);
}

// Custom Leaflet Control for Basemap Selection
export const BasemapControl = L.Control.extend({
    options: {
        position: 'topright' // Position of the control on the map
    },

    onAdd: function (map) {
        // Create a container for the control
        const container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-bar');

        // Create a select dropdown
        const select = L.DomUtil.create('select', '', container);
        select.innerHTML = `
            <option value="osm">OpenStreetMap</option>
            <option value="osmMonochrome">osmMonochrome</option>
            <option value="osmHot">OSM_HOT</option>
            <option value="cartoLight">cartoLight</option>
            <option value="stamenTerrain">stamenTerrain</option>
            <option value="stamenWatercolor">stamenWatercolor</option>
            <option value="esriwsm">Esri World Streetmap</option>
            <option value="dark">CartoDB.DarkMatter</option>
            <option value="Topographic">Topographic</option>
        `;

        // Handle basemap change
        L.DomEvent.on(select, 'change', function () {
            const selectedBasemap = select.value;

            // Remove all basemaps before adding the selected one
            Object.values(basemaps).forEach(layer => map.removeLayer(layer));

            // Add the selected basemap
            basemaps[selectedBasemap].addTo(map);
        });

        // Disable map interactions when interacting with the control
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        return container;
    }
});
