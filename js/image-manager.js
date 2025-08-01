/**
 * ImageManager - Handles image loading, randomization, and management
 * Replicates the image handling logic from the original PsychoPy experiment
 */

class ImageManager {
    constructor() {
        this.config = null;
        this.imageTrials = [];
        this.neutralFillers = [];
        this.fillerPattern = [];
        this.preloadedImages = new Map();
        this.loadingProgress = 0;
        this.totalImages = 0;
        
        // Position mappings (convert from normalized to CSS positions)
        this.positions = {
            'top-left': { x: -0.3, y: 0.2 },
            'top-right': { x: 0.3, y: 0.2 },
            'bottom-left': { x: -0.3, y: -0.2 },
            'bottom-right': { x: 0.3, y: -0.2 }
        };
        
        this.categories = ['dysphoric', 'threat', 'positive', 'neutral'];
        this.fillerCategories = ['filler1', 'filler2', 'filler3', 'filler4'];
    }
    
    async loadConfig() {
        try {
            const response = await fetch('data/stimuli-config.json');
            this.config = await response.json();
            
            // Initialize arrays from config
            this.imageTrials = [...this.config.imageTrials];
            this.neutralFillers = [...this.config.neutralFillers];
            
            // Generate filler pattern (replicates Python's neufil_skip_list logic)
            this.generateFillerPattern();
            
            // Randomize image order within categories
            this.randomizeImageOrder();
            
            console.log('Image config loaded successfully');
            console.log(`Image trials: ${this.imageTrials.length}`);
            console.log(`Neutral fillers: ${this.neutralFillers.length}`);
            console.log('Filler pattern:', this.fillerPattern);
            
            return true;
        } catch (error) {
            console.error('Failed to load image config:', error);
            return false;
        }
    }
    
    generateFillerPattern() {
        // Create pattern for total trials (image trials + filler trials)
        console.log('=== GENERATE FILLER PATTERN DEBUG ===');
        console.log('Config:', this.config);
        console.log('Config.config:', this.config.config);
        
        const numImageTrials = this.config.config.numImageTrials; // 12
        const numFillers = this.config.config.numFillerItems; // 8
        const totalTrials = numImageTrials + numFillers; // 20
        
        console.log('numImageTrials:', numImageTrials);
        console.log('numFillers:', numFillers);
        console.log('totalTrials calculated:', totalTrials);
        
        // Create pattern array with all positions
        this.fillerPattern = new Array(totalTrials).fill(false);
        console.log('Pattern array created with length:', this.fillerPattern.length);
        
        // Mark filler positions (8 out of 20 will be true)
        for (let i = 0; i < numFillers; i++) {
            this.fillerPattern[i] = true;
        }
        console.log('Pattern after marking fillers:', this.fillerPattern);
        
        // Shuffle the pattern to randomize filler positions
        this.shuffleArray(this.fillerPattern);
        
        console.log('Final generated filler pattern:', this.fillerPattern);
        console.log('Final pattern length:', this.fillerPattern.length);
        console.log(`Total trials: ${totalTrials}, Fillers: ${numFillers}, Image trials: ${numImageTrials}`);
        console.log('=== END GENERATE FILLER PATTERN DEBUG ===');
    }
    
