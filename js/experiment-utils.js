/**
 * ExperimentUtils - Shared utilities for the Free Viewing experiment
 * Consolidates common functionality used across multiple components
 */

class ExperimentUtils {
    constructor() {
        // Store active intervals and timeouts for cleanup
        this.activeIntervals = new Map();
        this.activeTimeouts = new Map();
    }

    // === UTILITY METHODS ===

    /**
     * Delay utility - returns a promise that resolves after specified milliseconds
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Shuffle array using Fisher-Yates algorithm (in-place shuffle)
     */
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // === MOUSEVIEW UTILITIES ===

    /**
     * Configure MouseView with standard parameters
     * @param {Object} settings - Configuration settings
     * @param {string} settings.apertureSize - Aperture size (e.g., '20%')
     * @param {number} settings.overlayAlpha - Overlay transparency (0-1)
     * @param {string} settings.overlayColour - Overlay color
     * @param {number} settings.apertureGauss - Edge smoothing
     * @param {string} context - Context for debugging (e.g., 'main', 'practice')
     */
    static async configureMouseView(settings = {}, context = 'unknown') {
        const defaults = {
            apertureSize: '20%',
            overlayAlpha: 0.85,
            overlayColour: 'black',
            apertureGauss: 15
        };
        
        const config = { ...defaults, ...settings };
        
        console.log(`=== ${context.toUpperCase()} CONFIGURE MOUSEVIEW CALLED ===`);
        
        try {
            console.log('MouseView available?', typeof mouseview !== 'undefined');
            
            if (typeof mouseview !== 'undefined') {
                console.log('MouseView object before config:', mouseview);
                console.log('Current params before config:', mouseview.params);
                
                // Apply configuration
                mouseview.params.apertureSize = config.apertureSize;
                mouseview.params.overlayAlpha = config.overlayAlpha;
                mouseview.params.overlayColour = config.overlayColour;
                mouseview.params.apertureGauss = config.apertureGauss;
                
                console.log('Params after setting:', mouseview.params);
                console.log('Calling mouseview.init()...');
                mouseview.init();
                console.log('Params after init():', mouseview.params);
                
                // Wait for MouseView overlay to be ready
                await ExperimentUtils.waitForMouseViewReady();
                
                console.log(`MouseView configured and ready for ${context}`);
                console.log(`=== ${context.toUpperCase()} MOUSEVIEW DEBUG ===`);
                console.log(`${context} aperture size:`, mouseview.params.apertureSize);
                console.log(`${context} overlay alpha:`, mouseview.params.overlayAlpha);
                console.log(`=== END ${context.toUpperCase()} DEBUG ===`);
                
                return true;
            } else {
                console.error(`MouseView is undefined in ${context}!`);
                return false;
            }
        } catch (error) {
            console.error(`Error configuring MouseView in ${context}:`, error);
            console.error('Error stack:', error.stack);
            return false;
        } finally {
            console.log(`=== END ${context.toUpperCase()} CONFIGURE MOUSEVIEW ===`);
        }
    }

