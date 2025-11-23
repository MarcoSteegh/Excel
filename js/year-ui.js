/**
 * Year UI Module
 * Handles UI interactions for year file management
 */

class YearUI {
    constructor(yearManager) {
        this.yearManager = yearManager;
        this.init();
    }

    init() {
        this.setupYearFileUploads();
        this.setupYearSelector();
        this.updateYearOverview();
    }

    /**
     * Setup year file upload handlers
     */
    setupYearFileUploads() {
        const years = [2020, 2021, 2022, 2023, 2024, 2025];
        
        years.forEach(year => {
            const input = document.getElementById(`year${year}`);
            if (input) {
                input.addEventListener('change', (e) => this.handleYearFileUpload(e, year));
            }
        });

        // Clear all years button
        const clearAllBtn = document.getElementById('clearAllYears');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllYears());
        }
    }

    /**
     * Setup year selector dropdown
     */
    setupYearSelector() {
        const yearSelect = document.getElementById('yearSelect');
        if (!yearSelect) return;

        yearSelect.addEventListener('change', (e) => {
            this.onYearChanged(e.target.value);
        });

        // Action required filter
        const actionFilter = document.getElementById('showOnlyActionRequired');
        if (actionFilter) {
            actionFilter.addEventListener('change', (e) => {
                this.onFilterChanged(e.target.checked);
            });
        }
    }

    /**
     * Handle year file upload
     */
    async handleYearFileUpload(event, year) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Show loading
            this.showYearStatus(year, 'loading', 'Laden...');

            const parser = new CSVParser();
            
            await this.yearManager.uploadYearFile(file, year, parser, (headers, saveColumns) => {
                this.showColumnSelector(year, headers, async (selectedColumns) => {
                    await saveColumns(selectedColumns);
                    // Forceer update van UI direct na opslaan
                    console.log('[YearUI] updateYearOverview na upload', year);
                    this.updateYearOverview();
                    console.log('[YearUI] updateYearSelector na upload', year);
                    this.updateYearSelector();
                });
            });
            
        } catch (error) {
            this.showYearStatus(year, 'error', error.message);
            console.error(`Error uploading year ${year}:`, error);
        }

        // Reset input
        event.target.value = '';
    }

    /**
     * Show column selector dialog
     */
    showColumnSelector(year, headers, callback) {
        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>📋 Selecteer kolommen voor ${year}</h3>
                <p class="help-text">Kies welke kolommen je wilt bewaren uit dit jaar-bestand:</p>
                
                <div class="column-selector-grid">
                    ${headers.map(header => {
                        const isRequired = header === 'Klantnummer' || header === 'Jaar';
                        return `
                            <label class="column-selector-item ${isRequired ? 'required' : ''}">
                                <input 
                                    type="checkbox" 
                                    value="${header}" 
                                    ${isRequired ? 'checked disabled' : 'checked'}
                                >
                                <span>${header} ${isRequired ? '(Verplicht)' : ''}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
                
                <div class="modal-actions">
                    <button class="btn-cancel">Annuleren</button>
                    <button class="btn-confirm">Opslaan</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle actions
        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            console.log('[Modal] Annuleren geklikt, modal wordt gesloten');
            modal.remove();
        });

        modal.querySelector('.btn-confirm').addEventListener('click', async () => {
            console.log('[Modal] Opslaan geklikt');
            const selected = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            console.log('[Modal] Geselecteerde kolommen:', selected);
            if (selected.length === 0) {
                alert('Selecteer minimaal één kolom');
                return;
            }
            try {
                console.log('[Modal] Opslaan start');
                await callback(selected);
                console.log('[Modal] Opslaan klaar, modal wordt gesloten');
                // Forceer verwijderen van alle modals
                document.querySelectorAll('.modal-overlay').forEach((el, i) => {
                    console.log(`[Modal] Verwijder modal-overlay #${i}`);
                    el.remove();
                });
                this.showYearStatus(year, 'success', 'Geladen');
            } catch (err) {
                console.error('[Modal] Fout bij opslaan:', err);
                let errorBox = modal.querySelector('.modal-error');
                if (!errorBox) {
                    errorBox = document.createElement('div');
                    errorBox.className = 'modal-error';
                    modal.querySelector('.modal-content').appendChild(errorBox);
                }
                errorBox.textContent = 'Fout bij opslaan: ' + (err.message || err);
            }
        });
    }

    /**
     * Update year overview panel
     */
    updateYearOverview() {
        const years = this.yearManager.getAvailableYears();
        const infoDiv = document.getElementById('yearDataInfo');
        
        if (!infoDiv) return;

        if (years.length === 0) {
            infoDiv.innerHTML = '<p>Geen jaar-bestanden geladen</p>';
            return;
        }

        const yearInfo = years.map(year => {
            const info = this.yearManager.getYearFileInfo(year);
            // Alleen jaar en recordcount, geen vinkje
            return `<strong>${year}</strong> (${info.recordCount} records)`;
        }).join(', ');

        infoDiv.innerHTML = `
            💾 <strong>${years.length} jaar-bestand(en)</strong> geladen: ${yearInfo}
            <button id="clearAllYearsBtn" class="btn-small btn-danger">Alles wissen</button>
        `;

        // Re-attach event listener
        document.getElementById('clearAllYearsBtn')?.addEventListener('click', () => {
            this.clearAllYears();
        });
    }

    /**
     * Update year selector dropdown
     */
    updateYearSelector() {
        const yearSelect = document.getElementById('yearSelect');
        if (!yearSelect) return;

        const years = this.yearManager.getAvailableYears();
        const currentValue = yearSelect.value;

        yearSelect.innerHTML = years.map(year => 
            `<option value="${year}" ${year === currentValue ? 'selected' : ''}>${year}</option>`
        ).join('');

        // Select most recent year if nothing selected
        if (!currentValue && years.length > 0) {
            yearSelect.value = years[0];
        }
    }

    /**
     * Show year file status
     */
    showYearStatus(year, status, message) {
        const statusDiv = document.querySelector(`[data-year="${year}"] .year-status`);
        if (!statusDiv) return;

        const icons = {
            loading: '⏳',
            success: '✅',
            error: '❌',
            empty: '➖'
        };

        statusDiv.textContent = `${icons[status] || ''} ${message}`;
        statusDiv.className = `year-status status-${status}`;
    }

    /**
     * Clear all years
     */
    clearAllYears() {
        if (!confirm('Weet je zeker dat je alle jaar-bestanden wilt verwijderen?')) {
            return;
        }

        this.yearManager.clearAllYears();
        this.updateYearOverview();
        this.updateYearSelector();
        
        // Reset status for all years
        [2020, 2021, 2022, 2023, 2024, 2025].forEach(year => {
            this.showYearStatus(year, 'empty', 'Niet geladen');
        });
    }

    /**
     * Called when year selection changes
     */
    onYearChanged(year) {
        // Trigger event for main app to handle
        const event = new CustomEvent('yearChanged', { detail: { year } });
        document.dispatchEvent(event);
    }

    /**
     * Called when action filter changes
     */
    onFilterChanged(showOnlyActionRequired) {
        // Trigger event for main app to handle
        const event = new CustomEvent('filterChanged', { detail: { showOnlyActionRequired } });
        document.dispatchEvent(event);
    }

    /**
     * Update year statistics display
     */
    updateYearStatistics(stats) {
        const statsDiv = document.getElementById('yearStatistics');
        if (!statsDiv || !stats) return;

        statsDiv.innerHTML = `
            📈 <strong>${stats.year}:</strong> 
            ${stats.total} klanten totaal | 
            ${stats.compleet} compleet (${stats.percentageCompleet}%) | 
            ⚠️ ${stats.actionRequired} actie nodig (${100 - stats.percentageCompleet}%)
        `;
    }
}

// Export for use in other modules
window.YearUI = YearUI;