    randomizeImageOrder() {
        // Create separate arrays for each category, then shuffle
        const dys_arr = this.imageTrials.map(trial => trial.dysphoric);
        const thr_arr = this.imageTrials.map(trial => trial.threat);
        const pos_arr = this.imageTrials.map(trial => trial.positive);
        const neu_arr = this.imageTrials.map(trial => trial.neutral);
        
        // Shuffle each category independently (replicates Python random.shuffle)
        this.shuffleArray(dys_arr);
        this.shuffleArray(thr_arr);
        this.shuffleArray(pos_arr);
        this.shuffleArray(neu_arr);
        
        // Reconstruct trials with shuffled images
        this.imageTrials = this.imageTrials.map((trial, index) => ({
            ...trial,
            dysphoric: dys_arr[index],
            threat: thr_arr[index],
            positive: pos_arr[index],
            neutral: neu_arr[index]
        }));
        
        // Also shuffle filler arrays
        const filler1_arr = this.neutralFillers.map(filler => filler.filler1);
        const filler2_arr = this.neutralFillers.map(filler => filler.filler2);
        const filler3_arr = this.neutralFillers.map(filler => filler.filler3);
        const filler4_arr = this.neutralFillers.map(filler => filler.filler4);
        
        this.shuffleArray(filler1_arr);
        this.shuffleArray(filler2_arr);
        this.shuffleArray(filler3_arr);
        this.shuffleArray(filler4_arr);
        
        this.neutralFillers = this.neutralFillers.map((filler, index) => ({
            ...filler,
            filler1: filler1_arr[index],
            filler2: filler2_arr[index],
            filler3: filler3_arr[index],
            filler4: filler4_arr[index]
        }));
        
        console.log('Image order randomized');
    }
    
