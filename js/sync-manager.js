/**
 * Sync Manager
 * Handles automatic saving/loading to a shared network location using File System Access API
 */

class SyncManager {
    constructor(csvAnalyzer) {
        this.csvAnalyzer = csvAnalyzer;
        this.directoryHandle = null;
        this.fileHandle = null;
        this.autoSaveInterval = null;
        this.syncIntervalMinutes = 5;
        this.lastSyncTime = null;
        this.isLocked = false;
        this.currentUser = this.getUserIdentifier();
        
        // Check if File System Access API is supported
        this.isSupported = 'showDirectoryPicker' in window;
        
        // Load saved directory handle from localStorage
        this.loadSavedDirectory();
    }

    /**
     * Get a unique identifier for this user/browser
     */
    getUserIdentifier() {
        let userId = localStorage.getItem('sync_user_id');
        if (!userId) {
            userId = `User_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('sync_user_id', userId);
        }
        return userId;
    }

    /**
     * Check if File System Access API is supported
     */
    checkSupport() {
        if (!this.isSupported) {
            console.warn('⚠️ File System Access API not supported in this browser');
            console.warn('💡 Use Chrome or Edge for auto-sync functionality');
            return false;
        }
        return true;
    }

    /**
     * Let user select a directory for sync
     */
    async selectSyncDirectory() {
        if (!this.checkSupport()) {
            alert('⚠️ Auto-sync wordt alleen ondersteund in Chrome en Edge browsers.\n\nGebruik Export/Import voor andere browsers.');
            return false;
        }

        try {
            // Request directory access
            this.directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            // Save directory handle reference
            await this.saveDirectoryReference();

            console.log('✅ Sync directory selected:', this.directoryHandle.name);
            
            // Start auto-sync
            this.startAutoSync();
            
            // Show success message
            this.showSyncStatus('success', `Sync actief naar: ${this.directoryHandle.name}`);
            
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('ℹ️ Directory selection cancelled');
            } else {
                console.error('❌ Error selecting directory:', error);
                this.showSyncStatus('error', 'Fout bij selecteren map');
            }
            return false;
        }
    }

    /**
     * Save directory reference to localStorage
     */
    async saveDirectoryReference() {
        // Note: We can't actually save the handle, but we can save that it was set
        localStorage.setItem('sync_directory_selected', 'true');
        localStorage.setItem('sync_directory_name', this.directoryHandle.name);
    }

    /**
     * Load saved directory (requires re-permission on browser restart)
     */
    async loadSavedDirectory() {
        const wasSelected = localStorage.getItem('sync_directory_selected');
        if (wasSelected === 'true') {
            console.log('ℹ️ Sync was previously configured. Please re-select directory.');
        }
    }

    /**
     * Start automatic sync
     */
    startAutoSync() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        // Initial sync
        this.syncToDirectory();

        // Set up periodic sync
        this.autoSaveInterval = setInterval(() => {
            this.syncToDirectory();
        }, this.syncIntervalMinutes * 60 * 1000);

        console.log(`🔄 Auto-sync started (every ${this.syncIntervalMinutes} minutes)`);
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('⏸️ Auto-sync stopped');
        }
    }

    /**
     * Sync data to directory
     */
    async syncToDirectory() {
        if (!this.directoryHandle) {
            console.warn('⚠️ No sync directory selected');
            return false;
        }

        try {
            // Check if we still have permission
            const permission = await this.directoryHandle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                const newPermission = await this.directoryHandle.requestPermission({ mode: 'readwrite' });
                if (newPermission !== 'granted') {
                    this.showSyncStatus('error', 'Geen schrijftoegang tot map');
                    return false;
                }
            }

            // Check for conflicts (someone else working)
            const hasConflict = await this.checkForConflicts();
            if (hasConflict) {
                console.warn('⚠️ Conflict detected - another user is working');
                return false;
            }

            // Get data to save
            const saveData = this.prepareSaveData();
            
            // Create/update the data file
            const fileName = 'csv-analyzer-data.json';
            this.fileHandle = await this.directoryHandle.getFileHandle(fileName, { create: true });
            
            // Write data
            const writable = await this.fileHandle.createWritable();
            await writable.write(JSON.stringify(saveData, null, 2));
            await writable.close();

            // Update lock file
            await this.updateLockFile();

            this.lastSyncTime = new Date();
            console.log('✅ Data synced to directory:', new Date().toLocaleTimeString());
            this.showSyncStatus('success', `Laatste sync: ${this.lastSyncTime.toLocaleTimeString()}`);

            return true;
        } catch (error) {
            console.error('❌ Error syncing to directory:', error);
            this.showSyncStatus('error', 'Sync fout - ' + error.message);
            return false;
        }
    }

    /**
     * Load data from directory
     */
    async loadFromDirectory() {
        if (!this.directoryHandle) {
            console.warn('⚠️ No sync directory selected');
            return null;
        }

        try {
            // Check permission
            const permission = await this.directoryHandle.queryPermission({ mode: 'read' });
            if (permission !== 'granted') {
                await this.directoryHandle.requestPermission({ mode: 'read' });
            }

            // Read the data file
            const fileName = 'csv-analyzer-data.json';
            const fileHandle = await this.directoryHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            const content = await file.text();
            const data = JSON.parse(content);

            console.log('✅ Data loaded from directory');
            this.showSyncStatus('success', 'Data geladen van gedeelde locatie');

            return data;
        } catch (error) {
            if (error.name === 'NotFoundError') {
                console.log('ℹ️ No existing data file found in directory');
                return null;
            }
            console.error('❌ Error loading from directory:', error);
            this.showSyncStatus('error', 'Fout bij laden data');
            return null;
        }
    }

    /**
     * Check for conflicts with other users
     */
    async checkForConflicts() {
        try {
            const lockFileName = '.csv-analyzer-lock.json';
            const lockHandle = await this.directoryHandle.getFileHandle(lockFileName);
            const lockFile = await lockHandle.getFile();
            const lockContent = await lockFile.text();
            const lockData = JSON.parse(lockContent);

            // Check if lock is recent (within last 10 minutes)
            const lockTime = new Date(lockData.timestamp);
            const now = new Date();
            const timeDiff = (now - lockTime) / 1000 / 60; // minutes

            if (timeDiff < 10 && lockData.userId !== this.currentUser) {
                this.showSyncStatus('warning', `Let op: ${lockData.userName || 'Andere gebruiker'} is ook aan het werk`);
                return true;
            }

            return false;
        } catch (error) {
            // No lock file exists - no conflict
            return false;
        }
    }

    /**
     * Update lock file to indicate we're working
     */
    async updateLockFile() {
        try {
            const lockFileName = '.csv-analyzer-lock.json';
            const lockHandle = await this.directoryHandle.getFileHandle(lockFileName, { create: true });
            
            const lockData = {
                userId: this.currentUser,
                userName: this.getUserName(),
                timestamp: new Date().toISOString(),
                action: 'working'
            };

            const writable = await lockHandle.createWritable();
            await writable.write(JSON.stringify(lockData, null, 2));
            await writable.close();
        } catch (error) {
            console.error('⚠️ Could not update lock file:', error);
        }
    }

    /**
     * Get a user-friendly name for this user
     */
    getUserName() {
        // Try to get computer/user name
        const userName = localStorage.getItem('sync_user_name');
        if (userName) return userName;
        
        // Prompt user for name on first use
        const name = prompt('Voer je naam in (voor samenwerking):', 'Gebruiker') || 'Gebruiker';
        localStorage.setItem('sync_user_name', name);
        return name;
    }

    /**
     * Prepare data for saving
     */
    prepareSaveData() {
        if (!this.csvAnalyzer.baseData) {
            return null;
        }

        // Collect tracking data from UI
        this.csvAnalyzer.collectTrackingDataFromUI();

        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            userId: this.currentUser,
            userName: this.getUserName(),
            headers: this.csvAnalyzer.baseData.headers,
            data: this.csvAnalyzer.baseData.data,
            selectedColumns: this.csvAnalyzer.getSelectedColumns(),
            trackingColumns: this.csvAnalyzer.getSelectedTrackingColumns()
        };
    }

    /**
     * Show sync status to user
     */
    showSyncStatus(type, message) {
        const statusElement = document.getElementById('syncStatus');
        if (!statusElement) return;

        statusElement.textContent = message;
        statusElement.className = `sync-status sync-${type}`;
        
        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'sync-status';
            }, 5000);
        }
    }

    /**
     * Disconnect sync
     */
    disconnectSync() {
        this.stopAutoSync();
        this.directoryHandle = null;
        this.fileHandle = null;
        localStorage.removeItem('sync_directory_selected');
        localStorage.removeItem('sync_directory_name');
        console.log('🔌 Sync disconnected');
        this.showSyncStatus('info', 'Sync uitgeschakeld');
    }

    /**
     * Get sync status info
     */
    getSyncStatus() {
        return {
            isActive: this.autoSaveInterval !== null,
            directoryName: localStorage.getItem('sync_directory_name'),
            lastSyncTime: this.lastSyncTime,
            syncInterval: this.syncIntervalMinutes,
            currentUser: this.getUserName()
        };
    }
}
