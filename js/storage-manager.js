/**
 * Storage Manager Module
 * Handles localStorage operations for data persistence
 */

class StorageManager {
    constructor() {
        this.storagePrefix = 'csvAnalyzer_';
    }

    /**
     * Save data with tracking to localStorage
     */
    saveDataWithTracking(data, selectedColumns, trackingColumns) {
        const saveData = {
            timestamp: new Date().toISOString(),
            headers: data.headers,
            data: data.data,
            selectedColumns: selectedColumns,
            trackingColumns: trackingColumns
        };

        const jsonData = JSON.stringify(saveData);
        return jsonData;
    }

    /**
     * Load data with tracking from file
     */
    async loadDataWithTracking(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const savedData = JSON.parse(e.target.result);
                    
                    if (!savedData.headers || !savedData.data || !Array.isArray(savedData.data)) {
                        reject(new Error('Ongeldig bestandsformaat'));
                        return;
                    }
                    
                    resolve(savedData);
                } catch (error) {
                    reject(new Error('Fout bij het laden van bestand: ' + error.message));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Fout bij het lezen van bestand'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Save custom column preset
     */
    saveCustomPreset(selectedColumns) {
        localStorage.setItem(this.storagePrefix + 'customPreset', JSON.stringify(selectedColumns));
    }

    /**
     * Load custom column preset
     */
    loadCustomPreset() {
        const stored = localStorage.getItem(this.storagePrefix + 'customPreset');
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Clear custom preset
     */
    clearCustomPreset() {
        localStorage.removeItem(this.storagePrefix + 'customPreset');
    }

    /**
     * Check if custom preset exists
     */
    hasCustomPreset() {
        return localStorage.getItem(this.storagePrefix + 'customPreset') !== null;
    }

    /**
     * Clear all stored data
     */
    clearAllData() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.storagePrefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Get storage usage info
     */
    getStorageInfo() {
        let totalSize = 0;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.storagePrefix)) {
                totalSize += localStorage.getItem(key).length;
            }
        });

        return {
            totalKeys: keys.filter(k => k.startsWith(this.storagePrefix)).length,
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2)
        };
    }
}

// Export for use in other modules
window.StorageManager = StorageManager;
