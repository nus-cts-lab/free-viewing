/**
 * AdminManager - Handles admin authentication, data storage, and dashboard
 */

class AdminManager {
    constructor() {
        // Admin credentials
        this.ADMIN_CREDENTIALS = {
            username: 'ctslab2025',
            password: 'freeviewing2025'
        };
        
        // Session key (for admin login state)
        this.SESSION_KEY = 'freeviewing_admin_session';
        
        // Data retention period (7 days in milliseconds)
        this.DATA_RETENTION_PERIOD = 7 * 24 * 60 * 60 * 1000;
        
        console.log('AdminManager initialized');
    }
    
    /**
     * Initialize admin system
     */
    init() {
        this.bindEvents();
        this.cleanupExpiredData();
        
        // Check if admin is already logged in
        if (this.isAdminLoggedIn()) {
            console.log('Admin session found');
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Role selection
        const participantBtn = document.getElementById('participant-role-btn');
        const adminBtn = document.getElementById('admin-role-btn');
        
        if (participantBtn) {
            participantBtn.addEventListener('click', () => this.selectParticipantRole());
        }
        
        if (adminBtn) {
            adminBtn.addEventListener('click', () => this.selectAdminRole());
        }
        
        // Admin login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }
        
        // Back to roles button
        const backBtn = document.getElementById('back-to-roles');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.backToRoleSelection());
        }
        
