/**
 * ExperimentController - Main controller for the Images Free Viewing experiment
 * Orchestrates all components and manages experiment flow
 */

class ExperimentController {
    constructor() {
        this.currentState = 'welcome';
        this.currentTrial = 0;
        this.maxTrials = 12;
        this.fillerTrialCounter = 0;
        this.globalTrialNumber = 0; // Tracks total trial number including fillers
        this.imageTrialCounter = 0; // Tracks image trials separately
        
        // Initialize components
        this.mouseView = null;
        this.imageManager = null;
        this.dataManager = null;
        this.practiceManager = null;
        
        // Experiment settings
        this.settings = {
            fixationDuration: 2000, // ms (2 seconds)
            imageViewingTime: 15000, // 15 seconds automatic progression
            enableMouseTracking: true,
            enablePractice: true,
            debug: false,
            showTimer: false, // Hide timer during main trials
            showProgress: false, // Hide trial progress indicator
            showPracticeTimer: false, // Hide timer during practice trials
            apertureSize: '20%' // Aperture size for mouse spotlight (increased from 12%)
        };
        
        // State tracking
        this.experimentStarted = false;
        this.isExperimentRunning = false;
        this.currentTrialData = null;
        this.currentMouseData = [];
        
        console.log('ExperimentController initialized');
    }
    
    async init() {
        try {
            // Initialize components
            this.initializeComponents();
            
            // Set up event listeners
            this.bindEvents();
            
            // Initialize first screen
            this.showScreen('welcome');
            
            console.log('Experiment controller ready');
        } catch (error) {
            console.error('Failed to initialize experiment:', error);
            this.showError('Failed to initialize experiment. Please refresh the page.');
        }
    }
    
    initializeComponents() {

        // Initialize managers
        this.imageManager = new ImageManager();
        this.dataManager = new DataManager();
        this.practiceManager = new PracticeManager(this.dataManager, this.imageManager, this.settings);
        
        console.log('All components initialized - MouseView.js will be activated during trials');
    }
    