    shuffleArray(array) {
        // Fisher-Yates shuffle algorithm (equivalent to Python's random.shuffle)
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    async preloadAllImages(onProgress = null) {
        const allImagePaths = new Set();
        
        // Collect all image paths
        this.imageTrials.forEach(trial => {
            this.categories.forEach(category => {
                allImagePaths.add(trial[category]);
            });
        });
        
        this.neutralFillers.forEach(filler => {
            this.fillerCategories.forEach(category => {
                allImagePaths.add(filler[category]);
            });
        });
        
        this.totalImages = allImagePaths.size;
        this.loadingProgress = 0;
        
        console.log(`Starting to preload ${this.totalImages} images...`);
        
        const imagePromises = Array.from(allImagePaths).map(imagePath => 
            this.preloadSingleImage(imagePath, onProgress)
        );
        
        try {
            await Promise.all(imagePromises);
            console.log('All images preloaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to preload images:', error);
            return false;
        }
    }
    
    preloadSingleImage(imagePath, onProgress = null) {
        return new Promise((resolve, reject) => {
            if (this.preloadedImages.has(imagePath)) {
                resolve(this.preloadedImages.get(imagePath));
                return;
            }
            
            const img = new Image();
            
            img.onload = () => {
                this.preloadedImages.set(imagePath, img);
                this.loadingProgress++;
                
                if (onProgress) {
                    onProgress(this.loadingProgress, this.totalImages, imagePath);
                }
                
                resolve(img);
            };
            
            img.onerror = () => {
                console.error(`Failed to load image: ${imagePath}`);
                reject(new Error(`Failed to load image: ${imagePath}`));
            };
            
            // Add cache busting for development
            const cacheBuster = new Date().getTime();
            img.src = `images/${imagePath}?v=${cacheBuster}`;
        });
    }
    
    getTrialImages(trialIndex) {
        if (trialIndex < 0 || trialIndex >= this.imageTrials.length) {
            throw new Error(`Invalid trial index: ${trialIndex}`);
        }
        
        const trial = this.imageTrials[trialIndex];
        
        // Create randomized position mapping for this trial
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        this.shuffleArray(positions);
        
        return {
            trialIndex: trialIndex,
            images: {
                dysphoric: {
                    src: trial.dysphoric,
                    position: positions[0],
                    category: 'dysphoric'
                },
                threat: {
                    src: trial.threat,
                    position: positions[1],
                    category: 'threat'
                },
                positive: {
                    src: trial.positive,
                    position: positions[2],
                    category: 'positive'
                },
                neutral: {
                    src: trial.neutral,
                    position: positions[3],
                    category: 'neutral'
                }
            },
            positions: {
                dysphoric: positions[0],
                threat: positions[1],
                positive: positions[2],
                neutral: positions[3]
            }
        };
    }
    
    getFillerImages(fillerIndex) {
        if (fillerIndex < 0 || fillerIndex >= this.neutralFillers.length) {
            throw new Error(`Invalid filler index: ${fillerIndex}`);
        }
        
        const filler = this.neutralFillers[fillerIndex];
        
        // Create randomized position mapping for filler trial
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        this.shuffleArray(positions);
        
        return {
            fillerIndex: fillerIndex,
            images: {
                filler1: {
                    src: filler.filler1,
                    position: positions[0],
                    category: 'filler1'
                },
                filler2: {
                    src: filler.filler2,
                    position: positions[1],
                    category: 'filler2'
                },
                filler3: {
                    src: filler.filler3,
                    position: positions[2],
                    category: 'filler3'
                },
                filler4: {
                    src: filler.filler4,
                    position: positions[3],
                    category: 'filler4'
                }
            },
            positions: {
                filler1: positions[0],
                filler2: positions[1],
                filler3: positions[2],
                filler4: positions[3]
            }
        };
    }
    
    shouldShowFiller(trialIndex) {
        return this.fillerPattern[trialIndex] || false;
    }
    
    displayImages(imageData, container) {
        // Get image elements
        const topLeftImg = container.querySelector('#top-left-image');
        const topRightImg = container.querySelector('#top-right-image');
        const bottomLeftImg = container.querySelector('#bottom-left-image');
        const bottomRightImg = container.querySelector('#bottom-right-image');
        
        // Get label elements (for debugging)
        const topLeftLabel = container.querySelector('#top-left-label');
        const topRightLabel = container.querySelector('#top-right-label');
        const bottomLeftLabel = container.querySelector('#bottom-left-label');
        const bottomRightLabel = container.querySelector('#bottom-right-label');
        
        // Clear all images first
        [topLeftImg, topRightImg, bottomLeftImg, bottomRightImg].forEach(img => {
            img.style.display = 'none';
            img.src = '';
        });
        
        // Display images in their assigned positions
        Object.values(imageData.images).forEach(imageInfo => {
            let targetImg, targetLabel;
            
            switch (imageInfo.position) {
                case 'top-left':
                    targetImg = topLeftImg;
                    targetLabel = topLeftLabel;
                    break;
                case 'top-right':
                    targetImg = topRightImg;
                    targetLabel = topRightLabel;
                    break;
                case 'bottom-left':
                    targetImg = bottomLeftImg;
                    targetLabel = bottomLeftLabel;
                    break;
                case 'bottom-right':
                    targetImg = bottomRightImg;
                    targetLabel = bottomRightLabel;
                    break;
            }
            
            if (targetImg) {
                const preloadedImg = this.preloadedImages.get(imageInfo.src);
                if (preloadedImg) {
                    targetImg.src = preloadedImg.src;
                } else {
                    // Fallback if image wasn't preloaded
                    targetImg.src = `images/${imageInfo.src}`;
                }
                targetImg.style.display = 'block';
                targetImg.classList.add('active');
            }
            
            if (targetLabel) {
                targetLabel.textContent = imageInfo.category;
                if (this.config.debug) {
                    targetLabel.classList.add('show-labels');
                }
            }
        });
    }
    
    hideImages(container) {
        const images = container.querySelectorAll('.stimulus-image');
        const labels = container.querySelectorAll('.image-label');
        
        images.forEach(img => {
            img.style.display = 'none';
            img.classList.remove('active');
        });
        
        labels.forEach(label => {
            label.classList.remove('show-labels');
        });
    }
    
    getLoadingProgress() {
        return {
            loaded: this.loadingProgress,
            total: this.totalImages,
            percentage: this.totalImages > 0 ? (this.loadingProgress / this.totalImages) * 100 : 0
        };
    }
    
    isImagePreloaded(imagePath) {
        return this.preloadedImages.has(imagePath);
    }
    
    getPreloadedImage(imagePath) {
        return this.preloadedImages.get(imagePath);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageManager;
} else if (typeof window !== 'undefined') {
    window.ImageManager = ImageManager;
}