        // Admin logout
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.adminLogout());
        }
        
        // Data management buttons
        const cleanupBtn = document.getElementById('cleanup-expired-data');
        const clearAllBtn = document.getElementById('clear-all-data');
        
        if (cleanupBtn) {
            cleanupBtn.addEventListener('click', () => this.cleanupExpiredData(true));
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllData());
        }
    }
    
    /**
     * Handle participant role selection
     */
    selectParticipantRole() {
        console.log('Participant role selected');
        this.showScreen('welcome');
    }
    
    /**
     * Handle admin role selection
     */
    selectAdminRole() {
        console.log('Admin role selected');
        this.showScreen('admin-login');
    }
    
    /**
     * Handle admin login form submission
     */
    handleAdminLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('admin-login-error');
        
        if (this.validateAdminCredentials(username, password)) {
            // Login successful
            this.createAdminSession();
            this.showAdminDashboard();
            
            // Clear form
            document.getElementById('admin-login-form').reset();
            errorDiv.style.display = 'none';
        } else {
            // Login failed
            errorDiv.style.display = 'block';
            
            // Clear password field
            document.getElementById('admin-password').value = '';
        }
    }
    
    /**
     * Validate admin credentials
     */
    validateAdminCredentials(username, password) {
        return username === this.ADMIN_CREDENTIALS.username && 
               password === this.ADMIN_CREDENTIALS.password;
    }
    
    /**
     * Create admin session
     */
    createAdminSession() {
        const session = {
            loggedIn: true,
            loginTime: new Date().toISOString(),
            username: this.ADMIN_CREDENTIALS.username
        };
        
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        console.log('Admin session created');
    }
    
    /**
     * Check if admin is logged in
     */
    isAdminLoggedIn() {
        try {
            const session = sessionStorage.getItem(this.SESSION_KEY);
            return session ? JSON.parse(session).loggedIn : false;
        } catch (error) {
            console.error('Error checking admin session:', error);
            return false;
        }
    }
    
    /**
     * Admin logout
     */
    adminLogout() {
        sessionStorage.removeItem(this.SESSION_KEY);
        console.log('Admin logged out');
        this.backToRoleSelection();
    }
    
    /**
     * Back to role selection
     */
    backToRoleSelection() {
        this.showScreen('role-selection');
    }
    
    /**
     * Show admin dashboard
     */
    showAdminDashboard() {
        this.showScreen('admin-dashboard');
        this.loadDashboardData();
    }
    
    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        await this.updateStorageOverview();
        await this.updateParticipantDataList();
    }
    
    /**
     * Update storage overview
     */
    async updateStorageOverview() {
        const data = await this.getAllStoredData();
        const totalParticipants = data.length;
        const totalSizeBytes = this.calculateTotalDataSize(data);
        const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
        const oldestData = this.getOldestDataDate(data);
        
        const statsDiv = document.getElementById('storage-stats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                    <div>
                        <strong>Total Participants:</strong><br>
                        <span style="font-size: 1.5em; color: #4CAF50;">${totalParticipants}</span>
                    </div>
                    <div>
                        <strong>Storage Used:</strong><br>
                        <span style="font-size: 1.5em; color: #2196F3;">${totalSizeMB} MB</span>
                    </div>
                    <div>
                        <strong>Oldest Data:</strong><br>
                        <span style="font-size: 1.2em; color: #FF9800;">${oldestData}</span>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Update participant data list
     */
    async updateParticipantDataList() {
        const data = await this.getAllStoredData();
        const container = document.getElementById('data-list-container');
        
        if (!container) return;
        
        if (data.length === 0) {
            container.innerHTML = '<p style="color: #aaa;">No participant data found.</p>';
            return;
        }
        
        let html = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background: rgba(255,255,255,0.1);">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #666;">Participant ID</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #666;">Email</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #666;">Completed</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #666;">Expires In</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #666;">Trials</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #666;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.forEach(participant => {
            const daysUntilExpiry = this.getDaysUntilExpiry(participant.completedAt);
            const expiryText = daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired';
            const expiryColor = daysUntilExpiry > 3 ? '#4CAF50' : daysUntilExpiry > 0 ? '#FF9800' : '#d32f2f';
            
            html += `
                <tr style="border-bottom: 1px solid #444;">
                    <td style="padding: 12px;">${participant.participantId}</td>
                    <td style="padding: 12px;">${participant.participantEmail || 'Not provided'}</td>
                    <td style="padding: 12px;">${this.formatDate(participant.completedAt)}</td>
                    <td style="padding: 12px; color: ${expiryColor}; font-weight: bold;">${expiryText}</td>
                    <td style="padding: 12px;">${participant.totalTrials}</td>
                    <td style="padding: 8px;">
                        <div style="display: flex; gap: 4px; justify-content: flex-start; flex-wrap: nowrap;">
                            <button onclick="adminManager.downloadParticipantCSV('${participant.participantId}')" 
                                    class="admin-action-btn csv-btn" 
                                    title="Download CSV files"
                                    style="background: rgba(76,175,80,0.15); border: 1px solid rgba(76,175,80,0.3); color: #fff; padding: 6px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: all 0.2s ease;">
                                📊 CSV
                            </button>
                            <button onclick="adminManager.downloadParticipantHeatmaps('${participant.participantId}')" 
                                    class="admin-action-btn heatmap-btn" 
                                    title="Download heatmap files"
                                    style="background: rgba(255,152,0,0.15); border: 1px solid rgba(255,152,0,0.3); color: #fff; padding: 6px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: all 0.2s ease;">
                                🔥 Maps
                            </button>
                            <button onclick="adminManager.deleteParticipantData('${participant.participantId}')" 
                                    class="admin-action-btn delete-btn" 
                                    title="Delete all participant data"
                                    style="background: rgba(211,47,47,0.2); border: 1px solid rgba(211,47,47,0.4); color: #fff; padding: 6px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: all 0.2s ease;">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Generate and store CSV and ZIP files in Supabase Storage
     */
    async generateAndStoreFiles(participantId, participantEmail, trialData, mouseData) {
        console.log('=== GENERATING AND STORING FILES ===');
        
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return { success: false, error: 'Database connection error' };
        }
        
        try {
            // Create temporary DataManager to generate files
            const tempDataManager = new DataManager();
            tempDataManager.trialData = trialData;
            tempDataManager.mouseTrackingData = mouseData;
            tempDataManager.participantData = {
                participant_id: participantId,
                participant_email: participantEmail
            };
            
            // Generate CSV files
            const trialCSV = tempDataManager.generateTrialCSVContent();
            const mouseCSV = tempDataManager.generateMouseCSVContent();
            
            // Generate heatmap ZIP
            const zipBlob = await tempDataManager.generateHeatmapZipBlob();
            
            // Create folder structure: participantId_date/
            const dateStr = new Date().toISOString().split('T')[0];
            const folderPrefix = `${participantId}_${dateStr}`;
            
            // Upload files to Supabase Storage
            const trialPath = `${folderPrefix}/trial_data.csv`;
            const mousePath = `${folderPrefix}/mouse_data.csv`;
            const zipPath = `${folderPrefix}/heatmaps.zip`;
            
            // Upload trial CSV
            const { error: trialError } = await window.supabaseClient.storage
                .from('experiment-files')
                .upload(trialPath, trialCSV, { contentType: 'text/csv' });
                
            if (trialError) {
                console.error('Trial CSV upload error:', trialError);
                return { success: false, error: 'Failed to upload trial data' };
            }
            
            // Upload mouse CSV
            const { error: mouseError } = await window.supabaseClient.storage
                .from('experiment-files')
                .upload(mousePath, mouseCSV, { contentType: 'text/csv' });
                
            if (mouseError) {
                console.error('Mouse CSV upload error:', mouseError);
                return { success: false, error: 'Failed to upload mouse data' };
            }
            
            // Upload heatmap ZIP
            const { error: zipError } = await window.supabaseClient.storage
                .from('experiment-files')
                .upload(zipPath, zipBlob, { contentType: 'application/zip' });
                
            if (zipError) {
                console.error('ZIP upload error:', zipError);
                return { success: false, error: 'Failed to upload heatmaps' };
            }
            
            console.log('✓ All files uploaded successfully to Supabase Storage');
            
            return {
                success: true,
                paths: {
                    trialCSV: trialPath,
                    mouseCSV: mousePath,
                    heatmapZip: zipPath
                }
            };
            
        } catch (error) {
            console.error('Failed to generate and store files:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Store experiment data persistently using Supabase
     */
    async storeExperimentData(participantId, participantEmail, trialData, mouseData) {
        console.log('=== STORING DATA TO SUPABASE ===');
        console.log('Participant ID:', participantId);
        console.log('Trial data length:', trialData.length);
        console.log('Mouse data length:', mouseData.length);
        
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return false;
        }
        
        try {
            // 1. Generate and store files first
            const fileResult = await this.generateAndStoreFiles(participantId, participantEmail, trialData, mouseData);
            
            // 2. Store data in database with file paths
            const { data, error } = await window.supabaseClient
                .from('experiments')
                .insert({
                    participant_id: participantId,
                    participant_email: participantEmail,
                    completed_at: new Date().toISOString(),
                    trial_data: trialData,
                    mouse_data: mouseData,
                    total_trials: trialData.length,
                    total_mouse_points: mouseData.length,
                    data_size: JSON.stringify(trialData).length + JSON.stringify(mouseData).length,
                    files_stored: fileResult.success,
                    csv_trial_path: fileResult.success ? fileResult.paths.trialCSV : null,
                    csv_mouse_path: fileResult.success ? fileResult.paths.mouseCSV : null,
                    heatmap_zip_path: fileResult.success ? fileResult.paths.heatmapZip : null
                });
                
            if (error) {
                console.error('Supabase insert error:', error);
                return false;
            }
            
            console.log('✓ Data and files stored successfully in Supabase:', data);
            console.log('✓ File storage result:', fileResult);
            console.log('=== END SUPABASE STORAGE ===');
            return true;
            
        } catch (error) {
            console.error('Failed to store data in Supabase:', error);
            return false;
        }
    }
    
    /**
     * Get all stored experiment data from Supabase
     */
    async getAllStoredData() {
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return [];
        }
        
        try {
            const { data, error } = await window.supabaseClient
                .from('experiments')
                .select('*')
                .order('completed_at', { ascending: false });
                
            if (error) {
                console.error('Supabase select error:', error);
                return [];
            }
            
            // Convert Supabase format to match our expected format
            return data.map(row => ({
                participantId: row.participant_id,
                participantEmail: row.participant_email,
                completedAt: row.completed_at,
                trialData: row.trial_data,
                mouseData: row.mouse_data,
                totalTrials: row.total_trials,
                totalMousePoints: row.total_mouse_points,
                dataSize: row.data_size,
                filesStored: row.files_stored || false,
                csvTrialPath: row.csv_trial_path,
                csvMousePath: row.csv_mouse_path,
                heatmapZipPath: row.heatmap_zip_path
            }));
            
        } catch (error) {
            console.error('Failed to fetch data from Supabase:', error);
            return [];
        }
    }
    
    /**
     * Get specific participant data from Supabase
     */
    async getParticipantData(participantId) {
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            return null;
        }
        
        try {
            const { data, error } = await window.supabaseClient
                .from('experiments')
                .select('*')
                .eq('participant_id', participantId)
                .single();
                
            if (error) {
                console.error('Supabase select error:', error);
                return null;
            }
            
            // Convert Supabase format to match our expected format
            return {
                participantId: data.participant_id,
                participantEmail: data.participant_email,
                completedAt: data.completed_at,
                trialData: data.trial_data,
                mouseData: data.mouse_data,
                totalTrials: data.total_trials,
                totalMousePoints: data.total_mouse_points,
                dataSize: data.data_size,
                filesStored: data.files_stored || false,
                csvTrialPath: data.csv_trial_path,
                csvMousePath: data.csv_mouse_path,
                heatmapZipPath: data.heatmap_zip_path
            };
            
        } catch (error) {
            console.error('Failed to fetch participant data from Supabase:', error);
            return null;
        }
    }
    
    /**
     * Download participant CSV data from Supabase Storage
     */
    async downloadParticipantCSV(participantId) {
        const participant = await this.getParticipantData(participantId);
        if (!participant) {
            alert('Participant data not found');
            return;
        }
        
        // Check if files are stored
        if (!participant.filesStored || !participant.csvTrialPath || !participant.csvMousePath) {
            alert('Files not found in storage. Data may have been processed before file storage was enabled.');
            return;
        }
        
        try {
            // Download trial CSV
            const { data: trialBlob, error: trialError } = await window.supabaseClient.storage
                .from('experiment-files')
                .download(participant.csvTrialPath);
                
            if (trialError) {
                console.error('Trial CSV download error:', trialError);
                alert('Failed to download trial data.');
                return;
            }
            
            // Download mouse CSV
            const { data: mouseBlob, error: mouseError } = await window.supabaseClient.storage
                .from('experiment-files')
                .download(participant.csvMousePath);
                
            if (mouseError) {
                console.error('Mouse CSV download error:', mouseError);
                alert('Failed to download mouse data.');
                return;
            }
            
            // Trigger downloads
            this.downloadBlob(trialBlob, `trial_data_${participantId}.csv`);
            this.downloadBlob(mouseBlob, `mouse_data_${participantId}.csv`);
            
            console.log('✓ CSV files downloaded instantly for:', participantId);
            
        } catch (error) {
            console.error('Failed to download CSV files:', error);
            alert('Failed to download CSV files. Please try again.');
        }
    }
    
    /**
     * Download participant heatmaps from Supabase Storage
     */
    async downloadParticipantHeatmaps(participantId) {
        const participant = await this.getParticipantData(participantId);
        if (!participant) {
            alert('Participant data not found');
            return;
        }
        
        // Check if heatmap ZIP is stored
        if (!participant.filesStored || !participant.heatmapZipPath) {
            alert('Heatmap files not found in storage. Data may have been processed before file storage was enabled.');
            return;
        }
        
        try {
            // Download heatmap ZIP
            const { data: zipBlob, error: zipError } = await window.supabaseClient.storage
                .from('experiment-files')
                .download(participant.heatmapZipPath);
                
            if (zipError) {
                console.error('Heatmap ZIP download error:', zipError);
                alert('Failed to download heatmap files.');
                return;
            }
            
            // Trigger download
            this.downloadBlob(zipBlob, `heatmaps_${participantId}.zip`);
            
            console.log('✓ Heatmap ZIP downloaded instantly for:', participantId);
            
        } catch (error) {
            console.error('Failed to download heatmap ZIP:', error);
            alert('Failed to download heatmap files. Please try again.');
        }
    }
    
    /**
     * Delete specific participant data from Supabase
     */
    async deleteParticipantData(participantId) {
        if (!confirm(`Are you sure you want to delete data for participant ${participantId}? This action cannot be undone.`)) {
            return;
        }
        
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            alert('Database connection error. Please try again.');
            return;
        }
        
        try {
            // First, get the participant data to retrieve file paths
            const participant = await this.getParticipantData(participantId);
            
            if (!participant) {
                alert('Participant data not found.');
                return;
            }
            
            // Clean up files from storage if they exist
            if (participant.filesStored) {
                try {
                    // Delete trial CSV file
                    if (participant.csvTrialPath) {
                        const { error: trialDeleteError } = await window.supabaseClient.storage
                            .from('experiment-files')
                            .remove([participant.csvTrialPath]);
                        
                        if (trialDeleteError) {
                            console.warn(`Failed to delete trial CSV for ${participantId}:`, trialDeleteError);
                        } else {
                            console.log(`✓ Deleted trial CSV: ${participant.csvTrialPath}`);
                        }
                    }
                    
                    // Delete mouse CSV file
                    if (participant.csvMousePath) {
                        const { error: mouseDeleteError } = await window.supabaseClient.storage
                            .from('experiment-files')
                            .remove([participant.csvMousePath]);
                        
                        if (mouseDeleteError) {
                            console.warn(`Failed to delete mouse CSV for ${participantId}:`, mouseDeleteError);
                        } else {
                            console.log(`✓ Deleted mouse CSV: ${participant.csvMousePath}`);
                        }
                    }
                    
                    // Delete heatmap ZIP file
                    if (participant.heatmapZipPath) {
                        const { error: heatmapDeleteError } = await window.supabaseClient.storage
                            .from('experiment-files')
                            .remove([participant.heatmapZipPath]);
                        
                        if (heatmapDeleteError) {
                            console.warn(`Failed to delete heatmap ZIP for ${participantId}:`, heatmapDeleteError);
                        } else {
                            console.log(`✓ Deleted heatmap ZIP: ${participant.heatmapZipPath}`);
                        }
                    }
                    
                    console.log(`✓ Cleaned up storage files for participant: ${participantId}`);
                    
                } catch (fileError) {
                    console.error(`Error cleaning files for ${participantId}:`, fileError);
                    // Continue with database deletion even if file cleanup fails
                }
            }
            
            // Now delete the database record
            const { error } = await window.supabaseClient
                .from('experiments')
                .delete()
                .eq('participant_id', participantId);
                
            if (error) {
                console.error('Supabase delete error:', error);
                alert('Failed to delete participant data. Please try again.');
                return;
            }
            
            console.log('✓ Participant data and files deleted:', participantId);
            alert(`Data and files for participant ${participantId} have been deleted successfully.`);
            
            // Refresh the dashboard to reflect changes
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('Failed to delete participant data:', error);
            alert('Failed to delete participant data. Please try again.');
        }
    }
    
    /**
     * Cleanup expired data from Supabase (older than 7 days)
     */
    async cleanupExpiredData(showAlert = false) {
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            if (showAlert) {
                alert('Database connection error. Please try again.');
            }
            return;
        }
        
        try {
            // Calculate the cutoff date (7 days ago)
            const cutoffDate = new Date();
            cutoffDate.setTime(cutoffDate.getTime() - this.DATA_RETENTION_PERIOD);
            const cutoffISO = cutoffDate.toISOString();
            
            // First, get expired records with file paths for cleanup
            const { data: expiredData, error: countError } = await window.supabaseClient
                .from('experiments')
                .select('participant_id, csv_trial_path, csv_mouse_path, heatmap_zip_path, files_stored')
                .lt('completed_at', cutoffISO);
                
            if (countError) {
                console.error('Supabase count error:', countError);
                if (showAlert) {
                    alert('Failed to check expired data. Please try again.');
                }
                return;
            }
            
            const expiredCount = expiredData ? expiredData.length : 0;
            
            if (expiredCount === 0) {
                console.log('No expired data found');
                if (showAlert) {
                    alert('No expired data found to clean up.');
                }
                return;
            }
            
            // Clean up files from Supabase Storage before deleting database records
            let filesCleanedCount = 0;
            for (const record of expiredData) {
                if (record.files_stored) {
                    try {
                        // Delete trial CSV file
                        if (record.csv_trial_path) {
                            const { error: trialDeleteError } = await window.supabaseClient.storage
                                .from('experiment-files')
                                .remove([record.csv_trial_path]);
                            
                            if (trialDeleteError) {
                                console.warn(`Failed to delete trial CSV for ${record.participant_id}:`, trialDeleteError);
                            } else {
                                console.log(`✓ Deleted trial CSV: ${record.csv_trial_path}`);
                            }
                        }
                        
                        // Delete mouse CSV file
                        if (record.csv_mouse_path) {
                            const { error: mouseDeleteError } = await window.supabaseClient.storage
                                .from('experiment-files')
                                .remove([record.csv_mouse_path]);
                            
                            if (mouseDeleteError) {
                                console.warn(`Failed to delete mouse CSV for ${record.participant_id}:`, mouseDeleteError);
                            } else {
                                console.log(`✓ Deleted mouse CSV: ${record.csv_mouse_path}`);
                            }
                        }
                        
                        // Delete heatmap ZIP file
                        if (record.heatmap_zip_path) {
                            const { error: heatmapDeleteError } = await window.supabaseClient.storage
                                .from('experiment-files')
                                .remove([record.heatmap_zip_path]);
                            
                            if (heatmapDeleteError) {
                                console.warn(`Failed to delete heatmap ZIP for ${record.participant_id}:`, heatmapDeleteError);
                            } else {
                                console.log(`✓ Deleted heatmap ZIP: ${record.heatmap_zip_path}`);
                            }
                        }
                        
                        filesCleanedCount++;
                    } catch (fileError) {
                        console.error(`Error cleaning files for ${record.participant_id}:`, fileError);
                    }
                }
            }
            
            console.log(`✓ Cleaned up files for ${filesCleanedCount} of ${expiredCount} expired records`);
            
            // Now delete expired database records
            const { error: deleteError } = await window.supabaseClient
                .from('experiments')
                .delete()
                .lt('completed_at', cutoffISO);
                
            if (deleteError) {
                console.error('Supabase cleanup error:', deleteError);
                if (showAlert) {
                    alert('Failed to cleanup expired data. Please try again.');
                }
                return;
            }
            
            console.log(`✓ Cleaned up ${expiredCount} expired records and ${filesCleanedCount} file sets from storage`);
            
            if (showAlert) {
                alert(`Successfully cleaned up ${expiredCount} expired participant record${expiredCount !== 1 ? 's' : ''} and ${filesCleanedCount} file set${filesCleanedCount !== 1 ? 's' : ''} from storage.`);
            }
            
            // Refresh the dashboard to reflect changes
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('Failed to cleanup expired data from Supabase:', error);
            if (showAlert) {
                alert('Failed to cleanup expired data. Please try again.');
            }
        }
    }
    
    /**
     * Clear all data from Supabase
     */
    async clearAllData() {
        if (!confirm('Are you sure you want to delete ALL participant data? This action cannot be undone.')) {
            return;
        }
        
        if (!confirm('This will permanently delete all stored experiment data. Are you absolutely sure?')) {
            return;
        }
        
        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            alert('Database connection error. Please try again.');
            return;
        }
        
        try {
            // First, get all records with file paths for cleanup
            const { data: allData, error: countError } = await window.supabaseClient
                .from('experiments')
                .select('participant_id, csv_trial_path, csv_mouse_path, heatmap_zip_path, files_stored');
                
            if (countError) {
                console.error('Supabase count error:', countError);
                alert('Failed to check data count. Please try again.');
                return;
            }
            
            const totalCount = allData ? allData.length : 0;
            
            if (totalCount === 0) {
                console.log('No data found to clear');
                alert('No data found to clear.');
                return;
            }
            
            // Clean up all files from storage before clearing database
            console.log('Cleaning up all storage files...');
            let filesCleanedCount = 0;
            
            for (const record of allData) {
                if (record.files_stored) {
                    try {
                        const filesToDelete = [];
                        
                        if (record.csv_trial_path) filesToDelete.push(record.csv_trial_path);
                        if (record.csv_mouse_path) filesToDelete.push(record.csv_mouse_path);
                        if (record.heatmap_zip_path) filesToDelete.push(record.heatmap_zip_path);
                        
                        if (filesToDelete.length > 0) {
                            const { error: fileDeleteError } = await window.supabaseClient.storage
                                .from('experiment-files')
                                .remove(filesToDelete);
                            
                            if (fileDeleteError) {
                                console.warn(`Failed to delete files for ${record.participant_id}:`, fileDeleteError);
                            } else {
                                console.log(`✓ Deleted ${filesToDelete.length} files for ${record.participant_id}`);
                                filesCleanedCount++;
                            }
                        }
                    } catch (fileError) {
                        console.error(`Error cleaning files for ${record.participant_id}:`, fileError);
                    }
                }
            }
            
            console.log(`✓ Cleaned up files for ${filesCleanedCount} of ${totalCount} records`);
            
            // Now delete all database records
            const { error: deleteError } = await window.supabaseClient
                .from('experiments')
                .delete()
                .neq('participant_id', 'this-will-never-match-anything'); // Delete all records
                
            if (deleteError) {
                console.error('Supabase clear all error:', deleteError);
                alert('Failed to clear all data. Please try again.');
                return;
            }
            
            console.log(`✓ Cleared all ${totalCount} records and ${filesCleanedCount} file sets from storage`);
            alert(`Successfully cleared all ${totalCount} participant record${totalCount !== 1 ? 's' : ''} and ${filesCleanedCount} file set${filesCleanedCount !== 1 ? 's' : ''} from storage.`);
            
            // Refresh the dashboard to reflect changes
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('Failed to clear all data from Supabase:', error);
            alert('Failed to clear all data. Please try again.');
        }
    }
    
    /**
     * Helper function to download a blob as a file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Helper functions
     */
    
    calculateDataSize(trialData, mouseData) {
        try {
            const trialSize = JSON.stringify(trialData).length;
            const mouseSize = JSON.stringify(mouseData).length;
            return trialSize + mouseSize;
        } catch (error) {
            return 0;
        }
    }
    
    calculateTotalDataSize(allData) {
        return allData.reduce((total, participant) => total + (participant.dataSize || 0), 0);
    }
    
    getDaysUntilExpiry(completedAt) {
        const currentTime = new Date().getTime();
        const completedTime = new Date(completedAt).getTime();
        const expiryTime = completedTime + this.DATA_RETENTION_PERIOD;
        const timeLeft = expiryTime - currentTime;
        
        return Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));
    }
    
    getOldestDataDate(allData) {
        if (allData.length === 0) return 'None';
        
        const oldest = allData.reduce((oldest, participant) => {
            const participantTime = new Date(participant.completedAt).getTime();
            const oldestTime = new Date(oldest.completedAt).getTime();
            return participantTime < oldestTime ? participant : oldest;
        });
        
        const daysAgo = Math.floor((new Date().getTime() - new Date(oldest.completedAt).getTime()) / (24 * 60 * 60 * 1000));
        return daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    }
    
    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (24 * 60 * 60 * 1000));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString();
    }
    
    /**
     * Show screen utility
     */
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log(`Showing screen: ${screenName}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminManager;
} else if (typeof window !== 'undefined') {
    window.AdminManager = AdminManager;
}