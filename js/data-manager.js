/**
 * DataManager - Handles data collection and export
 * Replicates the 9 custom data fields from the original PsychoPy experiment
 */

class DataManager {
    constructor() {
        this.participantData = {
            participant_id: this.generateParticipantId(),
            session: '001',
            date: new Date().toISOString(),
            start_time: new Date().toISOString(),
            browser: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            device_pixel_ratio: window.devicePixelRatio || 1,
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
        
        this.trialData = [];
        this.mouseTrackingData = [];
        this.experimentStartTime = null;
        this.currentTrialStartTime = null;
        
        console.log('DataManager initialized for participant:', this.participantData.participant_id);
    }
    
    generateParticipantId() {
        // Generate 6-digit random ID similar to PsychoPy version
        return Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    }
    
    setParticipantInfo(participantId, participantEmail, session = '001') {
        this.participantData.participant_id = participantId;
        this.participantData.participant_email = participantEmail;
        this.participantData.session = session;
        console.log('Participant info updated:', participantId, participantEmail, session);
    }
    
    startExperiment() {
        this.experimentStartTime = performance.now();
        this.participantData.experiment_start_time = new Date().toISOString();
        console.log('Experiment started at:', this.participantData.experiment_start_time);
    }
    
    startTrial(trialIndex, trialType = 'image') {
        this.currentTrialStartTime = performance.now();
        return {
            trialIndex: trialIndex,
            trialType: trialType,
            startTime: this.currentTrialStartTime,
            relativeStartTime: this.currentTrialStartTime - this.experimentStartTime
        };
    }
    
    endTrial() {
        if (!this.currentTrialStartTime) {
            console.warn('endTrial called without startTrial');
            return null;
        }
        
        const endTime = performance.now();
        const duration = endTime - this.currentTrialStartTime;
        
        return {
            endTime: endTime,
            duration: duration
        };
    }
    
    /**
     * Record trial data - replicates the 9 custom fields from PsychoPy experiment
     * Fields: trial_idx, img_XXX (4 fields), position_XXX (4 fields)
     */
    recordTrialData(trialInfo, imageData, mouseData = null) {
        const timing = this.endTrial();
        
        if (!timing) {
            console.error('Could not record trial data - no timing information');
            return;
        }
        
        // Create the trial record with consistent field ordering
        const trialRecord = {
            // Basic trial info
            trial_idx: trialInfo.trialIndex + 1, // 1-based indexing like PsychoPy
            trial_type: trialInfo.trialType || 'image',
            
            // Image fields (always in same order regardless of trial type)
            img_dysphoric: '',
            img_threat: '',
            img_positive: '',
            img_neutral: '',
            position_dysphoric: '',
            position_threat: '',
            position_positive: '',
            position_neutral: '',
            
            // Filler fields (always in same order regardless of trial type)
            img_filler1: '',
            img_filler2: '',
            img_filler3: '',
            img_filler4: '',
            position_filler1: '',
            position_filler2: '',
            position_filler3: '',
            position_filler4: '',
            
            // Timing information (kept for internal use, excluded from CSV export)
            _trial_start_time: trialInfo.startTime,
            _trial_end_time: timing.endTime,
            _trial_duration: timing.duration,
            _relative_start_time: trialInfo.relativeStartTime,
            
            // Additional metadata
            timestamp: new Date().toISOString(),
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight
        };
        
        // Populate fields based on trial type
        console.log(`=== RECORD TRIAL DATA DEBUG ===`);
        console.log('trialInfo:', trialInfo);
        console.log('trialInfo.trialType:', trialInfo.trialType);
        console.log('imageData structure:', {
            hasImages: !!imageData.images,
            imageKeys: imageData.images ? Object.keys(imageData.images) : 'none',
            hasPositions: !!imageData.positions,
            positionKeys: imageData.positions ? Object.keys(imageData.positions) : 'none'
        });
        
        if (trialInfo.trialType === 'filler') {
            console.log('Processing FILLER trial - populating filler fields');
            trialRecord.img_filler1 = imageData.images.filler1?.src || '';
            trialRecord.img_filler2 = imageData.images.filler2?.src || '';
            trialRecord.img_filler3 = imageData.images.filler3?.src || '';
            trialRecord.img_filler4 = imageData.images.filler4?.src || '';
            
            trialRecord.position_filler1 = imageData.positions?.filler1 || '';
            trialRecord.position_filler2 = imageData.positions?.filler2 || '';
            trialRecord.position_filler3 = imageData.positions?.filler3 || '';
            trialRecord.position_filler4 = imageData.positions?.filler4 || '';
            
            // Leave main image fields as empty strings (already initialized)
            
            console.log('Filler images populated:', {
                filler1: trialRecord.img_filler1,
                filler2: trialRecord.img_filler2,
                filler3: trialRecord.img_filler3,
                filler4: trialRecord.img_filler4
            });
        } else {
            console.log('Processing IMAGE trial - populating main image fields');
            // Populate main image fields for image trials
            trialRecord.img_dysphoric = imageData.images.dysphoric?.src || '';
            trialRecord.img_threat = imageData.images.threat?.src || '';
            trialRecord.img_positive = imageData.images.positive?.src || '';
            trialRecord.img_neutral = imageData.images.neutral?.src || '';
            
            trialRecord.position_dysphoric = imageData.positions?.dysphoric || '';
            trialRecord.position_threat = imageData.positions?.threat || '';
            trialRecord.position_positive = imageData.positions?.positive || '';
            trialRecord.position_neutral = imageData.positions?.neutral || '';
            
            // Leave filler fields as empty strings (already initialized)
        }
        console.log(`=== END RECORD TRIAL DATA DEBUG ===`);
        
        // Add mouse tracking summary if available
        if (mouseData && mouseData.length > 0) {
            trialRecord.mouse_data_points = mouseData.length;
            
            // Calculate averages with NaN protection
            const validPoints = mouseData.filter(point => 
                point && 
                typeof point.x === 'number' && !isNaN(point.x) && 
                typeof point.y === 'number' && !isNaN(point.y)
            );
            
            if (validPoints.length > 0) {
                trialRecord.avg_mouse_x = Math.round(validPoints.reduce((sum, point) => sum + point.x, 0) / validPoints.length);
                trialRecord.avg_mouse_y = Math.round(validPoints.reduce((sum, point) => sum + point.y, 0) / validPoints.length);
            } else {
                trialRecord.avg_mouse_x = 0;
                trialRecord.avg_mouse_y = 0;
            }
            
            // Calculate time spent in each quadrant
            const quadrantTimes = this.calculateQuadrantTimes(mouseData);
            trialRecord.time_top_left = quadrantTimes.topLeft;
            trialRecord.time_top_right = quadrantTimes.topRight;
            trialRecord.time_bottom_left = quadrantTimes.bottomLeft;
            trialRecord.time_bottom_right = quadrantTimes.bottomRight;
        } else {
            // Ensure all fields exist with valid values even when no mouse data
            trialRecord.mouse_data_points = 0;
            trialRecord.avg_mouse_x = 0;
            trialRecord.avg_mouse_y = 0;
            trialRecord.time_top_left = 0;
            trialRecord.time_top_right = 0;
            trialRecord.time_bottom_left = 0;
            trialRecord.time_bottom_right = 0;
        }
        
        this.trialData.push(trialRecord);
        console.log(`Trial ${trialRecord.trial_idx} data recorded. Fields:`, Object.keys(trialRecord));
        
        // Debug: Track unique trial indices to verify no overwriting
        const allTrialIndices = this.trialData.map(t => t.trial_idx);
        const uniqueTrialIndices = [...new Set(allTrialIndices)];
        console.log(`=== TRIAL DATA DEBUG ===`);
        console.log('Total trials recorded:', this.trialData.length);
        console.log('All trial indices:', allTrialIndices);
        console.log('Unique trial indices:', uniqueTrialIndices);
        console.log('Index collision detected:', allTrialIndices.length !== uniqueTrialIndices.length);
        console.log(`=== END TRIAL DATA DEBUG ===`);
        
        console.log('Quadrant times:', {
            top_left: trialRecord.time_top_left,
            top_right: trialRecord.time_top_right,
            bottom_left: trialRecord.time_bottom_left,
            bottom_right: trialRecord.time_bottom_right
        });
    }
    
    recordMouseData(mouseData, trialIndex, trialType = 'image') {
        console.log('=== RECORD MOUSE DATA DEBUG ===');
        console.log('Input mouseData length:', mouseData ? mouseData.length : 'null/undefined');
        console.log('Input trialIndex:', trialIndex);
        console.log('Input trialType:', trialType);
        
        if (!mouseData || mouseData.length === 0) {
            console.log('No mouse data to record - returning early');
            console.log('=== END RECORD MOUSE DATA DEBUG ===');
            return;
        }
        
        // Process and store mouse tracking data
        const processedData = mouseData.map(point => ({
            participant_id: this.participantData.participant_id,
            trial_idx: trialIndex + 1, // 1-based indexing
            trial_type: trialType,
            timestamp: point.timestamp,
            relative_time: point.relativeTime,
            mouse_x: Math.round(point.x),
            mouse_y: Math.round(point.y),
            normalized_x: Math.round(point.normalizedX * 1000) / 1000, // 3 decimal places
            normalized_y: Math.round(point.normalizedY * 1000) / 1000,
            screen_x: point.screenX,
            screen_y: point.screenY,
            viewport_width: point.viewportWidth,
            viewport_height: point.viewportHeight,
            screen_region: this.getScreenRegion(point.x, point.y),
            image_region: this.getImageRegion(point.x, point.y),
            distance_from_center: this.getDistanceFromCenter(point.x, point.y),
            movement_speed: 0, // Will be calculated below
            fixation_id: null, // Will be calculated in post-processing
            saccade_id: null   // Will be calculated in post-processing
        }));
        
        // Calculate movement speeds
        for (let i = 1; i < processedData.length; i++) {
            const current = processedData[i];
            const previous = processedData[i - 1];
            
            const deltaX = current.mouse_x - previous.mouse_x;
            const deltaY = current.mouse_y - previous.mouse_y;
            const deltaTime = current.relative_time - previous.relative_time;
            
            if (deltaTime > 0) {
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                current.movement_speed = Math.round((distance / deltaTime) * 1000); // pixels per second
            }
        }
        
        this.mouseTrackingData.push(...processedData);
        console.log(`Recorded ${processedData.length} mouse data points for trial ${trialIndex + 1}`);
        console.log('Total mouse tracking data points so far:', this.mouseTrackingData.length);
        console.log('=== END RECORD MOUSE DATA DEBUG ===');
    }
    
    
    calculateQuadrantTimes(mouseData) {
        // Initialize with 0 values (never NaN)
        const quadrantTimes = { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
        
        // Validate input data
        if (!mouseData || mouseData.length === 0) {
            console.log('No mouse data for quadrant calculation');
            return quadrantTimes;
        }
        
        if (mouseData.length < 2) {
            console.log('Insufficient mouse data points for quadrant calculation');
            return quadrantTimes;
        }
        
        // Validate screen dimensions
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        if (!centerX || !centerY || centerX <= 0 || centerY <= 0) {
            console.warn('Invalid screen dimensions for quadrant calculation');
            return quadrantTimes;
        }
        
        let validPointsProcessed = 0;
        let invalidPointsSkipped = 0;
        
        // Debug first few data points to understand structure
        if (mouseData.length > 0) {
            console.log('=== MOUSE DATA STRUCTURE DEBUG ===');
            console.log('Sample point 0:', JSON.stringify(mouseData[0], null, 2));
            console.log('Sample point 1:', mouseData[1] ? JSON.stringify(mouseData[1], null, 2) : 'No second point');
            console.log('Point 0 properties:', Object.keys(mouseData[0] || {}));
            console.log('All unique properties across first 5 points:');
            const allProps = new Set();
            mouseData.slice(0, 5).forEach(point => {
                if (point) Object.keys(point).forEach(key => allProps.add(key));
            });
            console.log(Array.from(allProps));
            console.log('=== END STRUCTURE DEBUG ===');
        }
        
        for (let i = 1; i < mouseData.length; i++) {
            const point = mouseData[i];
            const prevPoint = mouseData[i - 1];
            
            // Validate current and previous points
            if (!point || !prevPoint) {
                if (i < 3) console.log(`Point ${i} missing:`, { point, prevPoint });
                invalidPointsSkipped++;
                continue;
            }
            
            // Validate coordinates - check multiple possible property names
            const x = parseFloat(point.x || point.mouse_x || point.clientX || point.pageX);
            const y = parseFloat(point.y || point.mouse_y || point.clientY || point.pageY);
            
            // Try multiple time property names that MouseView.js might use
            const prevTime = parseFloat(
                prevPoint.time || prevPoint.timestamp || prevPoint.relativeTime || 
                prevPoint.relative_time || prevPoint.t || prevPoint.timeStamp
            );
            const currentTime = parseFloat(
                point.time || point.timestamp || point.relativeTime || 
                point.relative_time || point.t || point.timeStamp
            );
            
            if (isNaN(x) || isNaN(y) || isNaN(prevTime) || isNaN(currentTime)) {
                if (i < 3) {
                    console.log(`Point ${i} invalid data:`, {
                        x: point.x, y: point.y, 
                        mouse_x: point.mouse_x, mouse_y: point.mouse_y,
                        time: point.time, timestamp: point.timestamp,
                        relativeTime: point.relativeTime, relative_time: point.relative_time,
                        parsed_x: x, parsed_y: y, parsed_time: currentTime
                    });
                }
                
                // If timestamps are missing but coordinates are valid, try using sample rate as fallback
                if (!isNaN(x) && !isNaN(y) && (isNaN(prevTime) || isNaN(currentTime))) {
                    // Use sample rate (16.66ms default) as time difference
                    const sampleRate = (typeof mouseview !== 'undefined' && mouseview.timing?.sampleRate) || 16.66;
                    const timeDiff = sampleRate;
                    
                    // Determine quadrant and add time using sample rate
                    if (x < centerX && y < centerY) {
                        quadrantTimes.topLeft += timeDiff;
                    } else if (x >= centerX && y < centerY) {
                        quadrantTimes.topRight += timeDiff;
                    } else if (x < centerX && y >= centerY) {
                        quadrantTimes.bottomLeft += timeDiff;
                    } else {
                        quadrantTimes.bottomRight += timeDiff;
                    }
                    
                    validPointsProcessed++;
                    continue;
                }
                
                invalidPointsSkipped++;
                continue;
            }
            
            // Validate time progression
            const timeDiff = currentTime - prevTime;
            if (timeDiff < 0 || timeDiff > 5000) { // Skip unrealistic time differences (>5 seconds)
                invalidPointsSkipped++;
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
            
            validPointsProcessed++;
        }
        
        // Log processing summary for debugging
        const totalPoints = mouseData.length - 1; // -1 because we start from index 1
        console.log(`Quadrant calculation: ${validPointsProcessed}/${totalPoints} points processed, ${invalidPointsSkipped} invalid points skipped`);
        
        // Ensure all values are numbers (never NaN)
        quadrantTimes.topLeft = isNaN(quadrantTimes.topLeft) ? 0 : Math.round(quadrantTimes.topLeft);
        quadrantTimes.topRight = isNaN(quadrantTimes.topRight) ? 0 : Math.round(quadrantTimes.topRight);
        quadrantTimes.bottomLeft = isNaN(quadrantTimes.bottomLeft) ? 0 : Math.round(quadrantTimes.bottomLeft);
        quadrantTimes.bottomRight = isNaN(quadrantTimes.bottomRight) ? 0 : Math.round(quadrantTimes.bottomRight);
        
        return quadrantTimes;
    }
    
    getScreenRegion(x, y) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        if (x < centerX && y < centerY) return 'top-left';
        if (x >= centerX && y < centerY) return 'top-right';  
        if (x < centerX && y >= centerY) return 'bottom-left';
        return 'bottom-right';
    }
    
    getImageRegion(x, y) {
        // Determine which image region the mouse is over
        // This is approximate based on the CSS positioning
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Image positions (approximate)
        const topLeftBounds = { left: width * 0.15, right: width * 0.45, top: height * 0.25, bottom: height * 0.55 };
        const topRightBounds = { left: width * 0.55, right: width * 0.85, top: height * 0.25, bottom: height * 0.55 };
        const bottomLeftBounds = { left: width * 0.15, right: width * 0.45, top: height * 0.45, bottom: height * 0.75 };
        const bottomRightBounds = { left: width * 0.55, right: width * 0.85, top: height * 0.45, bottom: height * 0.75 };
        
        if (x >= topLeftBounds.left && x <= topLeftBounds.right && y >= topLeftBounds.top && y <= topLeftBounds.bottom) {
            return 'top-left-image';
        }
        if (x >= topRightBounds.left && x <= topRightBounds.right && y >= topRightBounds.top && y <= topRightBounds.bottom) {
            return 'top-right-image';
        }
        if (x >= bottomLeftBounds.left && x <= bottomLeftBounds.right && y >= bottomLeftBounds.top && y <= bottomLeftBounds.bottom) {
            return 'bottom-left-image';
        }
        if (x >= bottomRightBounds.left && x <= bottomRightBounds.right && y >= bottomRightBounds.top && y <= bottomRightBounds.bottom) {
            return 'bottom-right-image';
        }
        
        return 'background';
    }
    
    getDistanceFromCenter(x, y) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        return Math.round(Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)));
    }
    
    // === EMAIL SENDING FUNCTIONALITY ===
    
    /**
     * Send participant completion notification to researcher via email
     * No CSV data attachments - researcher downloads from admin dashboard
     */
    async sendDataToResearcher() {
        console.log('=== EMAIL NOTIFICATION SENDING ===');
        console.log('Current URL:', window.location.href);
        console.log('Domain:', window.location.hostname);
        
        if (!window.EMAIL_CONFIG) {
            console.error('EmailJS not configured. Please set up EMAIL_CONFIG in index.html');
            throw new Error('EmailJS configuration missing');
        }
        
        if (!window.emailjs) {
            console.error('EmailJS library not loaded');
            throw new Error('EmailJS library not available');
        }
        
        try {
            // Calculate completion time
            const completionDate = new Date();
            const expiryDate = new Date(completionDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
            
            // Prepare email template parameters (participant info only)
            const templateParams = {
                participant_id: this.participantData.participant_id,
                participant_email: this.participantData.participant_email || 'not provided',
                session: this.participantData.session,
                completion_date: completionDate.toLocaleDateString(),
                completion_time: completionDate.toLocaleTimeString(),
                researcher_email: window.EMAIL_CONFIG.researcherEmail,
                total_trials: this.trialData.length,
                total_mouse_points: this.getMouseData().length,
                browser_info: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                
                // Download instructions
                download_message: 'Please download the participant data from the admin dashboard within 7 days.',
                expiry_date: expiryDate.toLocaleDateString(),
                admin_url: window.location.origin, // Base URL for admin access
                
                // Data summary
                data_summary: `Trial data: ${this.trialData.length} trials completed, Mouse tracking: ${this.getMouseData().length} data points recorded`
            };
            
            console.log('Sending email notification with params:', {
                participant_id: templateParams.participant_id,
                session: templateParams.session,
                completion_time: templateParams.completion_date + ' ' + templateParams.completion_time,
                total_trials: templateParams.total_trials,
                total_mouse_points: templateParams.total_mouse_points,
                expiry_date: templateParams.expiry_date
            });
            
            // Send email via EmailJS
            console.log('Attempting to send email notification with EmailJS...');
            console.log('Service ID:', window.EMAIL_CONFIG.serviceID);
            console.log('Template ID:', window.EMAIL_CONFIG.templateID);
            
            const response = await emailjs.send(
                window.EMAIL_CONFIG.serviceID,
                window.EMAIL_CONFIG.templateID,
                templateParams
            );
            
            console.log('Email notification sent successfully!');
            console.log('EmailJS Response:', response);
            console.log('Response status:', response.status);
            console.log('Response text:', response.text);
            console.log('=== END EMAIL NOTIFICATION ===');
            
            return {
                success: true,
                message: 'Participant completion notification sent to researcher',
                emailId: response.text
            };
            
        } catch (error) {
            console.error('Failed to send email notification:', error);
            console.log('=== END EMAIL NOTIFICATION ===');
            
            return {
                success: false,
                message: 'Failed to send completion notification: ' + error.message,
                error: error
            };
        }
    }
    
    /**
     * Format file size in human readable format
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Format expiry date (14 days from now)
     */
    formatExpiryDate(daysFromNow) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toLocaleDateString();
    }
    
    /**
     * Get trial data as CSV string (for email)
     */
    getTrialDataCSV() {
        // Filter out internal fields for CSV export
        const excludeFields = ['_trial_start_time', '_trial_end_time', '_trial_duration', '_relative_start_time'];
        
        const filteredTrialData = this.trialData.map(trial => {
            const filtered = {};
            Object.keys(trial).forEach(key => {
                if (!key.startsWith('_') && !excludeFields.includes(key)) {
                    filtered[key] = trial[key];
                }
            });
            return filtered;
        });
        
        return this.convertToCSV(filteredTrialData);
    }
    
    /**
     * Get mouse data as CSV string (for email)
     */
    getMouseDataCSV() {
        return this.convertToCSV(this.mouseTrackingData);
    }
    
    // Data export functions
    
    /**
     * Generate trial CSV content (for file storage)
     */
    generateTrialCSVContent() {
        console.log('=== CSV EXPORT DEBUG ===');
        console.log('Original trial data fields:', this.trialData.length > 0 ? Object.keys(this.trialData[0]) : 'No data');
        
        // Filter out internal fields and specific timing fields for CSV export
        const excludeFields = ['_trial_start_time', '_trial_end_time', '_trial_duration', '_relative_start_time',
                              'trial_start_time', 'trial_end_time', 'trial_duration', 'relative_start_time'];
        
        const filteredTrialData = this.trialData.map(trial => {
            const filtered = {};
            Object.keys(trial).forEach(key => {
                if (!key.startsWith('_') && !excludeFields.includes(key)) {
                    filtered[key] = trial[key];
                }
            });
            return filtered;
        });
        
        console.log('Filtered CSV fields:', filteredTrialData.length > 0 ? Object.keys(filteredTrialData[0]) : 'No data');
        console.log('Excluded fields found:', excludeFields.filter(field => 
            this.trialData.length > 0 && this.trialData[0].hasOwnProperty(field)
        ));
        
        return this.convertToCSV(filteredTrialData);
    }

    exportTrialData() {
        const csv = this.generateTrialCSVContent();
        this.downloadCSV(csv, `trial_data_${this.participantData.participant_id}_${this.getTimestamp()}.csv`);
    }
    
    /**
     * Generate mouse CSV content (for file storage)
     */
    generateMouseCSVContent() {
        return this.convertToCSV(this.mouseTrackingData);
    }

    exportMouseData() {
        const csv = this.generateMouseCSVContent();
        this.downloadCSV(csv, `mouse_data_${this.participantData.participant_id}_${this.getTimestamp()}.csv`);
    }
    
    
    exportAllData() {
        // Export summary JSON file with all data
        const allData = {
            participant: this.participantData,
            trials: this.trialData,
            mouseTracking: this.mouseTrackingData,
            export_timestamp: new Date().toISOString()
        };
        
        const json = JSON.stringify(allData, null, 2);
        this.downloadJSON(json, `experiment_data_${this.participantData.participant_id}_${this.getTimestamp()}.json`);
        
        // Also export individual CSV files
        this.exportTrialData();
        this.exportMouseData();
    }
    
    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                // Handle values that might contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(','))
        ].join('\n');
        
        return csvContent;
    }
    
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, filename);
    }
    
    downloadJSON(jsonContent, filename) {
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        this.downloadBlob(blob, filename);
    }
    
    downloadBlob(blob, filename) {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`Downloaded: ${filename}`);
    }
    
    getTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
               new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    }
    
    // Data access methods
    
    getTrialData() {
        return [...this.trialData];
    }
    
    getMouseData() {
        return [...this.mouseTrackingData];
    }
    
    
    getParticipantData() {
        return { ...this.participantData };
    }
    
    getSummaryStats() {
        return {
            participant_id: this.participantData.participant_id,
            total_trials: this.trialData.length,
            total_mouse_points: this.mouseTrackingData.length,
            experiment_duration: this.trialData.length > 0 ? 
                Math.max(...this.trialData.map(t => t._trial_end_time)) - this.experimentStartTime : 0
        };
    }
    
    clearData() {
        this.trialData = [];
        this.mouseTrackingData = [];
        console.log('All data cleared');
    }
    
    // === INDIVIDUAL TRIAL HEATMAP GENERATION ===
    
    /**
     * Get mouse data for a specific trial
     */
    getTrialMouseData(trialIndex) {
        return this.mouseTrackingData.filter(point => point.trial_idx === trialIndex + 1);
    }
    
    /**
     * Get trial metadata (type, images, etc.)
     */
    getTrialMetadata(trialIndex) {
        const trialData = this.trialData.find(trial => trial.trial_idx === trialIndex + 1);
        if (!trialData) return null;
        
        return {
            trial_idx: trialData.trial_idx,
            trial_type: trialData.trial_type,
            images: {
                dysphoric: trialData.img_dysphoric,
                threat: trialData.img_threat,
                positive: trialData.img_positive,
                neutral: trialData.img_neutral,
                filler1: trialData.img_filler1,
                filler2: trialData.img_filler2,
                filler3: trialData.img_filler3,
                filler4: trialData.img_filler4
            },
            duration: trialData.trial_duration,
            mouse_points: trialData.mouse_data_points
        };
    }
    
    /**
     * Format mouse data for MouseView.js heatmap consumption
     */
    formatDataForHeatmap(mouseData) {
        return mouseData.map(point => ({
            x: point.mouse_x,
            y: point.mouse_y,
            timestamp: point.timestamp,
            relativeTime: point.relative_time
        }));
    }
    
    /**
     * Generate heatmap for a specific trial
     */
    async generateTrialHeatmap(trialIndex) {
        console.log(`Generating heatmap for trial ${trialIndex + 1}...`);
        
        const mouseData = this.getTrialMouseData(trialIndex);
        const metadata = this.getTrialMetadata(trialIndex);
        
        if (!mouseData || mouseData.length === 0) {
            console.warn(`No mouse data for trial ${trialIndex + 1}`);
            return null;
        }
        
        if (!metadata) {
            console.warn(`No metadata for trial ${trialIndex + 1}`);
            return null;
        }
        
        try {
            // Clear any existing heatmap
            if (typeof mouseview !== 'undefined' && mouseview.clearHeatMap) {
                mouseview.clearHeatMap();
            }
            
            // Format data for MouseView
            const formattedData = this.formatDataForHeatmap(mouseData);
            
            // Load the trial-specific mouse data into MouseView
            if (typeof mouseview !== 'undefined' && mouseview.datalogger) {
                // Temporarily replace datalogger data with trial-specific data
                const originalData = mouseview.datalogger.data;
                mouseview.datalogger.data = formattedData;
                
                // Generate heatmap
                await new Promise(resolve => {
                    mouseview.plotHeatMap();
                    // Give MouseView time to render the heatmap
                    setTimeout(resolve, 1500); // Increased wait time
                });
                
                // Capture the heatmap as image
                const imageBlob = await this.captureHeatmapAsImage(mouseData);
                
                // Restore original data
                mouseview.datalogger.data = originalData;
                
                // Clear the heatmap
                mouseview.clearHeatMap();
                
                return {
                    blob: imageBlob,
                    metadata: metadata,
                    filename: this.generateHeatmapFilename(metadata)
                };
                
            } else {
                throw new Error('MouseView not available for heatmap generation');
            }
            
        } catch (error) {
            console.error(`Error generating heatmap for trial ${trialIndex + 1}:`, error);
            return null;
        }
    }
    
    /**
     * Capture the current heatmap overlay as an image blob
     */
    async captureHeatmapAsImage(mouseData = null) {
        return new Promise((resolve, reject) => {
            try {
                console.log('=== HEATMAP CAPTURE DEBUG ===');
                
                // Wait a bit longer for heatmap to fully render
                setTimeout(() => {
                    // Debug: Log all DOM elements that might be heatmap-related
                    console.log('All DOM elements with "mouseview" in id/class:');
                    document.querySelectorAll('*').forEach(el => {
                        if (el.id && el.id.toLowerCase().includes('mouseview')) {
                            console.log('- Element by ID:', el.tagName, el.id, el.className);
                        }
                        if (el.className && el.className.toString().toLowerCase().includes('mouseview')) {
                            console.log('- Element by class:', el.tagName, el.id, el.className);
                        }
                    });
                    
                    console.log('All canvas elements in DOM:');
                    document.querySelectorAll('canvas').forEach(canvas => {
                        console.log('- Canvas:', canvas.tagName, canvas.id, canvas.className, `${canvas.width}x${canvas.height}`);
                    });
                    
                    // Look for MouseView heatmap elements more comprehensively
                    const possibleSelectors = [
                        'canvas[id*="heatmap"]',
                        'canvas[class*="heatmap"]',
                        'canvas[id*="mouseview"]',
                        'canvas[class*="mouseview"]',
                        '#mouseview-heatmap-overlay',
                        '.mouseview-heatmap',
                        'canvas'
                    ];
                    
                    let heatmapCanvas = null;
                    
                    for (const selector of possibleSelectors) {
                        const elements = document.querySelectorAll(selector);
                        console.log(`Checking selector "${selector}": found ${elements.length} elements`);
                        
                        // Look for canvas elements that might contain heatmap data
                        for (const element of elements) {
                            if (element.tagName === 'CANVAS') {
                                const ctx = element.getContext('2d');
                                const imageData = ctx.getImageData(0, 0, element.width, element.height);
                                
                                // Check if canvas has non-transparent pixels (actual content)
                                let hasContent = false;
                                for (let i = 3; i < imageData.data.length; i += 4) {
                                    if (imageData.data[i] > 0) { // Check alpha channel
                                        hasContent = true;
                                        break;
                                    }
                                }
                                
                                console.log(`Canvas ${element.id || 'unnamed'}: ${element.width}x${element.height}, hasContent: ${hasContent}`);
                                
                                if (hasContent && (element.width > 100 && element.height > 100)) {
                                    heatmapCanvas = element;
                                    console.log('Found heatmap canvas:', element);
                                    break;
                                }
                            }
                        }
                        
                        if (heatmapCanvas) break;
                    }
                    
                    if (heatmapCanvas) {
                        console.log('Capturing heatmap from canvas...');
                        
                        // Hide the heatmap canvas from participants during processing
                        const originalDisplay = heatmapCanvas.style.display;
                        const originalVisibility = heatmapCanvas.style.visibility;
                        const originalPosition = heatmapCanvas.style.position;
                        const originalTop = heatmapCanvas.style.top;
                        const originalLeft = heatmapCanvas.style.left;
                        const originalZIndex = heatmapCanvas.style.zIndex;
                        
                        heatmapCanvas.style.display = 'none';
                        heatmapCanvas.style.visibility = 'hidden';
                        heatmapCanvas.style.position = 'absolute';
                        heatmapCanvas.style.top = '-9999px';
                        heatmapCanvas.style.left = '-9999px';
                        heatmapCanvas.style.zIndex = '-1000';
                        
                        heatmapCanvas.toBlob((blob) => {
                            // Restore original styles after blob creation
                            heatmapCanvas.style.display = originalDisplay;
                            heatmapCanvas.style.visibility = originalVisibility;
                            heatmapCanvas.style.position = originalPosition;
                            heatmapCanvas.style.top = originalTop;
                            heatmapCanvas.style.left = originalLeft;
                            heatmapCanvas.style.zIndex = originalZIndex;
                            resolve(blob);
                        }, 'image/png', 1.0);
                    } else {
                        console.log('No heatmap canvas found, creating fallback...');
                        // Create a more meaningful fallback that shows the mouse data
                        this.createFallbackHeatmapImage(mouseData).then(resolve).catch(reject);
                    }
                    
                }, 1000); // Increased wait time for heatmap rendering
                
            } catch (error) {
                console.error('Error in captureHeatmapAsImage:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Create a fallback heatmap image using canvas and the mouse data
     */
    async createFallbackHeatmapImage(mouseData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Hide canvas from participants during processing
            canvas.style.display = 'none';
            canvas.style.visibility = 'hidden';
            canvas.style.position = 'absolute';
            canvas.style.top = '-9999px';
            canvas.style.left = '-9999px';
            canvas.style.zIndex = '-1000';
            
            // Black background
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // If we have mouse data, draw simple heat points
            if (mouseData && mouseData.length > 0) {
                // Create a simple heatmap visualization
                const points = mouseData.map(point => ({ x: point.mouse_x, y: point.mouse_y }));
                
                // Draw heat points
                points.forEach((point, index) => {
                    const alpha = Math.min(1, (index / points.length) * 0.5 + 0.1);
                    const radius = 20;
                    
                    // Create radial gradient for heat effect
                    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
                    gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
                    gradient.addColorStop(0.5, `rgba(255, 255, 0, ${alpha * 0.5})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                // Add text overlay
                ctx.fillStyle = 'white';
                ctx.font = '16px Arial';
                ctx.fillText(`${points.length} mouse tracking points`, 20, 30);
            } else {
                // No data message
                ctx.fillStyle = 'white';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('No mouse tracking data available', canvas.width / 2, canvas.height / 2);
            }
            
            canvas.toBlob(resolve, 'image/png', 1.0);
        });
    }
    
    /**
     * Generate filename for heatmap image
     */
    generateHeatmapFilename(metadata) {
        const trialNum = metadata.trial_idx.toString().padStart(2, '0');
        const trialType = metadata.trial_type;
        return `trial_${trialNum}_${trialType}_heatmap.png`;
    }
    
    
    /**
     * Generate heatmap ZIP as blob (without auto-download)
     */
    async generateHeatmapZipBlob(onProgress = null) {
        console.log('Generating heatmap ZIP blob...');
        
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded');
        }
        
        const zip = new JSZip();
        const totalTrials = this.trialData.length;
        let successCount = 0;
        let errorCount = 0;
        
        // Create metadata file for the ZIP
        const summaryData = {
            participant_id: this.participantData.participant_id,
            generation_date: new Date().toISOString(),
            total_trials: totalTrials,
            heatmaps_generated: 0,
            trial_info: []
        };
        
        for (let i = 0; i < totalTrials; i++) {
            try {
                if (onProgress) {
                    const progressPercent = Math.round((i / totalTrials) * 80); // 0-80% for heatmap generation
                    onProgress(i + 1, totalTrials, `Generating heatmap for trial ${i + 1}...`);
                }
                
                const heatmapData = await this.generateTrialHeatmap(i);
                
                if (heatmapData) {
                    // Add image to ZIP
                    zip.file(heatmapData.filename, heatmapData.blob);
                    
                    // Add to summary
                    summaryData.trial_info.push({
                        trial_idx: heatmapData.metadata.trial_idx,
                        trial_type: heatmapData.metadata.trial_type,
                        filename: heatmapData.filename,
                        mouse_points: heatmapData.metadata.mouse_points,
                        duration_ms: heatmapData.metadata.duration
                    });
                    
                    successCount++;
                    console.log(`✓ Generated heatmap for trial ${i + 1}`);
                } else {
                    errorCount++;
                    console.warn(`✗ Failed to generate heatmap for trial ${i + 1}`);
                }
                
                // Small delay to prevent overwhelming the browser
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Error processing trial ${i + 1}:`, error);
                errorCount++;
            }
        }
        
        // Update summary with final counts
        summaryData.heatmaps_generated = successCount;
        summaryData.errors = errorCount;
        
        // Add summary file to ZIP
        zip.file('heatmap_summary.json', JSON.stringify(summaryData, null, 2));
        
        if (onProgress) {
            onProgress(totalTrials, totalTrials, 'Creating ZIP file...');
        }
        
        // Generate ZIP blob (don't download)
        const zipBlob = await zip.generateAsync({type: 'blob'});
        
        console.log(`Heatmap ZIP blob generated: ${successCount} success, ${errorCount} errors`);
        console.log(`ZIP size: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`);
        
        return zipBlob;
    }
    
    /**
     * Generate heatmaps for all trials and create downloadable ZIP
     */
    async generateAllTrialHeatmaps(onProgress = null) {
        console.log('Starting batch heatmap generation...');
        
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded');
        }
        
        const zip = new JSZip();
        const totalTrials = this.trialData.length;
        let successCount = 0;
        let errorCount = 0;
        
        // Debug: Show trial breakdown
        const imageTrials = this.trialData.filter(t => t.trial_type === 'image');
        const fillerTrials = this.trialData.filter(t => t.trial_type === 'filler');
        console.log(`=== HEATMAP GENERATION BREAKDOWN ===`);
        console.log('Total trials to process:', totalTrials);
        console.log('Image trials:', imageTrials.length);
        console.log('Filler trials:', fillerTrials.length);
        console.log('Image trial indices:', imageTrials.map(t => t.trial_idx));
        console.log('Filler trial indices:', fillerTrials.map(t => t.trial_idx));
        console.log(`=== END HEATMAP BREAKDOWN ===`);
        
        // Create metadata file for the ZIP
        const summaryData = {
            participant_id: this.participantData.participant_id,
            generation_date: new Date().toISOString(),
            total_trials: totalTrials,
            heatmaps_generated: 0,
            trial_info: []
        };
        
        for (let i = 0; i < totalTrials; i++) {
            try {
                if (onProgress) {
                    onProgress(i + 1, totalTrials, `Generating heatmap for trial ${i + 1}...`);
                }
                
                const heatmapData = await this.generateTrialHeatmap(i);
                
                if (heatmapData) {
                    // Add image to ZIP
                    zip.file(heatmapData.filename, heatmapData.blob);
                    
                    // Add to summary
                    summaryData.trial_info.push({
                        trial_idx: heatmapData.metadata.trial_idx,
                        trial_type: heatmapData.metadata.trial_type,
                        filename: heatmapData.filename,
                        mouse_points: heatmapData.metadata.mouse_points,
                        duration_ms: heatmapData.metadata.duration
                    });
                    
                    successCount++;
                    console.log(`✓ Generated heatmap for trial ${i + 1}`);
                } else {
                    errorCount++;
                    console.warn(`✗ Failed to generate heatmap for trial ${i + 1}`);
                }
                
                // Small delay to prevent overwhelming the browser
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Error processing trial ${i + 1}:`, error);
                errorCount++;
            }
        }
        
        // Update summary with final counts
        summaryData.heatmaps_generated = successCount;
        summaryData.errors = errorCount;
        
        // Add summary file to ZIP
        zip.file('heatmap_summary.json', JSON.stringify(summaryData, null, 2));
        
        if (onProgress) {
            onProgress(totalTrials, totalTrials, 'Creating ZIP file...');
        }
        
        // Generate and download ZIP
        const zipBlob = await zip.generateAsync({type: 'blob'});
        const filename = `trial_heatmaps_${this.participantData.participant_id}_${this.getTimestamp()}.zip`;
        
        this.downloadBlob(zipBlob, filename);
        
        console.log(`Heatmap generation complete: ${successCount} success, ${errorCount} errors`);
        return {
            success: successCount,
            errors: errorCount,
            filename: filename
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
}