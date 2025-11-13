/**
 * Year Manager Module
 * Handles multi-year CSV file management and data merging
 */

class YearManager {
    constructor() {
        this.yearFiles = {};
        this.storagePrefix = 'csvAnalyzer_year_';
        this.loadStoredYears();
    }

    /**
     * Load all stored year files from localStorage
     */
    loadStoredYears() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.storagePrefix)) {
                const year = key.replace(this.storagePrefix, '');
                const data = JSON.parse(localStorage.getItem(key));
                this.yearFiles[year] = data;
            }
        });
        const loadedYears = Object.keys(this.yearFiles);
        console.log(`Loaded ${loadedYears.length} year files from storage`);
        return loadedYears;
    }

    /**
     * Get list of available years
     */
    getAvailableYears() {
        return Object.keys(this.yearFiles).sort((a, b) => b - a); // Newest first
    }

    /**
     * Upload and process a year file
     */
    async uploadYearFile(file, year, parser, onColumnSelect) {
        try {
            // Read and parse the file
            const text = await parser.readFileAsText(file);
            const data = parser.parseCSV(text);
            
            // Validate required columns
            if (!data.headers.includes('Klantnummer') || !data.headers.includes('Jaar')) {
                throw new Error('Jaar-bestand moet kolommen "Klantnummer" en "Jaar" bevatten');
            }

            // Show column selection dialog
            onColumnSelect(data.headers, (selectedColumns) => {
                this.saveYearFile(year, file.name, data, selectedColumns);
            });

        } catch (error) {
            throw new Error(`Fout bij het laden van jaar ${year}: ${error.message}`);
        }
    }

    /**
     * Save year file data to storage
     */
    saveYearFile(year, filename, parsedData, selectedColumns) {
        const yearData = {
            year: year,
            filename: filename,
            uploadDate: new Date().toISOString(),
            selectedColumns: selectedColumns,
            data: parsedData.data.map(row => {
                const filteredRow = {
                    Klantnummer: row.Klantnummer,
                    Jaar: row.Jaar
                };
                
                // Only include selected columns
                selectedColumns.forEach(col => {
                    if (col !== 'Klantnummer' && col !== 'Jaar') {
                        filteredRow[col] = row[col] || '';
                    }
                });
                
                return filteredRow;
            })
        };

        this.yearFiles[year] = yearData;
        localStorage.setItem(this.storagePrefix + year, JSON.stringify(yearData));
        
        console.log(`Saved year file for ${year} with ${yearData.data.length} records`);
    }

    /**
     * Remove a year file
     */
    removeYearFile(year) {
        delete this.yearFiles[year];
        localStorage.removeItem(this.storagePrefix + year);
    }

    /**
     * Get data for specific year
     */
    getYearData(year) {
        return this.yearFiles[year] || null;
    }

    /**
     * Merge Aangiftes data with year file data
     */
    mergeWithAangiftes(aangiftesData, selectedYear) {
        const yearData = this.getYearData(selectedYear);
        
        if (!yearData) {
            console.warn(`No year data found for ${selectedYear}`);
            return aangiftesData;
        }

        // Create a map of aangiftes data for quick lookup
        const aangiftesMap = new Map();
        aangiftesData.data.forEach(row => {
            const key = `${row.Klantnummer}_${row.Jaar}`;
            aangiftesMap.set(key, row);
        });

        // Merge year data with aangiftes data
        const mergedData = yearData.data.map(yearRow => {
            const key = `${yearRow.Klantnummer}_${yearRow.Jaar}`;
            const aangifteRow = aangiftesMap.get(key);

            // Combine data: year file data + aangifte data (if exists)
            return {
                ...yearRow,                    // Year file columns
                ...(aangifteRow || {}),        // Aangifte columns (tracking etc.)
                _hasAangifte: !!aangifteRow,   // Flag to indicate if aangifte exists
                _actionRequired: !aangifteRow || !this.isCompleet(aangifteRow)
            };
        });

        // Combine headers
        const mergedHeaders = [
            ...Object.keys(yearData.data[0] || {}),
            ...Object.keys(aangiftesData.data[0] || {}).filter(h => 
                !Object.keys(yearData.data[0] || {}).includes(h)
            )
        ];

        return {
            headers: mergedHeaders,
            data: mergedData
        };
    }

    /**
     * Check if tracking is complete for a row
     */
    isCompleet(row) {
        const trackingColumns = [
            'Inventarisatie OWR gemaakt',
            'OWR zinvol',
            'Gegevens compleet',
            'Contact met klant opgenomen',
            'Opgave OWR ingevuld',
            'Afgewerkt'
        ];

        // Check if "OWR zinvol" is "Nee" - then Gegevens and Opgave are not required
        if (row['OWR zinvol'] === 'Nee') {
            // Only check other columns
            const requiredColumns = trackingColumns.filter(col => 
                col !== 'Gegevens compleet' && col !== 'Opgave OWR ingevuld'
            );
            return requiredColumns.every(col => row[col] === 'Ja');
        }

        // All columns must be "Ja"
        return trackingColumns.every(col => row[col] === 'Ja');
    }

    /**
     * Get statistics for a specific year
     */
    getYearStatistics(yearData, aangiftesData) {
        if (!yearData) return null;

        const merged = this.mergeWithAangiftes(aangiftesData, yearData.year);
        const total = merged.data.length;
        const withAangifte = merged.data.filter(r => r._hasAangifte).length;
        const compleet = merged.data.filter(r => r._hasAangifte && !r._actionRequired).length;
        const actionRequired = merged.data.filter(r => r._actionRequired).length;

        return {
            year: yearData.year,
            total: total,
            withAangifte: withAangifte,
            compleet: compleet,
            actionRequired: actionRequired,
            percentageCompleet: total > 0 ? Math.round((compleet / total) * 100) : 0
        };
    }

    /**
     * Clear all year files
     */
    clearAllYears() {
        const years = this.getAvailableYears();
        years.forEach(year => this.removeYearFile(year));
        this.yearFiles = {};
    }

    /**
     * Export year file info
     */
    getYearFileInfo(year) {
        const yearData = this.getYearData(year);
        if (!yearData) return null;

        return {
            year: yearData.year,
            filename: yearData.filename,
            uploadDate: new Date(yearData.uploadDate).toLocaleString('nl-NL'),
            recordCount: yearData.data.length,
            selectedColumns: yearData.selectedColumns
        };
    }
}

// Export for use in other modules
window.YearManager = YearManager;
