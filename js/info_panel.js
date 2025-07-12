// info_panel.js - Simplified info panel for layer analysis and reporting

/**
 * InfoPanel class - Creates and manages a floating info/analysis panel
 */
export class InfoPanel {
    constructor(options = {}) {
        this.options = {
            position: options.position || 'topright',
            width: options.width || '400px',
            maxHeight: options.maxHeight || '70vh',
            title: options.title || 'Layer Analysis & Reports',
            ...options
        };
        
        this.isVisible = false;
        this.isMinimized = true; // Start minimized by default
        this.activeLayers = new Map();
        this.container = null;
        this.map = null;
        
        // Initialize the panel
        this.init();
    }
    
    /**
     * Initialize the info panel
     */
    init() {
        this.createPanel();
        this.setupEventListeners();
    }
    
    /**
     * Set the map reference for geographic analysis
     * @param {Object} map - Leaflet map instance
     */
    setMap(map) {
        this.map = map;
    }
    
    /**
     * Create the main panel structure
     */
    createPanel() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'info-panel-container';
        this.container.id = 'info-panel';
        
        // Apply positioning
        this.container.style.cssText = `
            position: fixed;
            top: 15%;
            right: 10px;
            width: ${this.options.width};
            max-height: ${this.options.maxHeight};
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 2001;
            display: none;
            overflow: hidden;
            font-family: Calibri, sans-serif;
            border: 1px solid #ddd;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.className = 'info-panel-header';
        header.innerHTML = `
            <div class="info-panel-title">${this.options.title}</div>
            <div class="info-panel-controls">
                <button class="info-panel-btn minimize-btn" title="Minimize/Maximize">−</button>
                <button class="info-panel-btn close-btn" title="Close">×</button>
            </div>
        `;
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'info-panel-content';
        content.style.display = 'none'; // Start minimized
        content.innerHTML = `
            <div class="info-panel-section">
                <div class="section-header">
                    <h4>Active Layers</h4>
                    <span class="layer-count">0 layers</span>
                </div>
                <div class="layers-list" id="layers-list">
                    <p class="no-layers-message">No layers currently active</p>
                </div>
            </div>
            
            <div class="info-panel-section analysis-section">
                <div class="section-header">
                    <h4>Analysis & Reports</h4>
                </div>
                <div class="analysis-content">
                    <div class="analysis-tool">
                        <h5>Create Summary Report</h5>
                        <p>Generate correlation analysis between social vulnerability and subnational statistics with visualizations</p>
                        <button class="run-analysis-btn" data-analysis="summary">Generate Report</button>
                    </div>
                </div>
            </div>
            
