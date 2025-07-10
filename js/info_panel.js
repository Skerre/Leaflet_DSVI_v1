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
            
            // Get relevant layers for analysis
            const svLayers = Array.from(this.activeLayers.values()).filter(l => 
                l.type === 'sv-vector' || l.name.toLowerCase().includes('vulnerability')
            );
            const statLayers = Array.from(this.activeLayers.values()).filter(l => 
                l.type === 'vector' && l.selectedAttribute && !l.name.toLowerCase().includes('vulnerability')
            );
            
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
     * Generate correlation data between layers
     */
    generateCorrelationData(svLayers, statLayers) {
        // Mock data generation - in real implementation, this would analyze actual layer data
        const regions = ['Kayes', 'Koulikoro', 'Sikasso', 'Ségou', 'Mopti', 'Tombouctou', 'Gao', 'Kidal', 'Taoudénit', 'Ménaka'];
        
        const data = regions.map(region => {
            const svScore = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
            const correlatedStat = (1 - svScore) * 80 + Math.random() * 20; // Inverse correlation with some noise
            
            return {
                region,
                vulnerability: svScore,
                statistic: correlatedStat,
                population: Math.floor(Math.random() * 2000000) + 100000
            };
        });
        
        // Calculate correlation coefficient
        const correlation = this.calculateCorrelation(
            data.map(d => d.vulnerability),
            data.map(d => d.statistic)
        );
        
        return {
            data,
            correlation: correlation.toFixed(3),
            svLayer: svLayers[0].name,
            statLayer: statLayers[0].name,
            statAttribute: statLayers[0].selectedAttribute,
            timestamp: new Date().toLocaleString()
        };
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
    createReportHTML(reportData) {
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
                                        <td>${row.statistic.toFixed(1)}</td>
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
     * Create scatter plot for correlation
     */
    createScatterPlot(reportData) {
        const canvas = document.getElementById('correlation-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Set up scales
        const xMax = Math.max(...reportData.data.map(d => d.vulnerability));
        const yMax = Math.max(...reportData.data.map(d => d.statistic));
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(padding, padding);
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = '#007bff';
        reportData.data.forEach(point => {
            const x = padding + (point.vulnerability / xMax) * (width - 2 * padding);
            const y = height - padding - (point.statistic / yMax) * (height - 2 * padding);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Add labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Calibri';
        ctx.fillText('Vulnerability Score', width / 2 - 30, height - 10);
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(reportData.statAttribute, -30, 0);
        ctx.restore();
    }
    
    /**
     * Create bar chart for regional comparison
     */
    createBarChart(reportData) {
        const canvas = document.getElementById('bar-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        const barWidth = (width - 2 * padding) / reportData.data.length;
        const maxValue = Math.max(...reportData.data.map(d => d.vulnerability));
        
        // Draw bars
        reportData.data.forEach((item, index) => {
            const barHeight = (item.vulnerability / maxValue) * (height - 2 * padding);
            const x = padding + index * barWidth;
            const y = height - padding - barHeight;
            
            // Bar
            ctx.fillStyle = '#28a745';
            ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
            
            // Label
            ctx.fillStyle = '#333';
            ctx.font = '10px Calibri';
            ctx.save();
            ctx.translate(x + barWidth / 2, height - 20);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(item.region.substring(0, 3), -10, 0);
            ctx.restore();
        });
        
        // Y-axis
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
    }
    
    /**
     * Download report as PDF (placeholder - would need a PDF library)
     */
    downloadReport() {
        // This is a placeholder for PDF generation
        // In a real implementation, you would use a library like jsPDF
        alert('PDF download functionality would be implemented here using a library like jsPDF or html2pdf');
        
        // Example of what the implementation might look like:
        /*
        const element = this.container.querySelector('.report-container');
        const opt = {
            margin: 1,
            filename: `correlation-report-${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
        */
    }
}

// Create global instance reference for download functionality
window.infoPanelInstance = null;

// Export for module use
export default InfoPanel;