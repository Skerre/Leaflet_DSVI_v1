// split-map.js - Custom split map implementation

/**
 * Creates a split map with a draggable divider
 * @param {string} mainMapId - ID of the main map container
 * @param {string} compareMapId - ID of the comparison map container
 * @param {Function} setupMainMap - Function to set up the main map
 * @param {Function} setupCompareMap - Function to set up the comparison map
 * @param {number} initialSplit - Initial split percentage (0-100)
 */
export function initializeSplitMap(mainMapId, compareMapId, setupMainMap, setupCompareMap, initialSplit = 80) {
    // Create map container structure
    createMapContainers(mainMapId, compareMapId, initialSplit);
    
    // Initialize maps
    const mainMap = setupMainMap(mainMapId);
    const compareMap = setupCompareMap(compareMapId);
    
    // Setup map synchronization
    syncMaps(mainMap, compareMap);
    
    // Setup the draggable divider
    setupDivider(mainMap, compareMap, initialSplit);
    
    return { mainMap, compareMap };
}

/**
 * Create the necessary DOM structure for split maps
 */
function createMapContainers(mainMapId, compareMapId, initialSplit) {
    // Get the original map container
    const originalContainer = document.getElementById(mainMapId);
    if (!originalContainer) return;
    
    // Get the parent element
    const parent = originalContainer.parentElement;
    
    // Create wrapper for both maps
    const mapWrapper = document.createElement('div');
    mapWrapper.id = 'map-split-wrapper';
    mapWrapper.style.display = 'flex';
    mapWrapper.style.position = 'relative';
    mapWrapper.style.width = '100%';
    mapWrapper.style.height = '100%';
    mapWrapper.style.overflow = 'hidden';
    
    // Configure main map container
    originalContainer.style.width = `${initialSplit}%`;
    originalContainer.style.height = '100%';
    originalContainer.style.position = 'relative';
    originalContainer.style.zIndex = '1';
    
    // Create comparison map container
    const compareContainer = document.createElement('div');
    compareContainer.id = compareMapId;
    compareContainer.style.width = `${100 - initialSplit}%`;
    compareContainer.style.height = '100%';
    compareContainer.style.position = 'relative';
    compareContainer.style.zIndex = '1';
    
    // Create the divider
    const divider = document.createElement('div');
    divider.id = 'map-divider';
    divider.style.position = 'absolute';
    divider.style.top = '0';
    divider.style.bottom = '0';
    divider.style.left = `${initialSplit}%`;
    divider.style.width = '8px';
    divider.style.marginLeft = '-4px';
    divider.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    divider.style.cursor = 'col-resize';
    divider.style.zIndex = '1000';
    
    // Add simplified divider handle
    const handle = document.createElement('div');
    handle.style.position = 'absolute';
    handle.style.top = '50%';
    handle.style.left = '50%';
    handle.style.transform = 'translate(-50%, -50%)';
    handle.style.width = '16px';
    handle.style.height = '36px';
    handle.style.backgroundColor = 'white';
    handle.style.borderRadius = '3px';
    handle.style.display = 'flex';
    handle.style.justifyContent = 'center';
    handle.style.alignItems = 'center';
    handle.innerHTML = '‖'; // Simplified handle symbol
    handle.style.fontSize = '16px';
    handle.style.color = '#333';
    handle.style.userSelect = 'none';
    
    // Attach handle to divider
    divider.appendChild(handle);
    
    // Rearrange DOM
    parent.insertBefore(mapWrapper, originalContainer);
    mapWrapper.appendChild(originalContainer);
    mapWrapper.appendChild(compareContainer);
    mapWrapper.appendChild(divider);
    
    // Force map container to redraw by triggering resize
    window.dispatchEvent(new Event('resize'));
}

/**
 * Synchronize pan and zoom between two maps
 */