            <div class="info-panel-section results-section">
                <div class="section-header">
                    <h4>Report Results</h4>
                </div>
                <div class="results-content">
                    <p class="no-results-message">No reports generated yet</p>
                </div>
            </div>
        `;
        
        // Assemble panel
        this.container.appendChild(header);
        this.container.appendChild(content);
        
        // Add to page
        document.body.appendChild(this.container);
        
        // Start in minimized state
        this.updateMinimizeState();
    }
    
    /**
     * Setup event listeners for panel interactions
     */
    setupEventListeners() {
        // Header controls
        const minimizeBtn = this.container.querySelector('.minimize-btn');
        const closeBtn = this.container.querySelector('.close-btn');
        
        minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        closeBtn.addEventListener('click', () => this.hide());
        
        // Analysis button
        const analysisBtn = this.container.querySelector('.run-analysis-btn');
        analysisBtn.addEventListener('click', () => this.generateSummaryReport());
        
        // Make panel draggable
        this.makeDraggable();
    }
    
    /**
     * Make the panel draggable
     */
    makeDraggable() {
        const header = this.container.querySelector('.info-panel-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('info-panel-btn')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            
            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
                header.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                xOffset = currentX;
                yOffset = currentY;
                
                this.container.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'move';
            }
        });
    }
    
    /**
     * Show the info panel
     */
    show() {
        this.container.style.display = 'block';
        this.isVisible = true;
        this.updateLayersList();
    }
    
    /**
     * Hide the info panel
     */
    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }
    
    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Toggle minimize/maximize state
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.updateMinimizeState();
    }
    
    /**
     * Update the visual state based on minimize status
     */
    updateMinimizeState() {
        const content = this.container.querySelector('.info-panel-content');
        const minimizeBtn = this.container.querySelector('.minimize-btn');
        
        if (this.isMinimized) {
            content.style.display = 'none';
            minimizeBtn.textContent = '+';
            minimizeBtn.title = 'Maximize';
        } else {
            content.style.display = 'block';
            minimizeBtn.textContent = '−';
            minimizeBtn.title = 'Minimize';
        }
    }
    
    /**
     * Add a layer to tracking
     * @param {string} id - Layer ID
     * @param {Object} layerInfo - Layer information
     */
    addLayer(id, layerInfo) {
        this.activeLayers.set(id, {
            id,
            name: layerInfo.name || id,
            type: layerInfo.type || 'unknown',
            layer: layerInfo.layer,
            selectedAttribute: layerInfo.selectedAttribute,
            properties: layerInfo.properties || {},
            ...layerInfo
        });
        
        if (this.isVisible) {
            this.updateLayersList();
        }
    }
    
    /**
     * Remove a layer from tracking
     * @param {string} id - Layer ID
     */
    removeLayer(id) {
        this.activeLayers.delete(id);
        
        if (this.isVisible) {
            this.updateLayersList();
        }
    }
    
    /**
     * Update layer information
     * @param {string} id - Layer ID
     * @param {Object} updates - Updates to apply
     */
    updateLayer(id, updates) {
        if (this.activeLayers.has(id)) {
            const existing = this.activeLayers.get(id);
            this.activeLayers.set(id, { ...existing, ...updates });
            
            if (this.isVisible) {
                this.updateLayersList();
            }
        }
    }
    
    /**
     * Update the layers list display
     */
    updateLayersList() {
        const layersList = document.getElementById('layers-list');
        const layerCount = this.container.querySelector('.layer-count');
        
        if (!layersList || !layerCount) return;
        
        layerCount.textContent = `${this.activeLayers.size} layer${this.activeLayers.size !== 1 ? 's' : ''}`;
        
        if (this.activeLayers.size === 0) {
            layersList.innerHTML = '<p class="no-layers-message">No layers currently active</p>';
            return;
        }
        
        const layersHTML = Array.from(this.activeLayers.values()).map(layer => `
            <div class="layer-item" data-layer-id="${layer.id}">
                <div class="layer-header">
                    <span class="layer-name">${layer.name}</span>
                    <span class="layer-type">${layer.type}</span>
                </div>
                <div class="layer-details">
                    ${this.generateLayerDetails(layer)}
                </div>
            </div>
        `).join('');
        
        layersList.innerHTML = layersHTML;
    }
    
    /**
     * Generate details for a specific layer
     * @param {Object} layer - Layer information
     */
    generateLayerDetails(layer) {
        const details = [];
        
        if (layer.opacity !== undefined) {
            details.push(`Opacity: ${Math.round(layer.opacity * 100)}%`);
        }
        
        if (layer.featureCount !== undefined) {
            details.push(`Features: ${layer.featureCount}`);
        }
        
        if (layer.selectedAttribute) {
            details.push(`Attribute: ${layer.selectedAttribute}`);
        }
        
        if (layer.colorRamp) {
            details.push(`Color Scheme: ${layer.colorRamp}`);
        }
        
        return details.length > 0 ? details.join(' • ') : 'Layer active';
    }
    
    /**
     * Generate summary report with correlations and visualizations
     */
    async generateSummaryReport() {
        const button = this.container.querySelector('.run-analysis-btn');
        const resultsContent = this.container.querySelector('.results-content');
        
        // Show loading state
        button.disabled = true;
        button.textContent = 'Generating...';
        resultsContent.innerHTML = `
            <div class="analysis-loading">
                <div class="loading-spinner"></div>
                <p>Analyzing layer correlations...</p>
            </div>
        `;
        
        try {
            // Simulate analysis processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const svLayers = Array.from(this.activeLayers.values()).filter(l => 
    l.type === 'sv-vector' || l.name.toLowerCase().includes('vulnerability')
);
const statLayers = Array.from(this.activeLayers.values()).filter(l => 
    l.type === 'vector' && !l.name.toLowerCase().includes('vulnerability')
);

console.log('SV Layers found:', svLayers);
console.log('Stat Layers found:', statLayers);
            
            if (svLayers.length === 0 || statLayers.length === 0) {
                this.showNoDataMessage(resultsContent);
                return;
            }
            
            // Generate the report
            const reportData = this.generateCorrelationData(svLayers, statLayers);
            const reportHTML = this.createReportHTML(reportData);
            
            resultsContent.innerHTML = reportHTML;
            
            // Create charts after HTML is rendered
            setTimeout(() => {
                this.createCharts(reportData);
            }, 100);
            
        } catch (error) {
            console.error('Error generating report:', error);
            resultsContent.innerHTML = `
                <div class="analysis-error">
                    <h5>Report Generation Error</h5>
                    <p>Failed to generate correlation report: ${error.message}</p>
                </div>
            `;
        } finally {
            button.disabled = false;
            button.textContent = 'Generate Report';
        }
    }
    
    /**
     * Show message when no suitable data is available
     */
    showNoDataMessage(container) {
        container.innerHTML = `
            <div class="analysis-info">
                <h5>Insufficient Data</h5>
                <p>To generate a correlation report, you need:</p>
                <ul>
                    <li>At least one Social Vulnerability layer active</li>
                    <li>At least one Subnational Statistics layer with an attribute selected</li>
                </ul>
                <p>Please activate the required layers and try again.</p>
            </div>
        `;
    }
    
    /**
 * Generate correlation data between layers using REAL data
 */
generateCorrelationData(svLayers, statLayers) {
    const svLayer = svLayers[0];
    const statLayer = statLayers[0];
    
    console.log('Analyzing real data from layers:', {
        svLayer: svLayer.name,
        statLayer: statLayer.name,
        statAttribute: statLayer.selectedAttribute
    });
    
    // Extract real data from the layers
    const data = this.extractRealLayerData(svLayer, statLayer);
    
    if (data.length === 0) {
        throw new Error('No matching regional data found between layers');
    }
    
    // Calculate actual correlation coefficient
    const svValues = data.map(d => d.vulnerability);
    const statValues = data.map(d => d.statistic);
    const correlation = this.calculateCorrelation(svValues, statValues);
    
    console.log('Real correlation calculated:', {
        correlation: correlation.toFixed(3),
        dataPoints: data.length,
        svRange: [Math.min(...svValues), Math.max(...svValues)],
        statRange: [Math.min(...statValues), Math.max(...statValues)]
    });
    
    return {
        data,
        correlation: correlation.toFixed(3),
        svLayer: svLayer.name,
        statLayer: statLayer.name,
        statAttribute: statLayer.selectedAttribute,
        timestamp: new Date().toLocaleString()
    };
}

/**
 * Extract real data from the actual layers
 */
extractRealLayerData(svLayer, statLayer) {
    const data = [];
    
    // Get the actual Leaflet layer objects
    const svLeafletLayer = svLayer.layer;
    const statLeafletLayer = statLayer.layer;
    
    if (!svLeafletLayer || !statLeafletLayer) {
        console.error('Could not access layer data');
        return data;
    }
    
    // Create maps for quick lookup
    const svData = new Map();
    const statData = new Map();
    
    // Extract SV data
    svLeafletLayer.eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties) {
            const props = layer.feature.properties;
            const regionName = this.getRegionName(props);
            const svValue = props.SV || props.sv || props.vulnerability;
            
            if (regionName && svValue !== undefined && svValue !== null) {
                svData.set(regionName, parseFloat(svValue));
            }
        }
    }.bind(this));
    
    // Extract statistics data
    statLeafletLayer.eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties) {
            const props = layer.feature.properties;
            const regionName = this.getRegionName(props);
            const statValue = props[statLayer.selectedAttribute];
            
            if (regionName && statValue !== undefined && statValue !== null) {
                statData.set(regionName, parseFloat(statValue));
            }
        }
    }.bind(this));
    
    console.log('Extracted data:', {
        svRegions: Array.from(svData.keys()),
        statRegions: Array.from(statData.keys()),
        svSample: Array.from(svData.entries()).slice(0, 3),
        statSample: Array.from(statData.entries()).slice(0, 3)
    });
    
    // Match regions and create final dataset
    svData.forEach((svValue, regionName) => {
        if (statData.has(regionName)) {
            const statValue = statData.get(regionName);
            
            // Only include if both values are valid numbers
            if (!isNaN(svValue) && !isNaN(statValue)) {
                data.push({
                    region: regionName,
                    vulnerability: svValue,
                    statistic: statValue,
                    population: this.getPopulationEstimate(regionName) // Optional population data
                });
            }
        }
    });
    
    return data;
}

/**
 * Get region name from feature properties
 */
getRegionName(properties) {
    // Try different possible name fields in order of preference
    const nameFields = [
        'NAME_1', 'NAME_2', 'NAME_3',
        'name', 'Name', 'AREA_NAME',
        'ADM1_NAME', 'ADM2_NAME', 'ADM3_NAME',
        'Cercle/District', 'District', 'Commune'
    ];
    
    for (const field of nameFields) {
        if (properties[field] && typeof properties[field] === 'string') {
            return properties[field].trim();
        }
    }
    
    return null;
}

/**
 * Get population estimate for a region (mock data for now)
 */
getPopulationEstimate(regionName) {
    // This could be enhanced to use real population data from your layers
    // For now, return a reasonable estimate
    const estimates = {
        'Kayes': 2418305,
        'Koulikoro': 2418618,
        'Sikasso': 3137917,
        'Ségou': 2336255,
        'Mopti': 2037330,
        'Tombouctou': 681691,
        'Gao': 544120,
        'Kidal': 67638,
        'Taoudénit': 32125,
        'Ménaka': 62180
    };
    
    return estimates[regionName] || Math.floor(Math.random() * 1000000) + 100000;
}
    /**
     * Calculate Pearson correlation coefficient
     */
    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
        const sumX2 = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
        const sumY2 = y.map(yi => yi * yi).reduce((a, b) => a + b, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }
    
    /**
     * Create the HTML structure for the report
     */
    /**
 * Create the HTML structure for the report with interpretation
 */
createReportHTML(reportData) {
    const interpretation = this.generateCorrelationInterpretation(
        reportData.correlation, 
        reportData.statAttribute
    );
    
    return `
        <div class="report-container">
            <div class="report-header">
                <h5>Correlation Analysis Report</h5>
                <button class="download-btn" onclick="window.infoPanelInstance.downloadReport()">
                    📄 Download PDF
                </button>
            </div>
            