    /**
     * Wait for MouseView overlay to be ready and visible
     */
    static async waitForMouseViewReady(maxWaitTime = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkOverlay = () => {
                const overlay = document.querySelector('#mouseview-overlay') || 
                               document.querySelector('.mouseview-overlay');
                
                console.log('Checking MouseView overlay readiness...');
                
                if (overlay) {
                    console.log('Overlay found:', overlay);
                    console.log('Overlay style:', overlay.style.cssText);
                    console.log('Overlay opacity:', overlay.style.opacity);
                    resolve();
                } else if (Date.now() - startTime > maxWaitTime) {
                    console.warn('MouseView overlay not ready within timeout, continuing anyway');
                    resolve(); // Don't reject, just continue
                } else {
                    console.log('Overlay not ready, checking again in 50ms...');
                    setTimeout(checkOverlay, 50);
                }
            };
            
            checkOverlay();
        });
    }

    /**
     * Safely remove all MouseView overlays and stop tracking
     */
    static cleanupMouseView(context = 'unknown') {
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
                console.log(`MouseView cleaned up for ${context}`);
            }
        } catch (error) {
            console.log(`MouseView cleanup skipped for ${context} (error):`, error.message);
        }
    }

    /**
     * Start MouseView tracking with error handling
     */
    static startMouseViewTracking(context = 'unknown') {
        try {
            if (typeof mouseview !== 'undefined') {
                mouseview.startTracking();
                console.log(`Mouse tracking started for ${context}`);
                return true;
            } else {
                console.error(`MouseView not available for ${context}`);
                return false;
            }
        } catch (error) {
            console.error(`Error starting mouse tracking for ${context}:`, error);
            return false;
        }
    }

    /**
     * Stop MouseView tracking and collect data
     */
    static stopMouseViewTracking(context = 'unknown') {
        let mouseData = [];
        
        try {
            if (typeof mouseview !== 'undefined') {
                // Stop tracking first
                mouseview.stopTracking();
                
                // Get data using direct access (more reliable than getData())
                mouseData = mouseview.datalogger?.data || [];
                
                // Clear data for next trial (to avoid accumulation)
                if (mouseview.datalogger) {
                    mouseview.datalogger.data = [];
                }
                
                console.log(`Mouse tracking stopped for ${context}, data collected`);
                console.log(`=== ${context.toUpperCase()} MOUSE DATA DEBUG ===`);
                console.log('MouseData length:', mouseData.length);
                console.log('MouseData sample (first 3 points):', mouseData.slice(0, 3));
                console.log(`=== END ${context.toUpperCase()} MOUSE DATA DEBUG ===`);
            }
        } catch (error) {
            console.error(`Error stopping mouse tracking for ${context}:`, error);
        }
        
        return mouseData;
    }

    // === SCREEN MANAGEMENT UTILITIES ===

    /**
     * Show a specific screen and hide all others
     */
    static showScreen(screenName, currentStateCallback = null) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Deactivate MouseView for all screens except during actual trials
        if (screenName !== 'experiment') {
            ExperimentUtils.cleanupMouseView(`screen-switch-to-${screenName}`);
        }
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            if (currentStateCallback) {
                currentStateCallback(screenName);
            }
        }
        
        console.log(`Showing screen: ${screenName}`);
        return !!targetScreen;
    }

    // === COUNTDOWN UTILITIES ===

    /**
     * Create and manage a countdown timer
     */
    createCountdown(options = {}) {
        const defaults = {
            containerId: 'experiment-screen',
            countdownId: 'trial-countdown',
            duration: 15000, // ms
            position: { top: '20px', left: '20px' },
            style: {
                background: 'rgba(0,0,0,0.9)',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '5px',
                fontSize: '1.2em',
                zIndex: '200',
                fontWeight: 'bold',
                opacity: '1',
                pointerEvents: 'none'
            }
        };
        
        const config = { ...defaults, ...options };
        
        // Create countdown element
        let countdown = document.getElementById(config.countdownId);
        if (!countdown) {
            countdown = document.createElement('div');
            countdown.id = config.countdownId;
            
            // Apply styling
            countdown.style.position = 'absolute';
            countdown.style.top = config.position.top;
            countdown.style.left = config.position.left;
            
            Object.assign(countdown.style, config.style);
            
            const container = document.getElementById(config.containerId);
            if (container) {
                container.appendChild(countdown);
            }
        }
        
        // Start countdown
        let timeLeft = Math.ceil(config.duration / 1000);
        countdown.textContent = `Time: ${timeLeft}s`;
        countdown.style.display = 'block';
        
        const intervalId = setInterval(() => {
            timeLeft--;
            countdown.textContent = `Time: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(intervalId);
                this.activeIntervals.delete(config.countdownId);
            }
        }, 1000);
        
        // Store interval for cleanup
        this.activeIntervals.set(config.countdownId, intervalId);
        
        return {
            element: countdown,
            intervalId: intervalId,
            hide: () => this.hideCountdown(config.countdownId)
        };
    }

    /**
     * Hide countdown timer
     */
    hideCountdown(countdownId) {
        // Clear interval if exists
        if (this.activeIntervals.has(countdownId)) {
            clearInterval(this.activeIntervals.get(countdownId));
            this.activeIntervals.delete(countdownId);
        }
        
        // Hide element
        const countdown = document.getElementById(countdownId);
        if (countdown) {
            countdown.style.display = 'none';
        }
    }

    /**
     * Clean up all active timers and intervals
     */
    cleanup() {
        // Clear all intervals
        this.activeIntervals.forEach((intervalId, key) => {
            clearInterval(intervalId);
            console.log(`Cleared interval: ${key}`);
        });
        this.activeIntervals.clear();
        
        // Clear all timeouts
        this.activeTimeouts.forEach((timeoutId, key) => {
            clearTimeout(timeoutId);
            console.log(`Cleared timeout: ${key}`);
        });
        this.activeTimeouts.clear();
        
        // Cleanup MouseView
        ExperimentUtils.cleanupMouseView('utils-cleanup');
    }

    // === QUADRANT CALCULATION UTILITIES ===

    /**
     * Calculate time spent in screen quadrants from mouse data
     */
    static calculateQuadrantTimes(mouseData) {
        if (!mouseData || mouseData.length === 0) {
            return { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
        }
        
        const quadrantTimes = { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 1; i < mouseData.length; i++) {
            const point = mouseData[i];
            const prevPoint = mouseData[i - 1];
            
            // Validate points
            if (!point || !prevPoint) {
                continue;
            }
            
            // Get coordinates - try multiple property names
            const x = parseFloat(point.x || point.mouse_x || point.clientX || point.pageX);
            const y = parseFloat(point.y || point.mouse_y || point.clientY || point.pageY);
            
            // Get time difference - try multiple property names
            const currentTime = parseFloat(
                point.time || point.timestamp || point.relativeTime || 
                point.relative_time || point.t || point.timeStamp
            );
            const prevTime = parseFloat(
                prevPoint.time || prevPoint.timestamp || prevPoint.relativeTime || 
                prevPoint.relative_time || prevPoint.t || prevPoint.timeStamp
            );
            
            if (isNaN(x) || isNaN(y) || isNaN(currentTime) || isNaN(prevTime)) {
                continue;
            }
            
            const timeDiff = currentTime - prevTime;
            if (timeDiff < 0) {
                continue;
            }
            
            // Determine quadrant and add time
            if (x < centerX && y < centerY) {
                quadrantTimes.topLeft += timeDiff;
            } else if (x >= centerX && y < centerY) {
                quadrantTimes.topRight += timeDiff;
            } else if (x < centerX && y >= centerY) {
                quadrantTimes.bottomLeft += timeDiff;
            } else {
                quadrantTimes.bottomRight += timeDiff;
            }
        }
        
        return quadrantTimes;
    }
}

// Create a global instance for managing stateful operations
window.experimentUtils = new ExperimentUtils();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExperimentUtils;
} else if (typeof window !== 'undefined') {
    window.ExperimentUtils = ExperimentUtils;
}