    bindEvents() {
        // Welcome screen events
        const startBtn = document.getElementById('start-experiment');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.handleStartExperiment());
        }
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Participant form events
        const participantForm = document.getElementById('participant-form');
        if (participantForm) {
            participantForm.addEventListener('submit', (e) => this.handleParticipantForm(e));
        }
        
        // Skip practice button
        const skipPracticeBtn = document.getElementById('skip-practice');
        if (skipPracticeBtn) {
            skipPracticeBtn.addEventListener('click', () => this.skipPractice());
        }
        
        // Continue trial button
        const continueTrialBtn = document.getElementById('continue-trial');
        if (continueTrialBtn) {
            continueTrialBtn.addEventListener('click', () => this.continueToNextTrial());
        }
        
        // Admin/Debug download buttons (hidden from participants)
        const downloadTrialBtn = document.getElementById('download-trial-data');
        const downloadMouseBtn = document.getElementById('download-mouse-data');
        const downloadTrialHeatmapsBtn = document.getElementById('download-trial-heatmaps');
        const restartBtn = document.getElementById('restart-experiment');
        
        if (downloadTrialBtn) {
            downloadTrialBtn.addEventListener('click', () => this.dataManager.exportTrialData());
        }
        if (downloadMouseBtn) {
            downloadMouseBtn.addEventListener('click', () => this.dataManager.exportMouseData());
        }
        if (downloadTrialHeatmapsBtn) {
            downloadTrialHeatmapsBtn.addEventListener('click', () => this.generateTrialHeatmaps());
        }
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartExperiment());
        }
        
        // Thank you screen close button
        const closeExperimentBtn = document.getElementById('close-experiment');
        if (closeExperimentBtn) {
            closeExperimentBtn.addEventListener('click', () => this.closeExperiment());
        }
        
        // Admin screen controls
        const showThankYouBtn = document.getElementById('show-thank-you');
        if (showThankYouBtn) {
            showThankYouBtn.addEventListener('click', () => this.showScreen('thank-you'));
        }
        
        // Transition screen button
        const startMainBtn = document.getElementById('start-main-experiment');
        if (startMainBtn) {
            startMainBtn.addEventListener('click', () => this.startMainExperiment());
        }
        
        console.log('Event listeners bound');
    }
    
    async handleStartExperiment() {
        this.showScreen('participant');
    }
    
    async handleParticipantForm(event) {
        event.preventDefault();
        
        const participantId = document.getElementById('participant-id').value;
        const participantEmail = document.getElementById('participant-email').value;
        const session = document.getElementById('session').value;
        
        if (!participantId.trim()) {
            alert('Please enter a participant ID');
            return;
        }
        
        if (!participantEmail.trim()) {
            alert('Please enter an email address');
            return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(participantEmail)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Set participant data
        this.dataManager.setParticipantInfo(participantId, participantEmail, session);
        
        // Start loading images
        await this.loadImages();
    }
    
    async loadImages() {
        this.showScreen('loading');
        this.updateLoadingMessage('Loading experiment configuration...');
        
        try {
            // Load configuration
            const configLoaded = await this.imageManager.loadConfig();
            if (!configLoaded) {
                throw new Error('Failed to load experiment configuration');
            }
            
            // Update settings from config
            if (this.imageManager.config && this.imageManager.config.config) {
                this.settings.imageViewingTime = this.imageManager.config.config.imageViewingTime;
                this.settings.fixationDuration = this.imageManager.config.config.fixationDuration;
                this.maxTrials = this.imageManager.config.config.numImageTrials || 12;
                console.log('Updated experiment settings from config:');
                console.log('- Image viewing time:', this.settings.imageViewingTime, 'ms');
                console.log('- Fixation duration:', this.settings.fixationDuration, 'ms');
                console.log('- Max trials:', this.maxTrials);
            }
            
            // Preload images
            this.updateLoadingMessage('Loading images...');
            const imagesLoaded = await this.imageManager.preloadAllImages(
                (loaded, total, imagePath) => {
                    this.updateLoadingMessage(`Loading images... ${loaded}/${total}`);
                }
            );
            
            if (!imagesLoaded) {
                throw new Error('Failed to load all images');
            }
            
            // Wait for loading screen to fully disappear before starting
            this.updateLoadingMessage('Ready!');
            await this.delay(500); // Give loading screen time to show "Ready!" 
            
            // Start practice trials or experiment
            console.log('Config loaded, starting practice...');
            if (this.settings.enablePractice) {
                await this.startPractice();
            } else {
                await this.startExperiment();
            }
            
        } catch (error) {
            console.error('Error during loading:', error);
            this.showError('Failed to load experiment data. Please check the image files and try again.');
        }
    }
    
    updateLoadingMessage(message) {
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }
    
    async startPractice() {
        console.log('Starting practice phase...');
        // Skip practice instructions screen - go directly to experiment screen for practice trial
        this.showScreen('experiment');
        
        // Force hide main progress indicator using CSS class
        const mainProgressIndicator = document.getElementById('progress-indicator');
        if (mainProgressIndicator) {
            mainProgressIndicator.classList.add('hide-during-practice');
        }
        
        // Wait a moment to ensure DOM is ready
        await this.delay(50);
        
        const practiceIndicator = document.getElementById('practice-indicator');
        if (practiceIndicator) {
            practiceIndicator.textContent = 'Practice Round';
            practiceIndicator.style.display = 'block';
            practiceIndicator.style.visibility = 'visible';
            practiceIndicator.style.zIndex = '1000';
            practiceIndicator.style.position = 'absolute';
            practiceIndicator.style.top = '20px';
            practiceIndicator.style.right = '20px';
            practiceIndicator.style.background = 'rgba(255, 165, 0, 0.9)';
            practiceIndicator.style.color = 'white';
            practiceIndicator.style.padding = '10px 15px';
            practiceIndicator.style.borderRadius = '5px';
            practiceIndicator.style.fontWeight = 'bold';
            practiceIndicator.style.opacity = '1';
        }
        
        try {
            await this.practiceManager.startPractice(
                (current, total) => {
                    console.log(`Practice progress: ${current}/${total}`);
                },
                (results) => {
                    console.log('Practice completed, showing transition screen:', results);
                    setTimeout(() => {
                        this.showTransitionScreen();
                    }, 500);
                }
            );
            console.log('Practice manager started successfully');
        } catch (error) {
            console.error('Practice error:', error);
            this.showError('Practice failed. Starting experiment without practice.');
            setTimeout(() => {
                this.startExperiment();
            }, 1000);
        }
    }
    
    skipPractice() {
        this.practiceManager.skipPractice();
        this.showTransitionScreen();
    }
    
    showTransitionScreen() {
        console.log('Showing transition screen...');
        
        // Hide practice indicator since practice is complete
        const practiceIndicator = document.getElementById('practice-indicator');
        if (practiceIndicator) {
            practiceIndicator.style.display = 'none';
        }
        
        // Hide main progress indicator during transition
        const mainProgressIndicator = document.getElementById('progress-indicator');
        if (mainProgressIndicator) {
            mainProgressIndicator.style.display = 'none';
        }
        
        // Ensure MouseView is deactivated for transition screen
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during transition (error):', error.message);
        }
        
        this.showScreen('transition');
    }
    
    async startMainExperiment() {
        console.log('Starting main experiment from transition screen...');
        
        // Ensure clean state before starting main experiment
        this.currentTrial = 0;
        this.fillerTrialCounter = 0;
        this.globalTrialNumber = 0;
        this.imageTrialCounter = 0;
        this.isExperimentRunning = false; // Will be set to true in startExperiment()
        
        // Small delay to ensure transition screen is fully processed
        await this.delay(100);
        
        this.startExperiment();
    }
    
    async startExperiment() {
        console.log('Starting main experiment...');
        this.experimentStarted = true;
        this.isExperimentRunning = true;
        this.currentTrial = 0;
        this.fillerTrialCounter = 0;
        this.globalTrialNumber = 0;
        this.imageTrialCounter = 0;
        
        // Debug: Check if image manager is ready
        console.log('Image manager ready:', !!this.imageManager);
        console.log('Config loaded:', !!this.imageManager.config);
        console.log('Image trials:', this.imageManager.imageTrials ? this.imageManager.imageTrials.length : 'none');
        console.log('Max trials:', this.maxTrials);
        
        // Initialize experiment data collection
        this.dataManager.startExperiment();
        
        // Show experiment screen
        this.showScreen('experiment');
        
        // Hide practice indicator (if visible) and ensure main progress indicator is visible
        const practiceIndicator = document.getElementById('practice-indicator');
        if (practiceIndicator) {
            practiceIndicator.style.display = 'none';
        }
        
        // Handle main progress indicator based on settings
        const mainProgressIndicator = document.getElementById('progress-indicator');
        if (mainProgressIndicator) {
            mainProgressIndicator.classList.remove('hide-during-practice');
            
            if (this.settings.showProgress) {
                mainProgressIndicator.style.display = 'block';
                mainProgressIndicator.style.visibility = 'visible';
                mainProgressIndicator.style.opacity = '1';
                mainProgressIndicator.style.zIndex = '200';
                console.log('Progress indicator made visible');
            } else {
                mainProgressIndicator.style.display = 'none';
                console.log('Progress indicator hidden by settings');
            }
        }
        
        // Configure MouseView for main experiment trials only and wait for it to be ready
        await this.configureMouseView();
        
        // Note: Cursor remains visible during trials to work with MouseView spotlight
        
        // Start first trial
        console.log('About to start first trial...');
        await this.runTrial();
        
        console.log('Experiment started');
    }
    
    async runTrial() {
        // Calculate total trials (20 = 12 image + 8 filler)
        const totalTrials = this.imageManager.fillerPattern.length;
        
        console.log(`Running trial ${this.globalTrialNumber + 1} of ${totalTrials}`);
        
        if (this.globalTrialNumber >= totalTrials) {
            console.log('All trials completed, finishing experiment');
            await this.finishExperiment();
            return;
        }
        
        // Increment global trial number
        this.globalTrialNumber++;
        
        // Update progress indicator with total trials
        this.updateProgress(this.globalTrialNumber, totalTrials);
        
        try {
            // Show center button (start for first trial, next for others)
            if (this.globalTrialNumber === 1) {
                console.log('Showing main start button for first trial...');
                await this.showMainStartButton();
            } else {
                console.log('Showing next trial button...');
                await this.showNextTrialButton();
            }
            
            // Check if this position is a filler trial or image trial
            const isFillerTrial = this.imageManager.fillerPattern[this.globalTrialNumber - 1];
            
            console.log(`=== TRIAL ${this.globalTrialNumber} LOGIC DEBUG ===`);
            console.log('globalTrialNumber:', this.globalTrialNumber);
            console.log('Pattern index:', this.globalTrialNumber - 1);
            console.log('fillerPattern[index]:', isFillerTrial);
            console.log('imageTrialCounter:', this.imageTrialCounter);
            console.log('fillerTrialCounter:', this.fillerTrialCounter);
            console.log('Full filler pattern:', this.imageManager.fillerPattern);
            console.log('=== END TRIAL LOGIC DEBUG ===');
            
            if (isFillerTrial) {
                console.log('Showing filler trial...');
                await this.showFillerTrial();
            } else {
                console.log('Showing image trial...');
                await this.showImageTrial();
            }
            
            // Brief inter-trial interval
            await this.delay(250);
            
            // Continue to next trial
            if (this.isExperimentRunning) {
                await this.runTrial();
            }
            
        } catch (error) {
            console.error('Error during trial:', error);
            this.showError('An error occurred during the trial. Continuing to next trial.');
            if (this.isExperimentRunning) {
                await this.runTrial();
            }
        }
    }
    
    async showMainStartButton() {
        const mainStartButton = document.getElementById('main-start-button');
        const imageContainer = document.getElementById('image-container');
        
        // Hide images
        this.imageManager.hideImages(imageContainer);
        
        // Disable MouseView during button display
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during main start button');
        }
        
        // Show main start button and wait for click
        if (mainStartButton) {
            mainStartButton.style.display = 'block';
            
            return new Promise((resolve) => {
                const startButton = mainStartButton.querySelector('.start-button');
                
                const handleClick = () => {
                    mainStartButton.style.display = 'none';
                    startButton.removeEventListener('click', handleClick);
                    resolve();
                };
                
                startButton.addEventListener('click', handleClick);
            });
        }
    }

    async showNextTrialButton() {
        const nextTrialButton = document.getElementById('next-trial-button');
        const imageContainer = document.getElementById('image-container');
        
        // Hide images
        this.imageManager.hideImages(imageContainer);
        
        // Disable MouseView during button display
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during next trial button');
        }
        
        // Show next trial button and wait for click
        if (nextTrialButton) {
            nextTrialButton.style.display = 'block';
            
            return new Promise((resolve) => {
                const nextButton = nextTrialButton.querySelector('.next-button');
                
                const handleClick = () => {
                    nextTrialButton.style.display = 'none';
                    nextButton.removeEventListener('click', handleClick);
                    resolve();
                };
                
                nextButton.addEventListener('click', handleClick);
            });
        }
    }

    async showFixation() {
        const fixationCross = document.getElementById('fixation-cross');
        const imageContainer = document.getElementById('image-container');
        
        // Hide images and show fixation
        this.imageManager.hideImages(imageContainer);
        fixationCross.classList.add('active');
        
        // Disable MouseView during fixation so cross is fully visible
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during fixation');
        }
        
        // Wait for fixation duration
        await this.delay(this.settings.fixationDuration);
        
        // Hide fixation
        fixationCross.classList.remove('active');
    }
    
    async showImageTrial() {
        const trialInfo = this.dataManager.startTrial(this.globalTrialNumber - 1, 'image');
        const imageData = this.imageManager.getTrialImages(this.imageTrialCounter);
        const imageContainer = document.getElementById('image-container');
        
        // Increment image trial counter
        this.imageTrialCounter++;
        
        // Configure MouseView for this trial
        this.configureMouseView();
        
        // Start mouse tracking
        try {
            if (typeof mouseview !== 'undefined') {
                mouseview.startTracking();
                console.log(`Mouse tracking started for trial ${this.currentTrial + 1}`);
            }
        } catch (error) {
            console.error('Error starting image trial:', error);
        }
        
        // Display images
        this.imageManager.displayImages(imageData, imageContainer);
        
        // Show countdown timer for timed trials
        if (this.settings.imageViewingTime > 0) {
            if (this.settings.showTimer) {
                this.showTrialCountdown();
            }
            await this.delay(this.settings.imageViewingTime);
            this.hideTrialCountdown();
        } else {
            // Show continue button and wait for user
            await this.waitForUserProgression();
        }
        
        // Stop tracking and collect data
        let mouseData = [];
        try {
            if (typeof mouseview !== 'undefined') {
                // Stop tracking first
                mouseview.stopTracking();
                
                // Get data using direct access (more reliable than getData() which has JSON parsing issues)
                mouseData = mouseview.datalogger?.data || [];
                
                // Clear data for next trial (to avoid accumulation)
                if (mouseview.datalogger) {
                    mouseview.datalogger.data = [];
                }
                
                console.log('Mouse tracking stopped, data collected');
                console.log('=== IMAGE TRIAL MOUSE DATA DEBUG ===');
                console.log('MouseData length:', mouseData.length);
                console.log('MouseData sample (first 3 points):', mouseData.slice(0, 3));
                console.log('=== END MOUSE DATA DEBUG ===');
            }
        } catch (error) {
            console.error('Error stopping mouse tracking:', error);
        }
        
        // Record trial data
        this.dataManager.recordTrialData(trialInfo, imageData, mouseData);
        this.dataManager.recordMouseData(mouseData, this.globalTrialNumber - 1, 'image');
        
        // Debug: Verify trial indexing
        console.log(`=== IMAGE TRIAL RECORDING DEBUG ===`);
        console.log('Global trial number:', this.globalTrialNumber);
        console.log('Image trial counter:', this.imageTrialCounter);
        console.log('Trial index used for data recording:', this.globalTrialNumber - 1);
        console.log('=== END IMAGE TRIAL RECORDING DEBUG ===');
        
        // Hide images
        this.imageManager.hideImages(imageContainer);
        
        console.log(`Image trial ${this.imageTrialCounter} completed`);
    }
    
    async showFillerTrial() {
        const fillerIndex = this.fillerTrialCounter % this.imageManager.neutralFillers.length;
        const trialInfo = this.dataManager.startTrial(this.globalTrialNumber - 1, 'filler');
        const fillerData = this.imageManager.getFillerImages(fillerIndex);
        const imageContainer = document.getElementById('image-container');
        
        // Increment filler trial counter
        this.fillerTrialCounter++;
        
        // Brief delay before filler
        await this.delay(500);
        
        // Configure MouseView for filler trial (same as main trials)
        this.configureMouseView();
        
        // Start mouse tracking for filler
        try {
            if (typeof mouseview !== 'undefined') {
                mouseview.startTracking();
                console.log(`Mouse tracking started for filler ${this.fillerTrialCounter + 1}`);
            }
        } catch (error) {
            console.error('Error starting filler tracking:', error);
        }
        
        // Display filler images
        this.imageManager.displayImages(fillerData, imageContainer);
        
        // Wait for viewing time with countdown
        if (this.settings.imageViewingTime > 0) {
            if (this.settings.showTimer) {
                this.showTrialCountdown();
            }
            await this.delay(this.settings.imageViewingTime);
            this.hideTrialCountdown();
        } else {
            await this.waitForUserProgression();
        }
        
        // Stop tracking and collect data
        let mouseData = [];
        try {
            if (typeof mouseview !== 'undefined') {
                // Stop tracking first
                mouseview.stopTracking();
                
                // Get data using direct access (more reliable than getData() which has JSON parsing issues)
                mouseData = mouseview.datalogger?.data || [];
                
                // Clear data for next trial (to avoid accumulation)
                if (mouseview.datalogger) {
                    mouseview.datalogger.data = [];
                }
                
                console.log('Filler mouse tracking stopped, data collected');
                console.log('=== FILLER TRIAL MOUSE DATA DEBUG ===');
                console.log('MouseData length:', mouseData.length);
                console.log('MouseData sample (first 3 points):', mouseData.slice(0, 3));
                console.log('=== END MOUSE DATA DEBUG ===');
            }
        } catch (error) {
            console.error('Error stopping filler tracking:', error);
        }
        
        // Record filler trial data
        this.dataManager.recordTrialData(trialInfo, fillerData, mouseData);
        this.dataManager.recordMouseData(mouseData, this.globalTrialNumber - 1, 'filler');
        
        // Debug: Verify trial indexing
        console.log(`=== FILLER TRIAL RECORDING DEBUG ===`);
        console.log('Global trial number:', this.globalTrialNumber);
        console.log('Filler trial counter:', this.fillerTrialCounter);
        console.log('Trial index used for data recording:', this.globalTrialNumber - 1);
        console.log('=== END FILLER TRIAL RECORDING DEBUG ===');
        
        // Hide images
        this.imageManager.hideImages(imageContainer);
        
        console.log(`Filler trial ${this.fillerTrialCounter} completed`);
    }
    
    async waitForUserProgression() {
        const continueBtn = document.getElementById('continue-trial');
        
        return new Promise((resolve) => {
            // Show continue button
            continueBtn.style.display = 'block';
            
            const handleContinue = () => {
                continueBtn.style.display = 'none';
                continueBtn.removeEventListener('click', handleContinue);
                resolve();
            };
            
            const handleKeyPress = (e) => {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    continueBtn.style.display = 'none';
                    document.removeEventListener('keydown', handleKeyPress);
                    resolve();
                }
            };
            
            continueBtn.addEventListener('click', handleContinue);
            document.addEventListener('keydown', handleKeyPress);
        });
    }
    
    continueToNextTrial() {
        const continueBtn = document.getElementById('continue-trial');
        continueBtn.style.display = 'none';
        
        // This will be handled by the promise in waitForUserProgression
    }
    
    updateProgress(current, total) {
        // Early exit if progress should be hidden
        if (!this.settings.showProgress) {
            console.log('Progress indicator hidden by settings');
            return;
        }
        
        console.log('=== UPDATE PROGRESS DEBUG ===');
        console.log('Called with current:', current, 'total:', total);
        
        const currentTrialElement = document.getElementById('current-trial');
        const totalTrialsElement = document.getElementById('total-trials');
        
        console.log('Current trial element:', currentTrialElement);
        console.log('Total trials element:', totalTrialsElement);
        
        if (currentTrialElement) {
            currentTrialElement.textContent = current;
            console.log('Set current trial to:', current);
        }
        if (totalTrialsElement) {
            totalTrialsElement.textContent = total;
            console.log('Set total trials to:', total);
        }
        
        // Check if progress indicator is visible
        const progressIndicator = document.getElementById('progress-indicator');
        if (progressIndicator) {
            console.log('Progress indicator display:', progressIndicator.style.display);
            console.log('Progress indicator visibility:', progressIndicator.style.visibility);
        }
        
        console.log('=== END UPDATE PROGRESS DEBUG ===');
    }
    
    async finishExperiment() {
        this.isExperimentRunning = false;
        
        // Clean up any running timers
        this.hideTrialCountdown();
        
        // Deactivate mouse tracking
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during finish (error):', error.message);
        }
        
        // Show processing screen immediately
        this.showScreen('processing');
        
        // Run data processing workflow
        await this.runDataProcessingWorkflow();
        
        console.log('Experiment completed');
        console.log('Summary:', this.dataManager.getSummaryStats());
    }
    
    /**
     * Complete data processing workflow with visual progress and File.io upload
     */
    async runDataProcessingWorkflow() {
        let heatmapUploadResult = null;
        
        try {
            // Step 1: Save data (immediate)
            this.updateProcessingStep('step-saving', 'active', '⏳');
            this.updateProgressBar(10, 'Saving experiment data...');
            await this.delay(500); // Brief delay for visual feedback
            this.updateProcessingStep('step-saving', 'completed', '✓');
            
            // Step 2: Generate and upload heatmaps (long process - do this before email)
            this.updateProcessingStep('step-heatmaps', 'active', '⏳');
            this.updateProgressBar(25, 'Generating visual heatmaps...');
            
            try {
                // Generate heatmaps and upload to File.io
                heatmapUploadResult = await this.dataManager.generateAllTrialHeatmapsWithUpload(
                    (current, total, message) => {
                        // Update progress during heatmap generation (25-80%)
                        const progressPercent = 25 + Math.round(((current / total) * 55));
                        this.updateProgressBar(progressPercent, message || `Generating heatmap ${current} of ${total}...`);
                    }
                );
                
                if (heatmapUploadResult && heatmapUploadResult.success) {
                    this.updateProcessingStep('step-heatmaps', 'completed', '✓');
                    this.updateProgressBar(80, 'Heatmaps uploaded successfully!');
                    console.log('✓ Heatmaps uploaded to File.io:', heatmapUploadResult.downloadUrl);
                } else {
                    this.updateProcessingStep('step-heatmaps', 'completed', '⚠️');
                    this.updateProgressBar(80, 'Heatmap upload failed, continuing...');
                    console.error('✗ Heatmap upload failed:', heatmapUploadResult?.error);
                }
            } catch (error) {
                console.error('Heatmap generation and upload failed:', error);
                this.updateProcessingStep('step-heatmaps', 'completed', '⚠️');
                this.updateProgressBar(80, 'Heatmap processing failed, continuing...');
            }
            
            // Step 3: Send email with heatmap link (priority)
            this.updateProcessingStep('step-email', 'active', '⏳');
            this.updateProgressBar(85, 'Sending data and heatmap link to researcher...');
            
            try {
                // Send email with heatmap information if available
                const emailResult = await this.dataManager.sendDataToResearcher(heatmapUploadResult);
                
                if (emailResult.success) {
                    this.updateProcessingStep('step-email', 'completed', '✓');
                    this.updateProgressBar(90, 'Data sent successfully to researcher!');
                } else {
                    this.updateProcessingStep('step-email', 'completed', '⚠️');
                    this.updateProgressBar(90, 'Email sending failed, data may be lost');
                }
            } catch (error) {
                console.error('Email sending failed:', error);
                this.updateProcessingStep('step-email', 'completed', '⚠️');
                this.updateProgressBar(90, 'Email sending failed');
            }
            
            // Step 4: Finalize
            this.updateProcessingStep('step-complete', 'active', '⏳');
            this.updateProgressBar(95, 'Finalizing...');
            await this.delay(1000);
            this.updateProcessingStep('step-complete', 'completed', '✓');
            
            // Complete
            this.updateProgressBar(100, 'Processing complete!');
            await this.delay(1500);
            
            // Show final thank you screen
            this.showScreen('thank-you');
            
        } catch (error) {
            console.error('Data processing workflow failed:', error);
            this.updateProgressBar(100, 'Processing completed with some errors');
            await this.delay(2000);
            this.showScreen('thank-you');
        }
    }
    
    /**
     * Send experiment data to researcher via email
     */
    async sendDataToResearcher() {        
        try {
            const result = await this.dataManager.sendDataToResearcher();
            
            if (result.success) {
                console.log('✓ Data successfully sent to researcher');
                return true;
            } else {
                console.error('✗ Failed to send data to researcher:', result.message);
                return false;
            }
            
        } catch (error) {
            console.error('✗ Email sending error:', error);
            return false;
        }
    }
    
    /**
     * Generate heatmaps in background with optional progress updates
     */
    async generateHeatmapsInBackground(showProgress = false) {
        console.log('Starting heatmap generation...');
        try {
            if (showProgress) {
                // Use the existing heatmap generation with progress callback
                await this.generateTrialHeatmaps();
            } else {
                // Run without UI updates
                await this.dataManager.generateAllTrialHeatmaps();
            }
            console.log('Heatmap generation completed');
            return true;
        } catch (error) {
            console.error('Heatmap generation failed:', error);
            return false;
        }
    }
    
    /**
     * Update processing step visual state
     */
    updateProcessingStep(stepId, state, icon) {
        const stepElement = document.getElementById(stepId);
        if (!stepElement) return;
        
        // Remove existing state classes
        stepElement.classList.remove('active', 'completed');
        
        // Add new state
        if (state === 'active' || state === 'completed') {
            stepElement.classList.add(state);
        }
        
        // Update icon
        const iconElement = stepElement.querySelector('.step-icon');
        if (iconElement) {
            iconElement.textContent = icon;
        }
    }
    
    /**
     * Update progress bar and message
     */
    updateProgressBar(percent, message) {
        const progressBar = document.getElementById('processing-progress-bar');
        const percentElement = document.getElementById('processing-percent');
        const messageElement = document.getElementById('processing-message');
        
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        
        if (percentElement) {
            percentElement.textContent = `${percent}% Complete`;
        }
        
        if (messageElement && message) {
            messageElement.textContent = message;
        }
    }
    
    /**
     * Close/end the experiment (called from thank you screen)
     */
    closeExperiment() {
        // Optional: Clear any remaining data from memory
        this.dataManager.clearData();
        
        // Show a simple goodbye message
        if (confirm('Thank you for participating! You may now close this window.')) {
            // User can close the window or we can redirect them
            window.close(); // May not work in all browsers due to security
        }
    }
    
    /**
     * Enable admin mode for researchers (hidden functionality)
     */
    enableAdminMode() {
        // Secret key combination or URL parameter to show admin controls
        const adminScreen = document.getElementById('admin-screen');
        if (adminScreen) {
            adminScreen.style.display = 'block';
            this.showScreen('admin');
        }
    }
    
    restartExperiment() {
        // Reset state
        this.currentState = 'welcome';
        this.currentTrial = 0;
        this.fillerTrialCounter = 0;
        this.globalTrialNumber = 0;
        this.imageTrialCounter = 0;
        this.experimentStarted = false;
        this.isExperimentRunning = false;
        
        // Clear data
        this.dataManager.clearData();
        
        // Reset UI (cursor was never hidden)
        // document.body.classList.remove('experiment-active'); // Not needed anymore
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during restart (error):', error.message);
        }
        
        // Show welcome screen
        this.showScreen('welcome');
        
        console.log('Experiment restarted');
    }
    
    handleKeyPress(event) {
        switch (event.code) {
            case 'Space':
                if (this.currentState === 'welcome') {
                    event.preventDefault();
                    this.handleStartExperiment();
                } else if (this.currentState === 'transition') {
                    event.preventDefault();
                    this.startMainExperiment();
                } else if (this.currentState === 'experiment') {
                    // Handle space bar for trial progression
                    const continueBtn = document.getElementById('continue-trial');
                    if (continueBtn.style.display === 'block') {
                        event.preventDefault();
                        this.continueToNextTrial();
                    }
                }
                break;
                
            case 'Escape':
                if (this.isExperimentRunning) {
                    if (confirm('Are you sure you want to exit the experiment?')) {
                        this.emergencyExit();
                    }
                }
                break;
                
            case 'KeyD':
                if (event.ctrlKey || event.metaKey) {
                    // Ctrl+D or Cmd+D for debug mode
                    event.preventDefault();
                    this.toggleDebugMode();
                }
                break;
                
            case 'KeyA':
                if (event.ctrlKey && event.shiftKey && this.currentState === 'thank-you') {
                    // Ctrl+Shift+A on thank you screen = Admin mode
                    event.preventDefault();
                    this.enableAdminMode();
                }
                break;
        }
    }
    
    emergencyExit() {
        this.isExperimentRunning = false;
        try {
            if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                mouseview.removeAll();
            }
        } catch (error) {
            console.log('MouseView removeAll skipped during emergency exit (error):', error.message);
        }
        // document.body.classList.remove('experiment-active'); // Not needed anymore
        
        // Clean up any running timers
        this.hideTrialCountdown();
        
        // Try to save partial data
        if (this.dataManager.getTrialData().length > 0) {
            this.dataManager.exportAllData();
        }
        
        this.showScreen('end');
        console.log('Emergency exit - partial data saved');
    }
    
    toggleDebugMode() {
        this.settings.debug = !this.settings.debug;
        
        // Toggle debug elements
        const labels = document.querySelectorAll('.image-label');
        labels.forEach(label => {
            label.classList.toggle('show-labels', this.settings.debug);
        });
        
        console.log('Debug mode:', this.settings.debug ? 'ON' : 'OFF');
    }
    
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Deactivate MouseView for all screens except during actual trials
        // MouseView should only be active during 'experiment' screen trials
        if (screenName !== 'experiment') {
            try {
                if (typeof mouseview !== 'undefined' && mouseview.removeAll) {
                    mouseview.removeAll();
                }
            } catch (error) {
                // Ignore errors when nothing to remove during initialization
                console.log('MouseView removeAll skipped (nothing to remove)');
            }
        }
        
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentState = screenName;
        }
        
        console.log(`Showing screen: ${screenName}`);
    }
    
    showError(message) {
        alert(message); // Simple error display - could be enhanced with a modal
        console.error('Experiment error:', message);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showTrialCountdown() {
        // Create countdown element for main trials
        let countdown = document.getElementById('trial-countdown');
        if (!countdown) {
            countdown = document.createElement('div');
            countdown.id = 'trial-countdown';
            countdown.style.cssText = `
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 1.2em;
                z-index: 200;
                font-weight: bold;
                opacity: 1;
                pointer-events: none;
            `;
            document.getElementById('experiment-screen').appendChild(countdown);
        }
        
        // Start countdown
        let timeLeft = this.settings.imageViewingTime / 1000;
        countdown.textContent = `Time: ${timeLeft}s`;
        countdown.style.display = 'block';
        
        const countdownInterval = setInterval(() => {
            timeLeft--;
            countdown.textContent = `Time: ${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        // Store interval ID for cleanup
        this.countdownInterval = countdownInterval;
    }
    
    hideTrialCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        const countdown = document.getElementById('trial-countdown');
        if (countdown) {
            countdown.style.display = 'none';
        }
    }
    
    // Public API methods for external control
    
    getCurrentState() {
        return this.currentState;
    }
    
    getCurrentTrial() {
        return this.currentTrial;
    }
    
    isRunning() {
        return this.isExperimentRunning;
    }
    
    getDataManager() {
        return this.dataManager;
    }
    
    getMouseView() {
        return this.mouseView;
    }
    
    getImageManager() {
        return this.imageManager;
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('Settings updated:', this.settings);
    }

    // Configure MouseView ONLY for image viewing trials
    async configureMouseView() {
        console.log('=== MAIN CONFIGURE MOUSEVIEW CALLED ===');
        try {
            console.log('MouseView available?', typeof mouseview !== 'undefined');
            if (typeof mouseview !== 'undefined') {
                console.log('MouseView object before config:', mouseview);
                console.log('Current params before config:', mouseview.params);
                
                console.log(`Setting aperture to ${this.settings.apertureSize}...`);
                mouseview.params.apertureSize = this.settings.apertureSize; // Configurable spotlight size
                mouseview.params.overlayAlpha = 0.85; // Consistent opacity for all trials
                mouseview.params.overlayColour = 'black'; // Consistent color for all trials
                mouseview.params.apertureGauss = 15; // Consistent edge smoothing for all trials
                
                console.log('Params after setting:', mouseview.params);
                console.log('Calling mouseview.init()...');
                mouseview.init();
                console.log('Params after init():', mouseview.params);
                
                // Wait for MouseView overlay to be ready before continuing
                await this.waitForMouseViewReady();
                
                console.log('MouseView configured and ready for trial');
                
                console.log('=== MAIN TRIAL MOUSEVIEW DEBUG ===');
                console.log('Main trial aperture size:', mouseview.params.apertureSize);
                console.log('Main trial overlay alpha:', mouseview.params.overlayAlpha);
                console.log('=== END MAIN TRIAL DEBUG ===');
            } else {
                console.error('MouseView is undefined in main trial!');
            }
        } catch (error) {
            console.error('Error configuring MouseView:', error);
            console.error('Error stack:', error.stack);
        }
        console.log('=== END MAIN CONFIGURE MOUSEVIEW ===');
    }

    // Wait for MouseView overlay to be ready and visible
    async waitForMouseViewReady() {
        return new Promise((resolve) => {
            const checkOverlay = () => {
                const overlay = document.querySelector('#mouseview-overlay') || 
                               document.querySelector('.mouseview-overlay');
                
                console.log('Checking MouseView overlay readiness...');
                
                if (overlay) {
                    console.log('Overlay found:', overlay);
                    console.log('Overlay style:', overlay.style.cssText);
                    console.log('Overlay opacity:', overlay.style.opacity);
                    
                    // Consider overlay ready if it exists and has been initialized
                    resolve();
                } else {
                    console.log('Overlay not ready, checking again in 50ms...');
                    setTimeout(checkOverlay, 50);
                }
            };
            checkOverlay();
        });
    }


    async generateTrialHeatmaps() {
        console.log('Starting trial heatmap generation...');
        
        // Debug: Check total trials before generation
        const totalDataTrials = this.dataManager.getTrialData().length;
        console.log(`=== HEATMAP GENERATION DEBUG ===`);
        console.log('Total trials in data manager:', totalDataTrials);
        console.log('Global trial number reached:', this.globalTrialNumber);
        console.log('Image trials completed:', this.imageTrialCounter);
        console.log('Filler trials completed:', this.fillerTrialCounter);
        console.log('Expected total (should be 20):', this.imageTrialCounter + this.fillerTrialCounter);
        console.log('=== END HEATMAP GENERATION DEBUG ===');
        
        // Show progress UI
        const progressDiv = document.getElementById('heatmap-progress');
        const progressText = document.getElementById('heatmap-progress-text');
        const progressBar = document.getElementById('heatmap-progress-bar');
        const downloadBtn = document.getElementById('download-trial-heatmaps');
        
        if (progressDiv && downloadBtn) {
            progressDiv.style.display = 'block';
            downloadBtn.disabled = true;
            downloadBtn.textContent = 'Generating...';
        }
        
        try {
            const result = await this.dataManager.generateAllTrialHeatmaps(
                (current, total, message) => {
                    // Update progress
                    const percent = Math.round((current / total) * 100);
                    if (progressText) {
                        progressText.textContent = message || `Generating heatmap ${current} of ${total}...`;
                    }
                    if (progressBar) {
                        progressBar.style.width = `${percent}%`;
                    }
                }
            );
            
            // Show completion message
            if (progressText) {
                progressText.textContent = `✓ Generated ${result.success} heatmaps successfully!`;
            }
            if (progressBar) {
                progressBar.style.width = '100%';
            }
            
            console.log('Trial heatmap generation completed:', result);
            
            // Hide progress after delay
            setTimeout(() => {
                if (progressDiv) {
                    progressDiv.style.display = 'none';
                }
            }, 3000);
            
        } catch (error) {
            console.error('Error generating trial heatmaps:', error);
            
            if (progressText) {
                progressText.textContent = '✗ Error generating heatmaps. Check console for details.';
            }
            
            // Hide progress after delay
            setTimeout(() => {
                if (progressDiv) {
                    progressDiv.style.display = 'none';
                }
            }, 5000);
        } finally {
            // Re-enable button
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download Trial Heatmaps (ZIP)';
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExperimentController;
} else if (typeof window !== 'undefined') {
    window.ExperimentController = ExperimentController;
}