function syncMaps(sourceMap, targetMap) {
    // Sync initial view
    targetMap.setView(sourceMap.getCenter(), sourceMap.getZoom(), { animate: false });
    
    // Sync map movements
    sourceMap.on('move', function() {
        targetMap.setView(sourceMap.getCenter(), sourceMap.getZoom(), { 
            animate: false,
            duration: 0
        });
    });
    
    // Prevent circular event chains
    targetMap.on('move', function() {
        sourceMap.setView(targetMap.getCenter(), targetMap.getZoom(), { 
            animate: false,
            duration: 0
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        sourceMap.invalidateSize();
        targetMap.invalidateSize();
    });
}

/**
 * Setup the draggable divider
 */
function setupDivider(mainMap, compareMap, initialSplit) {
    const divider = document.getElementById('map-divider');
    const wrapper = document.getElementById('map-split-wrapper');
    const mainMapEl = mainMap.getContainer();
    const compareMapEl = compareMap.getContainer();
    
    let isDragging = false;
    let startX, startLeft;
    let animationFrameId = null;
    
    // Mouse down event on divider
    divider.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startLeft = divider.offsetLeft;
        
        // Add temporary overlay to prevent map interactions during drag
        const overlay = document.createElement('div');
        overlay.id = 'map-drag-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '999';
        overlay.style.cursor = 'col-resize';
        wrapper.appendChild(overlay);
        
        // Disable transitions during drag for better performance
        mainMapEl.style.transition = 'none';
        compareMapEl.style.transition = 'none';
        divider.style.transition = 'none';
    });
    
    // Mouse move event (when dragging)
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        // Cancel any pending animation frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        // Use requestAnimationFrame for smoother updates
        animationFrameId = requestAnimationFrame(() => {
            const deltaX = e.clientX - startX;
            const newLeft = startLeft + deltaX;
            
            // Calculate percentage based on wrapper width
            const wrapperWidth = wrapper.offsetWidth;
            const percentage = (newLeft / wrapperWidth) * 100;
            
            // Constrain to reasonable limits (10% - 90%)
            const limitedPercentage = Math.min(Math.max(percentage, 10), 90);
            
            // Update divider position
            divider.style.left = `${limitedPercentage}%`;
            
            // Update map widths
            mainMapEl.style.width = `${limitedPercentage}%`;
            compareMapEl.style.width = `${100 - limitedPercentage}%`;
            
            // We'll only update map sizes at the end of drag for better performance
        });
    });
    
    // Mouse up event (stop dragging)
    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        
        isDragging = false;
        
        // Remove overlay
        const overlay = document.getElementById('map-drag-overlay');
        if (overlay) overlay.remove();
        
        // Re-enable transitions
        mainMapEl.style.transition = '';
        compareMapEl.style.transition = '';
        divider.style.transition = '';
        
        // Force maps to update size once at the end
        mainMap.invalidateSize();
        compareMap.invalidateSize();
    });
    
    // Touch support for mobile devices
    divider.addEventListener('touchstart', function(e) {
        e.preventDefault();
        isDragging = true;
        startX = e.touches[0].clientX;
        startLeft = divider.offsetLeft;
        
        mainMapEl.style.transition = 'none';
        compareMapEl.style.transition = 'none';
        divider.style.transition = 'none';
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        animationFrameId = requestAnimationFrame(() => {
            const deltaX = e.touches[0].clientX - startX;
            const newLeft = startLeft + deltaX;
            
            const wrapperWidth = wrapper.offsetWidth;
            const percentage = (newLeft / wrapperWidth) * 100;
            const limitedPercentage = Math.min(Math.max(percentage, 10), 90);
            
            divider.style.left = `${limitedPercentage}%`;
            mainMapEl.style.width = `${limitedPercentage}%`;
            compareMapEl.style.width = `${100 - limitedPercentage}%`;
        });
    });
    
    document.addEventListener('touchend', function() {
        if (!isDragging) return;
        
        isDragging = false;
        
        mainMapEl.style.transition = '';
        compareMapEl.style.transition = '';
        divider.style.transition = '';
        
        mainMap.invalidateSize();
        compareMap.invalidateSize();
    });
}