            <div class="report-summary">
                <div class="summary-grid">
                    <div class="summary-item">
                        <label>Social Vulnerability Layer:</label>
                        <span>${reportData.svLayer}</span>
                    </div>
                    <div class="summary-item">
                        <label>Statistics Layer:</label>
                        <span>${reportData.statLayer}</span>
                    </div>
                    <div class="summary-item">
                        <label>Selected Attribute:</label>
                        <span>${reportData.statAttribute}</span>
                    </div>
                    <div class="summary-item">
                        <label>Correlation Coefficient:</label>
                        <span class="correlation-value ${this.getCorrelationClass(reportData.correlation)}">${reportData.correlation}</span>
                    </div>
                </div>
            </div>
            
            <div class="report-section interpretation-section">
                <h6>📊 Interpretation</h6>
                <div class="interpretation-content">
                    ${interpretation.summary}
                    <div class="interpretation-details">
                        <p><strong>What this means:</strong></p>
                        <ul>
                            ${interpretation.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="interpretation-implications">
                        <p><strong>Policy Implications:</strong></p>
                        <p>${interpretation.implications}</p>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h6>Regional Data Table</h6>
                <div class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Region</th>
                                <th>Vulnerability Score</th>
                                <th>${reportData.statAttribute}</th>
                                <th>Population</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.data.map(row => `
                                <tr>
                                    <td>${row.region}</td>
                                    <td>${row.vulnerability.toFixed(3)}</td>
                                    <td>${row.statistic.toFixed(1)}${this.getAttributeUnit(reportData.statAttribute)}</td>
                                    <td>${row.population.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="report-section">
                <h6>Visualizations</h6>
                <div class="charts-container">
                    <div class="chart-item">
                        <h7>Correlation Scatter Plot</h7>
                        <canvas id="correlation-chart" width="350" height="200"></canvas>
                    </div>
                    <div class="chart-item">
                        <h7>Regional Comparison</h7>
                        <canvas id="bar-chart" width="350" height="200"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="report-footer">
                <small>Generated: ${reportData.timestamp}</small>
            </div>
        </div>
    `;
}
    
/**
 * Generate intelligent interpretation based on correlation and attribute type
 */
generateCorrelationInterpretation(correlationStr, attribute) {
    const correlation = parseFloat(correlationStr);
    const absCorr = Math.abs(correlation);
    const isPositive = correlation > 0;
    
    // Determine attribute type and expected relationship
    const attributeInfo = this.analyzeAttribute(attribute);
    
    // Determine correlation strength
    let strength, strengthDesc;
    if (absCorr >= 0.8) {
        strength = 'very strong';
        strengthDesc = 'very strong relationship';
    } else if (absCorr >= 0.6) {
        strength = 'strong';
        strengthDesc = 'strong relationship';
    } else if (absCorr >= 0.4) {
        strength = 'moderate';
        strengthDesc = 'moderate relationship';
    } else if (absCorr >= 0.2) {
        strength = 'weak';
        strengthDesc = 'weak relationship';
    } else {
        strength = 'very weak';
        strengthDesc = 'very weak or no meaningful relationship';
    }
    
    // Generate interpretation
    const direction = isPositive ? 'positively' : 'negatively';
    const relationshipType = isPositive ? 'increases' : 'decreases';
    
    // Create summary
    let summary = `
        <div class="correlation-summary ${isPositive ? 'positive' : 'negative'}">
            <p><strong>${attribute} and Social Vulnerability are ${direction} correlated (r = ${correlationStr})</strong></p>
            <p>This indicates a <strong>${strengthDesc}</strong> between these two variables.</p>
        </div>
    `;
    
    // Generate detailed bullets
    const bullets = [
        `As social vulnerability increases, ${attribute} tends to ${relationshipType}`,
        `The correlation coefficient of ${correlationStr} indicates a ${strength} ${direction} relationship`,
        `This relationship explains approximately ${Math.round(correlation * correlation * 100)}% of the variance between the variables`
    ];
    
    // Add context-specific bullets based on attribute type
    if (attributeInfo.isHealthIndicator) {
        if (isPositive) {
            bullets.push(`Higher vulnerability regions tend to have worse ${attributeInfo.displayName} outcomes`);
        } else {
            bullets.push(`Higher vulnerability regions tend to have better ${attributeInfo.displayName} outcomes (unexpected - may warrant further investigation)`);
        }
    } else if (attributeInfo.isEconomicIndicator) {
        if (isPositive) {
            bullets.push(`Regions with higher vulnerability show higher ${attributeInfo.displayName}`);
        } else {
            bullets.push(`Regions with higher vulnerability show lower ${attributeInfo.displayName}`);
        }
    }
    
    // Generate policy implications
    let implications;
    if (absCorr >= 0.6) {
        if (attributeInfo.isHealthIndicator && isPositive) {
            implications = `The strong positive correlation suggests that interventions targeting social vulnerability reduction could significantly improve ${attributeInfo.displayName} outcomes. Priority should be given to the most vulnerable regions for maximum impact.`;
        } else if (attributeInfo.isEconomicIndicator && isPositive) {
            implications = `The strong correlation indicates that ${attributeInfo.displayName} could serve as a reliable indicator of social vulnerability. Resources should be allocated proportionally to vulnerability levels.`;
        } else {
            implications = `The strong ${direction} correlation suggests that these variables are closely linked and should be considered together in policy planning and resource allocation decisions.`;
        }
    } else if (absCorr >= 0.3) {
        implications = `The moderate correlation suggests some relationship between these variables, but other factors also play important roles. A multi-faceted approach addressing various determinants would be most effective.`;
    } else {
        implications = `The weak correlation suggests these variables are largely independent. Different intervention strategies may be needed for each, and vulnerability reduction may not directly impact ${attributeInfo.displayName}.`;
    }
    
    return {
        summary,
        bullets,
        implications
    };
}
/**
 * Analyze attribute to determine type and characteristics
 */
analyzeAttribute(attribute) {
    const lowerAttr = attribute.toLowerCase();
    
    let isHealthIndicator = false;
    let isEconomicIndicator = false;
    let displayName = attribute;
    
    // Health indicators
    if (lowerAttr.includes('stunting') || lowerAttr.includes('wasting') || 
        lowerAttr.includes('underweight') || lowerAttr.includes('malnutrition')) {
        isHealthIndicator = true;
        displayName = 'malnutrition';
    } else if (lowerAttr.includes('mortality') || lowerAttr.includes('death')) {
        isHealthIndicator = true;
        displayName = 'health outcomes';
    } else if (lowerAttr.includes('vaccination') || lowerAttr.includes('immunization')) {
        isHealthIndicator = true;
        displayName = 'vaccination coverage';
    }
    
    // Economic indicators
    else if (lowerAttr.includes('poverty') || lowerAttr.includes('income') || 
             lowerAttr.includes('wealth') || lowerAttr.includes('gdp')) {
        isEconomicIndicator = true;
        displayName = 'economic conditions';
    } else if (lowerAttr.includes('education') || lowerAttr.includes('literacy') || 
               lowerAttr.includes('school')) {
        isEconomicIndicator = true;
        displayName = 'educational outcomes';
    }
    
    return {
        isHealthIndicator,
        isEconomicIndicator,
        displayName
    };
}

/**
 * Get appropriate unit for attribute display
 */
getAttributeUnit(attribute) {
    const lowerAttr = attribute.toLowerCase();
    
    if (lowerAttr.includes('%') || lowerAttr.includes('percent')) {
        return ''; // Already includes %
    } else if (lowerAttr.includes('rate') || lowerAttr.includes('ratio')) {
        return '%';
    } else if (lowerAttr.includes('per') && lowerAttr.includes('1000')) {
        return ' per 1,000';
    } else if (lowerAttr.includes('per') && lowerAttr.includes('100')) {
        return ' per 100,000';
    }
    
    return '';
}
    /**
     * Get CSS class for correlation strength
     */
    getCorrelationClass(correlation) {
        const absCorr = Math.abs(parseFloat(correlation));
        if (absCorr >= 0.7) return 'strong-correlation';
        if (absCorr >= 0.3) return 'moderate-correlation';
        return 'weak-correlation';
    }
    
    /**
     * Create charts using Canvas API
     */
    createCharts(reportData) {
        this.createScatterPlot(reportData);
        this.createBarChart(reportData);
    }
    
    /**
 * Create scatter plot for correlation with proper labels and grid
 */
createScatterPlot(reportData) {
    const canvas = document.getElementById('correlation-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;
    const bottomPadding = 80;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const chartWidth = width - 2 * padding;
    const chartHeight = height - padding - bottomPadding;
    
    // Set up scales
    const xValues = reportData.data.map(d => d.vulnerability);
    const yValues = reportData.data.map(d => d.statistic);
    
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    // Add some padding to the ranges
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const xPadding = xRange * 0.1;
    const yPadding = yRange * 0.1;
    
    const xMinPadded = xMin - xPadding;
    const xMaxPadded = xMax + xPadding;
    const yMinPadded = yMin - yPadding;
    const yMaxPadded = yMax + yPadding;
    
    // Draw chart background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(padding, padding, chartWidth, chartHeight);
    
    // Draw grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#666';
    ctx.font = '11px Calibri';
    
    // X-axis grid and labels
    const xGridLines = 5;
    for (let i = 0; i <= xGridLines; i++) {
        const x = padding + (i / xGridLines) * chartWidth;
        const value = xMinPadded + (i / xGridLines) * (xMaxPadded - xMinPadded);
        
        // Grid line
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
        
        // X-axis label
        ctx.textAlign = 'center';
        ctx.fillText(value.toFixed(2), x, padding + chartHeight + 20);
    }
    
    // Y-axis grid and labels
    const yGridLines = 5;
    for (let i = 0; i <= yGridLines; i++) {
        const y = padding + chartHeight - (i / yGridLines) * chartHeight;
        const value = yMinPadded + (i / yGridLines) * (yMaxPadded - yMinPadded);
        
        // Grid line
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
        
        // Y-axis label
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }
    
    // Draw trend line if correlation is significant
    const correlation = parseFloat(reportData.correlation);
    if (Math.abs(correlation) > 0.3) {
        this.drawTrendLine(ctx, reportData.data, padding, chartHeight, chartWidth, 
                          xMinPadded, xMaxPadded, yMinPadded, yMaxPadded);
    }
    
    // Draw data points
    reportData.data.forEach((point, index) => {
        const x = padding + ((point.vulnerability - xMinPadded) / (xMaxPadded - xMinPadded)) * chartWidth;
        const y = padding + chartHeight - ((point.statistic - yMinPadded) / (yMaxPadded - yMinPadded)) * chartHeight;
        
        // Point with gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 6);
        gradient.addColorStop(0, '#007bff');
        gradient.addColorStop(1, '#0056b3');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Point outline
        ctx.strokeStyle = '#004085';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Add region labels for outliers or on hover (simplified version)
        if (index < 3) { // Show labels for first 3 points as example
            ctx.fillStyle = '#333';
            ctx.font = '9px Calibri';
            ctx.textAlign = 'left';
            ctx.fillText(point.region.substring(0, 8), x + 8, y - 8);
        }
    });
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();
    
    // X-axis  
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
    
    // Axis labels
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Calibri';
    
    // X-axis title
    ctx.textAlign = 'center';
    ctx.fillText('Vulnerability Score', width / 2, height - 15);
    
    // Y-axis title (rotated)
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(reportData.statAttribute || 'Statistic Value', 0, 0);
    ctx.restore();
    
    // Chart title
    ctx.font = 'bold 14px Calibri';
    ctx.textAlign = 'center';
    ctx.fillText(`Correlation: r = ${reportData.correlation}`, width / 2, 25);
}

/**
 * Draw trend line for scatter plot
 */
drawTrendLine(ctx, data, padding, chartHeight, chartWidth, xMin, xMax, yMin, yMax) {
    if (data.length < 2) return;
    
    // Calculate linear regression
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.vulnerability, 0);
    const sumY = data.reduce((sum, d) => sum + d.statistic, 0);
    const sumXY = data.reduce((sum, d) => sum + d.vulnerability * d.statistic, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.vulnerability * d.vulnerability, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Draw trend line
    const x1 = xMin;
    const y1 = slope * x1 + intercept;
    const x2 = xMax;
    const y2 = slope * x2 + intercept;
    
    const canvasX1 = padding + ((x1 - xMin) / (xMax - xMin)) * chartWidth;
    const canvasY1 = padding + chartHeight - ((y1 - yMin) / (yMax - yMin)) * chartHeight;
    const canvasX2 = padding + ((x2 - xMin) / (xMax - xMin)) * chartWidth;
    const canvasY2 = padding + chartHeight - ((y2 - yMin) / (yMax - yMin)) * chartHeight;
    
    ctx.strokeStyle = '#dc3545';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvasX1, canvasY1);
    ctx.lineTo(canvasX2, canvasY2);
    ctx.stroke();
    ctx.setLineDash([]);
}


createBarChart(reportData) {
    const canvas = document.getElementById('bar-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60; // Increased padding for labels
    const bottomPadding = 80; // Extra space for region names
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const chartWidth = width - 2 * padding;
    const chartHeight = height - padding - bottomPadding;
    const barWidth = chartWidth / reportData.data.length;
    const maxValue = Math.max(...reportData.data.map(d => d.vulnerability));
    const minValue = Math.min(...reportData.data.map(d => d.vulnerability));
    
    // Draw chart background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(padding, padding, chartWidth, chartHeight);
    
    // Draw grid lines and Y-axis labels
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#666';
    ctx.font = '11px Calibri';
    
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding + (i / gridLines) * chartHeight;
        const value = maxValue - (i / gridLines) * (maxValue - minValue);
        
        // Grid line
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
        
        // Y-axis label
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(2), padding - 10, y + 4);
    }
    
    // Draw bars
    reportData.data.forEach((item, index) => {
        const barHeight = ((item.vulnerability - minValue) / (maxValue - minValue)) * chartHeight;
        const x = padding + index * barWidth;
        const y = padding + chartHeight - barHeight;
        
        // Bar with gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#28a745');
        gradient.addColorStop(1, '#20c997');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 4, y, barWidth - 8, barHeight);
        
        // Bar outline
        ctx.strokeStyle = '#1e7e34';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y, barWidth - 8, barHeight);
        
        // Value on top of bar
        ctx.fillStyle = '#333';
        ctx.font = '10px Calibri';
        ctx.textAlign = 'center';
        ctx.fillText(item.vulnerability.toFixed(2), x + barWidth / 2, y - 5);
        
        // Region name at bottom (rotated)
        ctx.fillStyle = '#333';
        ctx.font = '11px Calibri';
        ctx.save();
        ctx.translate(x + barWidth / 2, height - bottomPadding + 40);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'right';
        ctx.fillText(item.region, 0, 0);
        ctx.restore();
    });
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
    
    // Y-axis title (rotated)
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Calibri';
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Vulnerability Score', 0, 0);
    ctx.restore();
    
    // X-axis title
    ctx.textAlign = 'center';
    ctx.fillText('Regions', width / 2, height - 15);
    
    // Chart title
    ctx.font = 'bold 14px Calibri';
    ctx.fillText('Social Vulnerability by Region', width / 2, 25);
}
    
    /**
     * Download report as PDF (placeholder - would need a PDF library)
     */
/**
 * Download report as PDF using jsPDF and html2canvas
 */
async downloadReport() {
    const button = this.container.querySelector('.download-btn');
    const originalText = button.textContent;
    
    try {
        // Show loading state
        button.disabled = true;
        button.textContent = '📄 Generating PDF...';
        
        // Get the report container
        const reportElement = this.container.querySelector('.report-container');
        if (!reportElement) {
            throw new Error('Report container not found');
        }
        
        // Create canvas from the report element
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            width: reportElement.scrollWidth,
            height: reportElement.scrollHeight
        });
        
        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Calculate dimensions
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png');
        
        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if needed
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `correlation-report-${timestamp}.pdf`;
        
        // Save the PDF
        pdf.save(filename);
        
        console.log('PDF generated successfully:', filename);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        // Restore button state
        button.disabled = false;
        button.textContent = originalText;
    }
}
}

// Create global instance reference for download functionality
window.infoPanelInstance = null;

// Export for module use
export default InfoPanel;