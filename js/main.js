// CSV Analyzer JavaScript
class CSVAnalyzer {
    constructor() {
        this.baseData = null;
        this.newData = null;
        this.comparisonResults = null;
        this.init();
    }

    init() {
        // Event listeners
        document.getElementById('baseCSV').addEventListener('change', (e) => this.handleFileUpload(e, 'base'));
        
        // Export buttons
        document.getElementById('exportExcel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('exportBaseWithTracking').addEventListener('click', () => this.exportBaseDataWithTracking());
        document.getElementById('exportCSV').addEventListener('click', () => this.exportToCSV());
        document.getElementById('printReport').addEventListener('click', () => this.printReport());
        
        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Kolom selectie is verwijderd - vaste kolommen worden nu automatisch gebruikt

        // Tracking kolommen buttons
        document.getElementById('addTrackingColumns').addEventListener('click', () => this.addTrackingColumns());
        document.getElementById('removeTrackingColumns').addEventListener('click', () => this.removeTrackingColumns());

        // Preview buttons
        document.getElementById('exportPreview').addEventListener('click', () => this.exportPreview());
        document.getElementById('exportToPDF').addEventListener('click', () => this.exportToPDF());
        document.getElementById('saveDataWithTracking').addEventListener('click', () => this.saveDataWithTracking());
        document.getElementById('loadDataWithTracking').addEventListener('click', () => {
            document.getElementById('loadTrackingFile').click();
        });
        document.getElementById('loadTrackingFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Controleer bestandstype
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    this.loadDataWithTracking(file);
                } else {
                    this.showError('Selecteer een geldig JSON bestand');
                }
                e.target.value = ''; // Reset file input
            }
        });

        // Smart Update functionaliteit
        document.getElementById('smartUpdateCSV').addEventListener('click', () => {
            document.getElementById('smartUpdateFile').click();
        });

        document.getElementById('smartUpdateFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.smartUpdateCSV(file);
                e.target.value = ''; // Reset file input
            }
        });

        // Preview tabs
        document.querySelectorAll('.preview-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPreviewTab(e.target.closest('.preview-tab-btn').dataset.previewTab));
        });

        // Separator change listener
        document.getElementById('separator').addEventListener('change', () => {
            if (this.baseData || this.newData) {
                // Re-parse bestanden met nieuwe separator
                this.reparseFiles();
            }
        });

        // Kolom selectie is verwijderd - vaste kolommen worden automatisch gebruikt
        
        // Data search functionality
        this.setupDataSearch();
    }

    async handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await this.readFileAsText(file);
            const data = this.parseCSV(text);
            
            this.baseData = data;
            this.originalBaseFile = file; // Sla origineel bestand op voor re-parsing
            this.displayFileInfo('baseCSVInfo', file, data);
            
            this.updateKeyColumnOptions();
            this.updatePreview();
            
        } catch (error) {
            this.showError(`Fout bij het lezen van ${file.name}: ${error.message}`);
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Kon bestand niet lezen'));
            
            // Probeer verschillende encodings
            const encoding = document.getElementById('encoding').value || 'UTF-8';
            reader.readAsText(file, encoding);
        });
    }

    parseCSV(text) {
        let separator = document.getElementById('separator').value;
        const lines = text.trim().split('\n');
        
        if (lines.length < 1) {
            throw new Error('CSV bestand is leeg');
        }

        // Automatische detectie van scheidingsteken als niet expliciet gekozen
        if (!separator || separator === 'auto') {
            separator = this.detectSeparator(lines[0]);
            console.log(`Automatisch gedetecteerd scheidingsteken: "${separator}"`);
            
            // Update de UI om te tonen wat gedetecteerd is
            const separatorSelect = document.getElementById('separator');
            if (separator === ',') separatorSelect.value = ',';
            else if (separator === ';') separatorSelect.value = ';';
            else if (separator === '\t') separatorSelect.value = '\t';
        }

        if (lines.length < 2) {
            // Alleen header, geen data - toon warning maar ga door
            console.warn('CSV bestand bevat alleen headers, geen data rijen');
        }

        const headers = this.parseLine(lines[0], separator);
        const data = [];

        // Debug info
        console.log(`Headers gevonden: ${headers.length}`, headers);

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = this.parseLine(lines[i], separator);
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] ? values[index].trim() : '';
                });
                
                data.push(row);
            }
        }

        console.log(`Data rijen verwerkt: ${data.length}`);
        return { headers, data };
    }

    detectSeparator(firstLine) {
        // Tel aantal voorkomens van verschillende scheidingstekens
        const separators = [';', ',', '\t', '|'];
        let maxCount = 0;
        let detectedSep = ',';
        
        for (const sep of separators) {
            const count = (firstLine.match(new RegExp(sep === '|' ? '\\|' : sep, 'g')) || []).length;
            if (count > maxCount) {
                maxCount = count;
                detectedSep = sep;
            }
        }
        
        // Als geen scheidingstekens gevonden, gebruik komma als default
        return maxCount > 0 ? detectedSep : ',';
    }

    async reparseFiles() {
        // Re-parse alleen basis CSV bestand
        if (this.originalBaseFile) {
            const text = await this.readFileAsText(this.originalBaseFile);
            const data = this.parseCSV(text);
            this.baseData = data;
            this.displayFileInfo('baseCSVInfo', this.originalBaseFile, data);
        }
        
        // Update UI
        this.updateKeyColumnOptions();
        this.updatePreview();
    }

    parseLine(line, separator) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    displayFileInfo(elementId, file, data) {
        const info = document.getElementById(elementId);
        
        // Bepaal welk scheidingsteken gebruikt wordt
        const separator = document.getElementById('separator').value;
        let sepText = '';
        if (separator === ',') sepText = 'Komma (,)';
        else if (separator === ';') sepText = 'Puntkomma (;)';
        else if (separator === '\t') sepText = 'Tab';
        else if (separator === '|') sepText = 'Pipe (|)';
        else sepText = 'Auto-detect';
        
        // Toon eerste paar kolomnamen voor verificatie
        const columnPreview = data.headers.slice(0, 3).join(', ') + (data.headers.length > 3 ? ', ...' : '');
        
        info.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${file.name}</strong><br>
                    <small>${data.data.length} rijen, ${data.headers.length} kolommen</small><br>
                    <small style="color: #667eea;">📊 ${sepText} | 📋 ${columnPreview}</small>
                </div>
                <i class="fas fa-check-circle" style="color: #27ae60; font-size: 1.5rem;"></i>
            </div>
        `;
    }

    // Toon settings sectie en update column selection
    updateKeyColumnOptions() {
        if (this.baseData) {
            // Toon settings sectie automatisch
            document.querySelector('.settings-section').style.display = 'block';
        }

        // Update column selection checkboxes
        this.updateColumnSelection();
    }

    updateColumnSelection() {
        if (!this.baseData) return;

        // Kolom selectie sectie is verwijderd - we gebruiken nu vaste kolommen
        // Toon wel de tracking section
        const trackingSection = document.querySelector('.tracking-section');
        if (trackingSection) {
            trackingSection.style.display = 'block';
        }

        // Check en toon Smart Update knop als er tracking kolommen zijn
        this.showSmartUpdateButton();

        // Trigger initial preview update met standaard kolommen
        setTimeout(() => {
            this.updatePreview();
        }, 100);
    }

    getSelectedColumns() {
        // Vaste set kolommen die altijd getoond worden
        const defaultColumns = [
            'Nummer',           // Klantnummer (altijd eerste)
            'Initialen',
            'Tussenvoegsel',
            'Achternaam',
            'Jaar',
            'Behandelaar',
            'Verantwoordelijke'
        ];
        
        // Filter alleen kolommen die echt bestaan in de data
        let selectedColumns = [];
        if (this.baseData && this.baseData.headers) {
            selectedColumns = defaultColumns.filter(col => 
                this.baseData.headers.includes(col)
            );
        } else {
            selectedColumns = [...defaultColumns];
        }

        // Voeg geselecteerde tracking kolommen toe aan het einde
        const selectedTrackingColumns = this.getSelectedTrackingColumns();
        selectedTrackingColumns.forEach(trackingCol => {
            if (!selectedColumns.includes(trackingCol)) {
                selectedColumns.push(trackingCol);
            }
        });
        
        return selectedColumns;
    }

    // Tracking kolommen functionaliteit
    getSelectedTrackingColumns() {
        const checkboxes = document.querySelectorAll('.tracking-columns input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    isTrackingColumn(columnName) {
        const trackingColumns = ['Inventarisatie OWR gemaakt', 'OWR zinvol', 'Gegevens compleet', 'Contact met klant opgenomen', 'Opgave OWR ingevuld', 'Afgewerkt'];
        return trackingColumns.includes(columnName);
    }

    calculateTrackingPercentage(columnName) {
        if (!this.baseData || !this.baseData.data || this.baseData.data.length === 0) {
            return 0;
        }

        const totalRows = this.baseData.data.length;
        const jaCount = this.baseData.data.filter(row => row[columnName] === 'Ja').length;
        const percentage = Math.round((jaCount / totalRows) * 100);
        
        console.log(`Percentage calculation for ${columnName}: ${jaCount}/${totalRows} = ${percentage}%`);
        
        return percentage;
    }

    calculateTrackingPercentageFromDOM(columnName) {
        // Bereken percentage direct uit de DOM dropdowns
        console.log(`🔍 Calculating percentage for column: ${columnName}`);
        
        const table = document.querySelector('table tbody');
        if (!table) {
            console.log(`❌ No table found`);
            return 0;
        }

        // Test alternatieve selector
        const allSelects = document.querySelectorAll('select[data-column="' + columnName + '"]');
        console.log(`🔍 Found ${allSelects.length} dropdowns for ${columnName}`);
        
        let totalCount = 0;
        let jaCount = 0;

        allSelects.forEach(select => {
            totalCount++;
            console.log(`🔍 Dropdown value: ${select.value}`);
            if (select.value === 'Ja') {
                jaCount++;
            }
        });

        const percentage = totalCount > 0 ? Math.round((jaCount / totalCount) * 100) : 0;
        console.log(`📊 Final calculation for ${columnName}: ${jaCount}/${totalCount} = ${percentage}%`);
        return percentage;
    }

    createTrackingHeaderHTML(columnName, percentage, jaCount, totalRows) {
        // Bepaal badge klasse op basis van percentage
        let badgeClass = 'tracking-percentage';
        if (percentage >= 80) {
            badgeClass += ' high';
        } else if (percentage >= 40) {
            badgeClass += ' medium';
        } else {
            badgeClass += ' low';
        }

        // Maak korte versie van kolom naam voor compacte weergave
        const shortName = this.shortenColumnName(columnName);

        // Voeg info icoontje toe als de naam is ingekort
        const infoIcon = shortName !== columnName ? '<i class="fas fa-info-circle tracking-info-icon"></i>' : '';
        
        return `
            <div class="tracking-header" data-full-name="${columnName}" title="${columnName} - ${percentage}% voltooid (${jaCount} van ${totalRows})">
                <span class="tracking-header-text">${shortName}${infoIcon}</span>
                <span class="${badgeClass}">${percentage}%</span>
            </div>
        `;
    }

    shortenColumnName(columnName) {
        // Maak kolom namen korter voor betere weergave
        const shortNames = {
            'Inventarisatie OWR gemaakt': 'Inventarisatie',
            'OWR zinvol': 'Zinvol',
            'Gegevens compleet': 'Gegevens',
            'Contact met klant opgenomen': 'Contact',
            'Opgave OWR ingevuld': 'Opgave',
            'Afgewerkt': 'Afgewerkt'
        };
        
        return shortNames[columnName] || columnName;
    }

    getDisplayColumnName(columnName) {
        // Verkort kolomnamen voor compacte weergave in tabel headers
        if (columnName.toLowerCase().includes('tussenvoegsel')) {
            return 'Tv';
        }
        
        return columnName;
    }

    updateSpecificTrackingHeader(columnName) {
        console.log(`🔄 Trying to update header for: ${columnName}`);
        console.log(`🔄 baseData exists: ${!!this.baseData}`);
        if (this.baseData && this.baseData.headers) {
            console.log(`🔄 All headers:`, this.baseData.headers);
            console.log(`🔄 Looking for header: "${columnName}"`);
            console.log(`🔄 Header exact match: ${this.baseData.headers.includes(columnName)}`);
        }
        
        // Voor tracking kolommen, bypass de header check
        const isTrackingColumn = this.isTrackingColumn(columnName);
        if (!this.baseData || (!this.baseData.headers.includes(columnName) && !isTrackingColumn)) {
            console.log(`❌ Cannot update header for ${columnName} - conditions not met`);
            return;
        }
        
        // Gebruik DOM-gebaseerde berekening voor realtime updates
        const percentage = this.calculateTrackingPercentageFromDOM(columnName);
        
        // Bereken ook jaCount uit DOM
        const table = document.querySelector('table tbody');
        let jaCount = 0;
        let totalCount = 0;
        
        if (table) {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    const select = cell.querySelector('select[data-column="' + columnName + '"]');
                    if (select) {
                        totalCount++;
                        if (select.value === 'Ja') {
                            jaCount++;
                        }
                    }
                });
            });
        }
        
        console.log(`Updating header for ${columnName}: ${percentage}% (${jaCount}/${totalCount})`);
        const shortName = this.shortenColumnName(columnName);
        
        // Zoek alle headers die deze tracking kolom bevatten
        const headers = document.querySelectorAll('th');
        headers.forEach(header => {
            const trackingHeaderDiv = header.querySelector('.tracking-header');
            if (trackingHeaderDiv) {
                // Gebruik data-full-name attribuut voor exacte match
                const fullName = trackingHeaderDiv.getAttribute('data-full-name');
                if (fullName === columnName) {
                    // Update alleen de content van deze specifieke header
                    header.innerHTML = this.createTrackingHeaderHTML(columnName, percentage, jaCount, totalCount);
                }
            }
        });
    }

    updateAllTrackingHeaders() {
        const trackingColumns = ['Inventarisatie OWR gemaakt', 'OWR zinvol', 'Gegevens compleet', 'Contact met klant opgenomen', 'Opgave OWR ingevuld', 'Afgewerkt'];
        
        trackingColumns.forEach(columnName => {
            if (this.baseData && this.baseData.headers.includes(columnName)) {
                this.updateSpecificTrackingHeader(columnName);
            }
        });
    }

    updateTrackingHeaders() {
        // Gebruik de nieuwe efficiënte functie
        this.updateAllTrackingHeaders();
    }

    createTrackingDropdown(value, rowData, columnName) {
        const select = document.createElement('select');
        select.className = 'tracking-dropdown';
        // Gebruik een unieke identifier op basis van klantnummer en jaar
        const uniqueId = `${rowData['Nummer']}_${rowData['Jaar']}`;
        select.dataset.uniqueId = uniqueId;
        select.dataset.column = columnName;
        
        // Opties: leeg, Ja, Nee
        const options = [
            { value: '', text: '-' },
            { value: 'Ja', text: 'Ja' },
            { value: 'Nee', text: 'Nee' }
        ];
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            if (option.value === value) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });
        
        // Check of deze dropdown disabled moet zijn op basis van "OWR zinvol"
        if ((columnName === 'Gegevens compleet' || columnName === 'Opgave OWR ingevuld') && rowData['OWR zinvol'] === 'Nee') {
            select.disabled = true;
            select.style.backgroundColor = '#f0f0f0';
            select.style.color = '#999';
            select.style.cursor = 'not-allowed';
        }
        
        // Event listener voor veranderingen
        select.addEventListener('change', (e) => {
            console.log(`🔥 DROPDOWN EVENT FIRED! ${uniqueId} - ${columnName} -> ${e.target.value}`);
            
            // Direct test: update header zonder de complexe functie
            const percentageTest = this.calculateTrackingPercentageFromDOM(columnName);
            console.log(`🔥 Direct percentage test: ${percentageTest}%`);
            
            this.updateTrackingValueByUniqueId(uniqueId, columnName, e.target.value);
            
            // Als dit de "OWR zinvol" kolom is, update afhankelijke dropdowns
            if (columnName === 'OWR zinvol') {
                this.updateDependentDropdowns(uniqueId, e.target.value);
            }
        });
        
        return select;
    }

    updateTrackingValue(rowId, columnName, newValue) {
        // Zoek de rij in baseData en update de waarde
        if (this.baseData && this.baseData.data) {
            const rowIndex = parseInt(rowId);
            if (rowIndex >= 0 && rowIndex < this.baseData.data.length) {
                this.baseData.data[rowIndex][columnName] = newValue;
                console.log(`Updated ${columnName} for row ${rowIndex} to: ${newValue}`);
            }
        }
    }

    updateTrackingValueByUniqueId(uniqueId, columnName, newValue) {
        // Zoek de rij op basis van klantnummer en jaar
        if (this.baseData && this.baseData.data) {
            const [nummer, jaar] = uniqueId.split('_');
            const row = this.baseData.data.find(r => r['Nummer'] === nummer && r['Jaar'] === jaar);
            if (row) {
                row[columnName] = newValue;
                console.log(`Updated ${columnName} for klant ${nummer} jaar ${jaar} to: ${newValue}`);
                
                // Instant update van de specifieke tracking header met visuele feedback
                this.updateSpecificTrackingHeader(columnName);
                
                // Voeg een subtiele flash animatie toe aan de bijgewerkte header
                this.flashUpdatedHeader(columnName);
                
                // Ook update alle andere tracking headers (voor het geval er afhankelijkheden zijn)
                this.updateAllTrackingHeaders();
                
                // Check of we de Smart Update knop moeten tonen
                this.showSmartUpdateButton();
            } else {
                console.warn(`Could not find row for ${nummer}_${jaar}`);
            }
        }
    }

    updateDependentDropdowns(uniqueId, owrZinvolValue) {
        // Vind alle dropdowns voor deze rij
        const gegevensDropdown = document.querySelector(`select[data-unique-id="${uniqueId}"][data-column="Gegevens compleet"]`);
        const opgaveDropdown = document.querySelector(`select[data-unique-id="${uniqueId}"][data-column="Opgave OWR ingevuld"]`);
        
        const [nummer, jaar] = uniqueId.split('_');
        
        if (owrZinvolValue === 'Nee') {
            // Disable en grey-out de afhankelijke kolommen
            if (gegevensDropdown) {
                gegevensDropdown.disabled = true;
                gegevensDropdown.style.backgroundColor = '#f0f0f0';
                gegevensDropdown.style.color = '#999';
                gegevensDropdown.style.cursor = 'not-allowed';
                gegevensDropdown.value = ''; // Reset naar leeg
                
                // Update data direct zonder updateTrackingValueByUniqueId om recursie te voorkomen
                if (this.baseData && this.baseData.data) {
                    const row = this.baseData.data.find(r => r['Nummer'] === nummer && r['Jaar'] === jaar);
                    if (row) {
                        row['Gegevens compleet'] = '';
                    }
                }
            }
            if (opgaveDropdown) {
                opgaveDropdown.disabled = true;
                opgaveDropdown.style.backgroundColor = '#f0f0f0';
                opgaveDropdown.style.color = '#999';
                opgaveDropdown.style.cursor = 'not-allowed';
                opgaveDropdown.value = ''; // Reset naar leeg
                
                // Update data direct zonder updateTrackingValueByUniqueId om recursie te voorkomen
                if (this.baseData && this.baseData.data) {
                    const row = this.baseData.data.find(r => r['Nummer'] === nummer && r['Jaar'] === jaar);
                    if (row) {
                        row['Opgave OWR ingevuld'] = '';
                    }
                }
            }
            
            // Update headers voor beide kolommen
            this.updateSpecificTrackingHeader('Gegevens compleet');
            this.updateSpecificTrackingHeader('Opgave OWR ingevuld');
            
        } else {
            // Enable de afhankelijke kolommen weer
            if (gegevensDropdown) {
                gegevensDropdown.disabled = false;
                gegevensDropdown.style.backgroundColor = '';
                gegevensDropdown.style.color = '';
                gegevensDropdown.style.cursor = '';
            }
            if (opgaveDropdown) {
                opgaveDropdown.disabled = false;
                opgaveDropdown.style.backgroundColor = '';
                opgaveDropdown.style.color = '';
                opgaveDropdown.style.cursor = '';
            }
        }
    }

    addTrackingColumns() {
        if (!this.baseData) {
            this.showError('Laad eerst een basis CSV bestand');
            return;
        }

        const selectedTracking = this.getSelectedTrackingColumns();
        if (selectedTracking.length === 0) {
            this.showError('Selecteer minimaal één tracking kolom om toe te voegen');
            return;
        }

        // Voeg tracking kolommen toe aan headers (als ze er nog niet zijn)
        selectedTracking.forEach(trackingCol => {
            if (!this.baseData.headers.includes(trackingCol)) {
                this.baseData.headers.push(trackingCol);
            }
        });

        // Voeg lege waarden toe aan alle data rijen voor de nieuwe kolommen
        this.baseData.data.forEach(row => {
            selectedTracking.forEach(trackingCol => {
                if (!(trackingCol in row)) {
                    row[trackingCol] = ''; // Lege waarde, kan later ingevuld worden
                }
            });
        });

        // Bewaar huidige kolom selectie voordat we de UI updaten
        const currentlySelected = this.getSelectedColumns().filter(col => !selectedTracking.includes(col));
        
        // Update de kolom selectie UI zodat nieuwe kolommen verschijnen
        this.updateColumnSelection();
        
        // Herstel de selectie van de eerder geselecteerde kolommen + tracking kolommen
        setTimeout(() => {
            currentlySelected.forEach(col => {
                const checkbox = document.getElementById(`col_${col}`);
                if (checkbox) checkbox.checked = true;
            });
            selectedTracking.forEach(col => {
                const checkbox = document.getElementById(`col_${col}`);
                if (checkbox) checkbox.checked = true;
            });
            
            // Update preview met de juiste selectie
            this.updatePreview();
            
            // Als er al vergelijkingsresultaten zijn, update deze ook
            if (this.comparisonResults) {
                this.displayResults();
            }
            
            // Update tracking headers met percentages
            setTimeout(() => {
                this.updateTrackingHeaders();
            }, 200);

            // Toon Smart Update knop nu er tracking data is
            this.showSmartUpdateButton();
            
            // DEBUG: Force show Smart Update button
            const debugBtn = document.getElementById('smartUpdateCSV');
            if (debugBtn) {
                debugBtn.style.display = 'flex';
                console.log('🚨 DEBUG: Force showing Smart Update button!');
            }
        }, 100);
        
        this.showSuccess(`${selectedTracking.length} tracking kolom(men) toegevoegd en zichtbaar gemaakt`);
    }

    removeTrackingColumns() {
        if (!this.baseData) {
            this.showError('Geen basis CSV data geladen');
            return;
        }

        const selectedTracking = this.getSelectedTrackingColumns();
        if (selectedTracking.length === 0) {
            this.showError('Selecteer tracking kolommen om te verwijderen');
            return;
        }

        // Verwijder tracking kolommen uit headers
        selectedTracking.forEach(trackingCol => {
            const index = this.baseData.headers.indexOf(trackingCol);
            if (index > -1) {
                this.baseData.headers.splice(index, 1);
            }
        });

        // Verwijder tracking kolommen uit data rijen
        this.baseData.data.forEach(row => {
            selectedTracking.forEach(trackingCol => {
                delete row[trackingCol];
            });
        });

        // Bewaar huidige kolom selectie (exclusief de te verwijderen tracking kolommen)
        const currentlySelected = this.getSelectedColumns().filter(col => !selectedTracking.includes(col));
        
        // Update de kolom selectie UI
        this.updateColumnSelection();
        
        // Herstel de selectie van de eerder geselecteerde kolommen (minus de tracking kolommen)
        setTimeout(() => {
            currentlySelected.forEach(col => {
                const checkbox = document.getElementById(`col_${col}`);
                if (checkbox && !selectedTracking.includes(col)) {
                    checkbox.checked = true;
                }
            });
            
            // Update preview met de juiste selectie
            this.updatePreview();
            
            // Als er al vergelijkingsresultaten zijn, update deze ook
            if (this.comparisonResults) {
                this.displayResults();
            }
            
            // Update Smart Update knop visibility (minder kolommen = mogelijk verbergen)
            this.showSmartUpdateButton();
        }, 100);
        
        this.showSuccess(`${selectedTracking.length} tracking kolom(men) verwijderd`);
    }

    // Hulpfunctie om success berichten te tonen
    showSuccess(message) {
        // Gebruik dezelfde styling als error, maar dan groen
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.backgroundColor = '#d4edda';
        errorDiv.style.color = '#155724';
        errorDiv.style.borderColor = '#c3e6cb';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
            errorDiv.style.backgroundColor = '';
            errorDiv.style.color = '';
            errorDiv.style.borderColor = '';
        }, 3000);
    }

    // Hulpfunctie om data te sorteren op klantnummer
    sortDataByNumber(data) {
        if (!Array.isArray(data) || data.length === 0) return data;
        
        return [...data].sort((a, b) => {
            // Eerst sorteren op klantnummer (Nummer kolom)
            const numA = parseInt(a['Nummer']) || 0;
            const numB = parseInt(b['Nummer']) || 0;
            
            if (numA !== numB) {
                return numA - numB; // Klantnummer laag naar hoog
            }
            
            // Als klantnummer gelijk is, sorteer dan op jaar (oud naar nieuw)
            const yearA = parseInt(a['Jaar']) || 0;
            const yearB = parseInt(b['Jaar']) || 0;
            return yearA - yearB; // Jaar oud naar nieuw
        });
    }

    selectAllColumns(select = true) {
        const checkboxes = document.querySelectorAll('#columnCheckboxes input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            // Nummer (klantnummer) altijd geselecteerd laten, zelfs bij "deselecteer alles"
            if (checkbox.value === 'Nummer') {
                checkbox.checked = true;
            } else {
                checkbox.checked = select;
            }
        });
        this.updatePreview();
    }



    applyPreset(presetType) {
        // Eerst alles deselecteren
        this.selectAllColumns(false);
        
        // Update active preset button
        document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        const buttonId = `preset${presetType.charAt(0).toUpperCase() + presetType.slice(1)}`;
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('active');
        }        let patterns = [];
        
        switch(presetType) {
            case 'financial':
                patterns = [
                    /^.*nummer.*$/i, // Klantnummer
                    /^.*id.*$/i,
                    /.*bedrag.*/i,
                    /.*prijs.*/i,
                    /.*kosten.*/i,
                    /.*tarief.*/i,
                    /.*euro.*/i,
                    /.*eur.*/i,
                    /.*btw.*/i,
                    /.*vat.*/i,
                    /.*totaal.*/i,
                    /.*subtotaal.*/i,
                    /.*factuur.*/i,
                    /.*invoice.*/i,
                    /.*aantal.*/i,
                    /.*quantity.*/i,
                    /.*qty.*/i
                ];
                break;
                
            case 'basic':
                patterns = [
                    /^.*nummer.*$/i, // Klantnummer
                    /^.*id.*$/i,
                    /.*naam.*/i,
                    /.*name.*/i,
                    /.*titel.*/i,
                    /.*title.*/i,
                    /.*omschrijving.*/i,
                    /.*description.*/i,
                    /.*status.*/i,
                    /.*type.*/i,
                    /.*categorie.*/i,
                    /.*category.*/i
                ];
                break;
                
            case 'contact':
                patterns = [
                    /^.*nummer.*$/i, // Klantnummer
                    /^.*id.*$/i,
                    /.*naam.*/i,
                    /.*name.*/i,
                    /.*email.*/i,
                    /.*mail.*/i,
                    /.*telefoon.*/i,
                    /.*phone.*/i,
                    /.*mobile.*/i,
                    /.*adres.*/i,
                    /.*address.*/i,
                    /.*postcode.*/i,
                    /.*postal.*/i,
                    /.*zip.*/i,
                    /.*plaats.*/i,
                    /.*city.*/i,
                    /.*land.*/i,
                    /.*country.*/i
                ];
                break;
                
            case 'dates':
                patterns = [
                    /^.*nummer.*$/i, // Klantnummer
                    /^.*id.*$/i,
                    /.*datum.*/i,
                    /.*date.*/i,
                    /.*tijd.*/i,
                    /.*time.*/i,
                    /.*created.*/i,
                    /.*modified.*/i,
                    /.*updated.*/i,
                    /.*start.*/i,
                    /.*eind.*/i,
                    /.*end.*/i,
                    /.*status.*/i,
                    /.*fase.*/i,
                    /.*phase.*/i,
                    /.*deadline.*/i,
                    /.*verlopen.*/i,
                    /.*expired.*/i
                ];
                break;
                
            case 'custom':
                const savedPreset = localStorage.getItem('csvAnalyzerCustomPreset');
                if (savedPreset) {
                    const customColumns = JSON.parse(savedPreset);
                    this.selectSpecificColumns(customColumns);
                    return;
                } else {
                    this.showError('Geen aangepaste selectie opgeslagen. Sla eerst je huidige selectie op als favoriet.');
                    return;
                }
        }
        
        // Selecteer kolommen die matchen met de patterns
        const checkboxes = document.querySelectorAll('#columnCheckboxes input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const columnName = checkbox.value;
            const matches = patterns.some(pattern => pattern.test(columnName));
            
            // Nummer (klantnummer) altijd geselecteerd houden
            if (columnName === 'Nummer') {
                checkbox.checked = true;
            } else {
                checkbox.checked = matches;
            }
        });
        
        this.updatePreview();
        
        // Toon feedback over aantal geselecteerde kolommen
        const selectedCount = document.querySelectorAll('#columnCheckboxes input[type="checkbox"]:checked').length;
        const totalCount = document.querySelectorAll('#columnCheckboxes input[type="checkbox"]').length;
        console.log(`Preset '${presetType}' toegepast: ${selectedCount}/${totalCount} kolommen geselecteerd`);
    }

    selectSpecificColumns(columnNames) {
        const checkboxes = document.querySelectorAll('#columnCheckboxes input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = columnNames.includes(checkbox.value);
        });
        this.updatePreview();
    }

    saveCustomPreset() {
        const selectedColumns = this.getSelectedColumns();
        
        if (selectedColumns.length === 0) {
            this.showError('Selecteer eerst enkele kolommen voordat je ze opslaat als favoriet.');
            return;
        }
        
        localStorage.setItem('csvAnalyzerCustomPreset', JSON.stringify(selectedColumns));
        
        // Update knop tekst om feedback te geven
        const saveBtn = document.getElementById('savePreset');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Opgeslagen!';
        saveBtn.style.backgroundColor = '#28a745';
        saveBtn.style.color = 'white';
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.backgroundColor = '';
            saveBtn.style.color = '';
        }, 2000);
        
        this.checkCustomPresetAvailable();
        console.log(`Aangepaste preset opgeslagen: ${selectedColumns.length} kolommen`);
    }

    clearCustomPreset() {
        if (confirm('Weet je zeker dat je je aangepaste kolomselectie wilt wissen?')) {
            localStorage.removeItem('csvAnalyzerCustomPreset');
            this.checkCustomPresetAvailable();
            this.showError('Aangepaste preset gewist.');
        }
    }

    checkCustomPresetAvailable() {
        const customBtn = document.getElementById('presetCustom');
        const hasCustomPreset = localStorage.getItem('csvAnalyzerCustomPreset') !== null;
        
        if (hasCustomPreset) {
            customBtn.style.opacity = '1';
            customBtn.style.pointerEvents = 'auto';
            
            // Toon aantal opgeslagen kolommen
            const savedPreset = JSON.parse(localStorage.getItem('csvAnalyzerCustomPreset'));
            customBtn.title = `${savedPreset.length} opgeslagen kolommen`;
        } else {
            customBtn.style.opacity = '0.5';
            customBtn.style.pointerEvents = 'none';
            customBtn.title = 'Geen aangepaste selectie opgeslagen';
        }
    }







    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}Records`).classList.add('active');
    }

    exportToExcel() {
        if (!this.comparisonResults) {
            this.showError('Voer eerst een analyse uit');
            return;
        }

        const wb = XLSX.utils.book_new();
        
        // Summary sheet
        const summaryData = [
            ['Type Wijziging', 'Aantal'],
            ['Nieuwe Records', this.comparisonResults.new.length],
            ['Gewijzigde Records', this.comparisonResults.changed.length],
            ['Verwijderde Records', this.comparisonResults.deleted.length],
            ['Ongewijzigde Records', this.comparisonResults.unchanged]
        ];
        
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Overzicht');
        
        // Data sheets
        if (this.comparisonResults.new.length > 0) {
            const newWs = XLSX.utils.json_to_sheet(this.comparisonResults.new);
            XLSX.utils.book_append_sheet(wb, newWs, 'Nieuwe Records');
        }
        
        if (this.comparisonResults.changed.length > 0) {
            const changedWs = XLSX.utils.json_to_sheet(this.comparisonResults.changed);
            XLSX.utils.book_append_sheet(wb, changedWs, 'Gewijzigde Records');
        }
        
        if (this.comparisonResults.deleted.length > 0) {
            const deletedWs = XLSX.utils.json_to_sheet(this.comparisonResults.deleted);
            XLSX.utils.book_append_sheet(wb, deletedWs, 'Verwijderde Records');
        }
        
        const fileName = `CSV_Analyse_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    exportBaseDataWithTracking() {
        if (!this.baseData) {
            this.showError('Geen basis data geladen');
            return;
        }

        // Verzamel alle tracking data uit de dropdowns
        this.collectTrackingDataFromUI();

        const wb = XLSX.utils.book_new();
        const selectedColumns = this.getSelectedColumns();
        
        // Filter data om alleen geselecteerde kolommen te tonen
        const filteredData = this.baseData.data.map(row => {
            const filteredRow = {};
            selectedColumns.forEach(col => {
                filteredRow[col] = row[col] || '';
            });
            return filteredRow;
        });
        
        const ws = XLSX.utils.json_to_sheet(filteredData);
        XLSX.utils.book_append_sheet(wb, ws, 'Basis Data met Tracking');
        
        const fileName = `Basis_Data_Tracking_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        this.showSuccess('Basis data met tracking informatie geëxporteerd naar Excel');
    }

    collectTrackingDataFromUI() {
        // Verzamel alle waarden uit de tracking dropdowns en update de data
        const dropdowns = document.querySelectorAll('.tracking-dropdown');
        dropdowns.forEach(dropdown => {
            const uniqueId = dropdown.dataset.uniqueId;
            const columnName = dropdown.dataset.column;
            const value = dropdown.value;
            
            if (uniqueId && this.baseData && this.baseData.data) {
                const [nummer, jaar] = uniqueId.split('_');
                const row = this.baseData.data.find(r => r['Nummer'] === nummer && r['Jaar'] === jaar);
                if (row) {
                    row[columnName] = value;
                }
            }
        });
    }

    saveDataWithTracking() {
        if (!this.baseData) {
            this.showError('Geen basis data om op te slaan');
            return;
        }

        // Verzamel eerst alle tracking data uit de UI
        this.collectTrackingDataFromUI();

        // Maak een data object met alle informatie
        const saveData = {
            timestamp: new Date().toISOString(),
            headers: this.baseData.headers,
            data: this.baseData.data,
            selectedColumns: this.getSelectedColumns(),
            trackingColumns: this.getSelectedTrackingColumns()
        };

        // Converteer naar JSON
        const jsonData = JSON.stringify(saveData, null, 2);
        
        // Download als JSON bestand
        const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
        const fileName = `CSV_Data_Tracking_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
        
        if (typeof saveAs !== 'undefined') {
            saveAs(blob, fileName);
        } else {
            // Fallback voor browsers zonder FileSaver.js
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        this.showSuccess('Data met tracking informatie opgeslagen');
    }

    loadDataWithTracking(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const savedData = JSON.parse(e.target.result);
                
                // Valideer de data structuur
                if (!savedData.headers || !savedData.data || !Array.isArray(savedData.data)) {
                    throw new Error('Ongeldig bestandsformaat');
                }
                
                // Herstel de basis data
                this.baseData = {
                    headers: savedData.headers,
                    data: savedData.data
                };
                
                // Update de kolom selectie UI
                this.updateColumnSelection();
                
                // Herstel kolom selecties indien beschikbaar
                if (savedData.selectedColumns) {
                    setTimeout(() => {
                        savedData.selectedColumns.forEach(col => {
                            const checkbox = document.getElementById(`col_${col}`);
                            if (checkbox) checkbox.checked = true;
                        });
                        
                        // Update preview met de juiste selectie
                        this.updatePreview();
                    }, 100);
                }
                
                // Herstel tracking kolom selecties indien beschikbaar
                if (savedData.trackingColumns) {
                    setTimeout(() => {
                        savedData.trackingColumns.forEach(col => {
                            const trackingCheckbox = document.querySelector(`.tracking-columns input[value="${col}"]`);
                            if (trackingCheckbox) trackingCheckbox.checked = true;
                        });
                    }, 100);
                }
                
                // Update tracking headers met percentages na laden
                setTimeout(() => {
                    this.updateTrackingHeaders();
                }, 300);
                
                this.showSuccess(`Data geladen met ${savedData.data.length} rijen (opgeslagen: ${new Date(savedData.timestamp).toLocaleString()})`);
                
            } catch (error) {
                this.showError('Fout bij het laden van bestand: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            this.showError('Fout bij het lezen van bestand');
        };
        
        reader.readAsText(file);
    }

    exportToCSV() {
        if (!this.comparisonResults) {
            this.showError('Voer eerst een analyse uit');
            return;
        }

        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        const data = this.comparisonResults[activeTab];
        
        if (data.length === 0) {
            this.showError('Geen data om te exporteren in de actieve tab');
            return;
        }

        const headers = activeTab === 'deleted' ? this.baseData.headers : this.newData.headers;
        const csvContent = this.arrayToCSV([headers, ...data.map(row => headers.map(h => row[h] || ''))]);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const fileName = `${activeTab}_records_${new Date().toISOString().slice(0, 10)}.csv`;
        saveAs(blob, fileName);
    }

    arrayToCSV(data) {
        return data.map(row => 
            row.map(field => {
                if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            }).join(',')
        ).join('\n');
    }

    printReport() {
        const printContent = this.generatePrintableReport();
        const printWindow = window.open('', '', 'height=600,width=800');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>CSV Analyse Rapport</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1, h2 { color: #667eea; }
                        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .summary { background: #f8f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
    }

    generatePrintableReport() {
        if (!this.comparisonResults) return '';
        
        const timestamp = new Date().toLocaleString('nl-NL');
        
        return `
            <h1>CSV Analyse Rapport</h1>
            <p><strong>Gegenereerd op:</strong> ${timestamp}</p>
            
            <div class="summary">
                <h2>Samenvatting</h2>
                <p><strong>Nieuwe Records:</strong> ${this.comparisonResults.new.length}</p>
                <p><strong>Gewijzigde Records:</strong> ${this.comparisonResults.changed.length}</p>
                <p><strong>Verwijderde Records:</strong> ${this.comparisonResults.deleted.length}</p>
                <p><strong>Ongewijzigde Records:</strong> ${this.comparisonResults.unchanged}</p>
            </div>
            
            ${this.comparisonResults.new.length > 0 ? this.generateTableHTML('Nieuwe Records', this.comparisonResults.new, this.newData.headers) : ''}
            ${this.comparisonResults.changed.length > 0 ? this.generateTableHTML('Gewijzigde Records', this.comparisonResults.changed, this.newData.headers) : ''}
            ${this.comparisonResults.deleted.length > 0 ? this.generateTableHTML('Verwijderde Records', this.comparisonResults.deleted, this.baseData.headers) : ''}
        `;
    }

    generateTableHTML(title, data, headers) {
        let html = `<h2>${title}</h2><table>`;
        
        // Headers
        html += '<thead><tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead>';
        
        // Data
        html += '<tbody>';
        data.slice(0, 50).forEach(row => { // Limit to 50 rows for printing
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${row[header] || ''}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        if (data.length > 50) {
            html += `<p><em>Toont eerste 50 van ${data.length} records</em></p>`;
        }
        
        return html;
    }

    updatePreview() {
        // Toon preview sectie als er data is
        if (this.baseData) {
            document.querySelector('.preview-section').style.display = 'block';
            
            // Toon data search sectie
            const dataSearchSection = document.querySelector('.data-search-section');
            if (dataSearchSection) {
                dataSearchSection.style.display = 'block';
            }
            
            // Update preview info
            const selectedColumns = this.getSelectedColumns();
            const totalColumns = this.baseData.headers.length;
            const baseRows = this.baseData.data.length;
            const newRows = this.newData ? this.newData.data.length : 0;
            
            let infoText = `Basis CSV: ${baseRows} rijen, ${selectedColumns.length}/${totalColumns} kolommen geselecteerd`;
            if (this.newData) {
                infoText += ` | Nieuw CSV: ${newRows} rijen`;
            }
            infoText += ` | Alle rijen worden getoond (gesorteerd op klantnummer)`;
            
            document.getElementById('previewInfo').textContent = infoText;
            
            // Update preview tables
            this.updatePreviewTable('basePreviewTable', this.baseData, selectedColumns);
            
            if (this.newData) {
                this.updatePreviewTable('newPreviewTable', this.newData, selectedColumns);
            }
            
            // Update debug info als zichtbaar
            if (document.getElementById('debugInfo').style.display !== 'none') {
                this.updateDebugInfo();
            }

            // Check Smart Update knop visibility
            this.showSmartUpdateButton();
        }
    }

    updatePreviewTable(tableId, data, columns) {
        const table = document.getElementById(tableId);
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        
        // Clear existing content
        thead.innerHTML = '';
        tbody.innerHTML = '';
        
        if (!data || columns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px; color: #666;">Geen kolommen geselecteerd</td></tr>';
            return;
        }
        
        // Create header
        const headerRow = document.createElement('tr');
        columns.forEach(column => {
            const th = document.createElement('th');
            
            // Voeg class toe voor specifieke kolommen
            if (column.toLowerCase().includes('tussenvoegsel')) {
                th.classList.add('col-tussenvoegsel');
            }
            if (column === 'OWR zinvol') {
                th.classList.add('col-owr-zinvol');
            }
            
            // Voor tracking kolommen, voeg professionele percentage badge toe
            if (this.isTrackingColumn(column) && this.baseData && this.baseData.data) {
                const percentage = this.calculateTrackingPercentage(column);
                const jaCount = this.baseData.data.filter(row => row[column] === 'Ja').length;
                
                // Maak professionele header met badge
                th.innerHTML = this.createTrackingHeaderHTML(column, percentage, jaCount, this.baseData.data.length);
                // Tooltip is nu al in de HTML vervat via createTrackingHeaderHTML
            } else {
                // Gebruik verkorte naam voor weergave, maar behoud volledige naam in tooltip
                const displayName = this.getDisplayColumnName(column);
                th.textContent = displayName;
                th.title = column; // Tooltip toont volledige naam
            }
            
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        
        // Sorteer data op Nummer kolom (klantnummer) van laag naar hoog
        let sortedData = data.headers.includes('Nummer') ? this.sortDataByNumber(data.data) : data.data;
        
        // Create rows (alle rijen voor volledig overzicht)
        for (let i = 0; i < sortedData.length; i++) {
            const row = sortedData[i];
            const tr = document.createElement('tr');
            
            columns.forEach(column => {
                const td = document.createElement('td');
                const value = row[column] || '';
                
                // Voeg class toe voor specifieke kolommen
                if (column.toLowerCase().includes('tussenvoegsel')) {
                    td.classList.add('col-tussenvoegsel');
                }
                if (column === 'OWR zinvol') {
                    td.classList.add('col-owr-zinvol');
                }
                
                // Check of dit een tracking kolom is
                if (this.isTrackingColumn(column)) {
                    // Maak dropdown voor tracking kolommen in preview
                    const dropdown = this.createTrackingDropdown(value, row, column);
                    td.appendChild(dropdown);
                } else {
                    td.textContent = value;
                    td.title = value; // Tooltip voor lange waardes
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        }
    }

    switchPreviewTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.preview-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-preview-tab="${tabName}"]`).classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.preview-tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}Preview`).classList.add('active');
    }

    exportPreview() {
        const activeTab = document.querySelector('.preview-tab-btn.active').dataset.previewTab;
        const data = activeTab === 'base' ? this.baseData : this.newData;
        
        if (!data) {
            this.showError('Geen data beschikbaar om te exporteren');
            return;
        }

        const selectedColumns = this.getSelectedColumns();
        if (selectedColumns.length === 0) {
            this.showError('Selecteer minimaal één kolom om te exporteren');
            return;
        }

        // Sorteer data op Nummer kolom (klantnummer) van laag naar hoog
        let sortedData = data.headers.includes('Nummer') ? this.sortDataByNumber(data.data) : data.data;
        
        // Maak CSV van geselecteerde kolommen
        const csvContent = this.arrayToCSV([
            selectedColumns,
            ...sortedData.map(row => selectedColumns.map(col => row[col] || ''))
        ]);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const fileName = `${activeTab}_preview_${new Date().toISOString().slice(0, 10)}.csv`;
        
        // Voor moderne browsers die FileSaver.js ondersteunen
        if (typeof saveAs !== 'undefined') {
            saveAs(blob, fileName);
        } else {
            // Fallback voor browsers zonder FileSaver.js
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    exportToPDF() {
        const activeTab = document.querySelector('.preview-tab-btn.active').dataset.previewTab;
        const data = activeTab === 'base' ? this.baseData : this.newData;
        
        if (!data) {
            this.showError('Geen data beschikbaar om te exporteren');
            return;
        }

        const selectedColumns = this.getSelectedColumns();
        if (selectedColumns.length === 0) {
            this.showError('Selecteer minimaal één kolom om te exporteren');
            return;
        }

        // Verzamel eerst alle tracking data uit de UI
        this.collectTrackingDataFromUI();

        // Sorteer data op Nummer kolom (klantnummer) van laag naar hoog
        let sortedData = data.headers.includes('Nummer') ? this.sortDataByNumber(data.data) : data.data;
        
        // Maak PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation
        
        // Header informatie
        doc.setFontSize(16);
        doc.text('CSV Data Export', 14, 15);
        
        doc.setFontSize(10);
        doc.text(`Gegenereerd op: ${new Date().toLocaleString()}`, 14, 25);
        doc.text(`Dataset: ${activeTab === 'base' ? 'Basis CSV' : 'Nieuw CSV'}`, 14, 30);
        doc.text(`Aantal records: ${sortedData.length}`, 14, 35);
        
        // Bereid tabel data voor
        const headers = selectedColumns;
        const rows = sortedData.map(row => 
            selectedColumns.map(col => {
                let value = row[col] || '';
                // Limiteer cel lengte voor betere PDF weergave
                return value.toString().length > 30 ? 
                    value.toString().substring(0, 27) + '...' : 
                    value.toString();
            })
        );

        // Configuratie voor autotable
        const tableConfig = {
            head: [headers],
            body: rows,
            startY: 45,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [102, 126, 234],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            },
            columnStyles: {},
            margin: { left: 14, right: 14 }
        };

        // Speciale styling voor tracking kolommen
        const trackingColumns = ['Inventarisatie OWR gemaakt', 'Gegevens compleet', 'Contact met klant opgenomen', 'Opgave OWR ingevuld', 'Afgewerkt'];
        selectedColumns.forEach((col, index) => {
            if (trackingColumns.includes(col)) {
                tableConfig.columnStyles[index] = {
                    fillColor: [232, 244, 253],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                };
            }
        });

        // Genereer tabel
        doc.autoTable(tableConfig);
        
        // Footer met tracking informatie
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(8);
        doc.text('Tracking kolommen zijn gemarkeerd met lichtblauwe achtergrond', 14, finalY);
        
        // Sla PDF op
        const fileName = `CSV_Export_${activeTab}_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.pdf`;
        doc.save(fileName);
        
        this.showSuccess('PDF export voltooid');
    }

    toggleDebugInfo() {
        const debugDiv = document.getElementById('debugInfo');
        const isVisible = debugDiv.style.display !== 'none';
        
        if (isVisible) {
            debugDiv.style.display = 'none';
        } else {
            debugDiv.style.display = 'block';
            this.updateDebugInfo();
        }
    }

    updateDebugInfo() {
        const debugDiv = document.getElementById('debugInfo');
        let debugText = '';
        
        if (this.baseData) {
            debugText += `🔍 Basis CSV: ${this.baseData.headers.length} headers, ${this.baseData.data.length} rows\n`;
            debugText += `📋 Headers: [${this.baseData.headers.slice(0, 5).join(', ')}${this.baseData.headers.length > 5 ? '...' : ''}]\n`;
            
            if (this.baseData.data.length > 0) {
                const firstRow = this.baseData.data[0];
                const sampleData = Object.entries(firstRow).slice(0, 3).map(([k, v]) => `${k}: "${v}"`).join(', ');
                debugText += `📝 Sample data: {${sampleData}}\n`;
            }
        }
        
        if (this.newData) {
            debugText += `🔍 Nieuw CSV: ${this.newData.headers.length} headers, ${this.newData.data.length} rows\n`;
        }
        
        const separator = document.getElementById('separator').value;
        debugText += `🔧 Scheidingsteken: ${separator}`;
        
        debugDiv.innerHTML = debugText.replace(/\n/g, '<br>');
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            const span = errorDiv.querySelector('span');
            if (span) {
                span.textContent = message;
            }
            errorDiv.style.display = 'flex';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        } else {
            console.error('Error message div not found:', message);
        }
    }

    showLoading(show) {
        document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
    }

    flashUpdatedHeader(columnName) {
        const headers = document.querySelectorAll('th');
        
        headers.forEach(header => {
            const trackingHeaderDiv = header.querySelector('.tracking-header');
            if (trackingHeaderDiv) {
                // Gebruik data-full-name attribuut voor exacte match
                const fullName = trackingHeaderDiv.getAttribute('data-full-name');
                if (fullName === columnName) {
                    // Voeg tijdelijke flash animatie toe
                    const badge = header.querySelector('.tracking-percentage');
                    if (badge) {
                        badge.style.transform = 'scale(1.1)';
                        badge.style.transition = 'transform 0.2s ease';
                        
                        setTimeout(() => {
                            badge.style.transform = 'scale(1)';
                        }, 200);
                    }
                }
            }
        });
    }

    showSmartUpdateButton() {
        // Toon de Smart Update knop als er data EN tracking kolommen zijn
        const hasBaseData = this.baseData && this.baseData.data && this.baseData.data.length > 0;
        const hasTrackingColumns = this.hasTrackingColumns();
        const shouldShow = hasBaseData && hasTrackingColumns;
        const smartUpdateBtn = document.getElementById('smartUpdateCSV');
        
        console.log(`🔍 Checking Smart Update button:`);
        console.log(`  - Has base data: ${hasBaseData}`);
        console.log(`  - Has tracking columns: ${hasTrackingColumns}`);
        console.log(`  - Should show: ${shouldShow}`);
        console.log(`  - Button element found: ${!!smartUpdateBtn}`);
        
        if (smartUpdateBtn) {
            smartUpdateBtn.style.display = shouldShow ? 'flex' : 'none';
            console.log(`  - Button display set to: ${shouldShow ? 'flex' : 'none'}`);
        } else {
            console.log(`  - ❌ Smart Update button element not found!`);
        }
    }

    hasTrackingColumns() {
        // Check of er tracking kolommen zijn toegevoegd aan de data
        if (!this.baseData || !this.baseData.headers) {
            console.log(`  - No baseData or headers available`);
            return false;
        }
        
        const trackingColumns = ['Inventarisatie OWR gemaakt', 'OWR zinvol', 'Gegevens compleet', 'Contact met klant opgenomen', 'Opgave OWR ingevuld', 'Afgewerkt'];
        
        console.log(`  - Current headers:`, this.baseData.headers);
        console.log(`  - Looking for tracking columns:`, trackingColumns);
        
        // Check of er minstens één tracking kolom aanwezig is in de headers
        const foundColumns = trackingColumns.filter(col => this.baseData.headers.includes(col));
        console.log(`  - Found tracking columns:`, foundColumns);
        
        const hasColumns = foundColumns.length > 0;
        console.log(`  - Tracking columns present: ${hasColumns}`);
        
        // TEMP FIX: Als er tracking data wordt berekend maar headers kloppen niet, force true
        if (!hasColumns && this.baseData.data && this.baseData.data.length > 0) {
            const firstRow = this.baseData.data[0];
            const hasTrackingData = trackingColumns.some(col => col in firstRow);
            if (hasTrackingData) {
                console.log(`  - ⚠️  TEMP FIX: Found tracking columns in data, forcing TRUE`);
                return true;
            }
        }
        
        return hasColumns;
    }

    hasTrackingData() {
        if (!this.baseData || !this.baseData.data) {
            console.log(`  - No baseData available`);
            return false;
        }
        
        const trackingColumns = ['Inventarisatie OWR gemaakt', 'OWR zinvol', 'Gegevens compleet', 'Contact met klant opgenomen', 'Opgave OWR ingevuld', 'Afgewerkt'];
        
        let foundTrackingData = false;
        let filledCount = 0;
        
        for (const row of this.baseData.data) {
            for (const col of trackingColumns) {
                if (row[col] && row[col] !== '') {
                    filledCount++;
                    foundTrackingData = true;
                    break; // Found data in this row, move to next row
                }
            }
        }
        
        console.log(`  - Tracking columns found with data: ${filledCount} records`);
        return foundTrackingData;
    }

    // Test functie voor de browser console
    testSmartUpdate() {
        console.log('🧪 Testing Smart Update functionality...');
        this.showSmartUpdateButton();
        
        // Force toon de knop voor test doeleinden
        const smartUpdateBtn = document.getElementById('smartUpdateCSV');
        if (smartUpdateBtn) {
            smartUpdateBtn.style.display = 'flex';
            console.log('✅ Forced Smart Update button to show for testing');
        }
    }

    async smartUpdateCSV(file) {
        try {
            console.log('🔄 Starting Smart CSV Update...');
            
            // Bewaar huidige kolom selectie
            const selectedColumns = this.getSelectedColumns();
            console.log(`💾 Saving current column selection: ${selectedColumns.length} columns`);
            
            // Bewaar huidige tracking data
            const currentTrackingData = this.extractTrackingData();
            console.log(`💾 Extracted tracking data for ${Object.keys(currentTrackingData).length} records`);
            
            // Laad het nieuwe CSV bestand
            const text = await this.readFileAsText(file);
            const newCsvData = this.parseCSV(text);
            console.log(`📊 New CSV loaded: ${newCsvData.data.length} records`);
            
            // Merge tracking data met nieuwe CSV
            const mergedData = this.mergeTrackingData(newCsvData, currentTrackingData);
            console.log(`🔗 Merged data: ${mergedData.preserved} preserved, ${mergedData.new} new records`);
            
            // Update baseData met merged resultaat
            this.baseData = newCsvData;
            
            // Update UI
            this.displayFileInfo('baseCSVInfo', file, newCsvData);
            this.updateColumnSelection();
            
            // Herstel kolom selectie
            setTimeout(() => {
                selectedColumns.forEach(col => {
                    const checkbox = document.getElementById(`col_${col}`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
                
                // Update preview met herstelde selectie
                this.updatePreview();
                console.log(`✅ Restored column selection: ${selectedColumns.length} columns`);
            }, 100);
            
            // Toon resultaat melding
            this.showSuccess(`✅ Smart Update voltooid! ${mergedData.preserved} tracking records behouden, ${mergedData.new} nieuwe records toegevoegd.`);
            
        } catch (error) {
            console.error('Smart Update Error:', error);
            this.showError(`Fout bij Smart Update: ${error.message}`);
        }
    }

    extractTrackingData() {
        const trackingData = {};
        if (!this.baseData || !this.baseData.data) return trackingData;
        
        const trackingColumns = ['Inventarisatie OWR gemaakt', 'OWR zinvol', 'Gegevens compleet', 'Contact met klant opgenomen', 'Opgave OWR ingevuld', 'Afgewerkt'];
        
        this.baseData.data.forEach(row => {
            const uniqueId = `${row['Nummer']}_${row['Jaar']}`;
            const trackingInfo = {};
            
            trackingColumns.forEach(col => {
                if (row[col]) {
                    trackingInfo[col] = row[col];
                }
            });
            
            if (Object.keys(trackingInfo).length > 0) {
                trackingData[uniqueId] = trackingInfo;
            }
        });
        
        return trackingData;
    }

    mergeTrackingData(newCsvData, trackingData) {
        let preservedCount = 0;
        let newCount = 0;
        
        const trackingColumns = ['Inventarisatie OWR gemaakt', 'OWR zinvol', 'Gegevens compleet', 'Contact met klant opgenomen', 'Opgave OWR ingevuld', 'Afgewerkt'];
        
        // Voeg tracking kolommen toe aan headers als ze er nog niet zijn
        trackingColumns.forEach(col => {
            if (!newCsvData.headers.includes(col)) {
                newCsvData.headers.push(col);
            }
        });
        
        // Merge tracking data
        newCsvData.data.forEach(row => {
            const uniqueId = `${row['Nummer']}_${row['Jaar']}`;
            
            if (trackingData[uniqueId]) {
                // Bestaande record: overschrijf met tracking data
                Object.assign(row, trackingData[uniqueId]);
                preservedCount++;
                console.log(`✅ Preserved tracking for ${uniqueId}`);
            } else {
                // Nieuwe record: initialiseer lege tracking kolommen
                trackingColumns.forEach(col => {
                    row[col] = '';
                });
                newCount++;
            }
        });
        
        return { preserved: preservedCount, new: newCount };
    }

    setupColumnSearch() {
        const searchInput = document.getElementById('columnSearch');
        const clearButton = document.getElementById('clearSearch');
        
        if (!searchInput || !clearButton) return;

        // Search input event listener
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            this.filterColumns(searchTerm);
            
            // Toon/verberg clear button
            if (searchTerm) {
                clearButton.classList.add('show');
            } else {
                clearButton.classList.remove('show');
            }
        });

        // Clear button event listener
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            this.filterColumns('');
            clearButton.classList.remove('show');
            searchInput.focus();
        });

        // Enter key om search te clearen als er geen resultaten zijn
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.filterColumns('');
                clearButton.classList.remove('show');
            }
        });
    }

    filterColumns(searchTerm) {
        const columnCheckboxes = document.querySelectorAll('.column-checkbox');
        let visibleCount = 0;
        let matchCount = 0;

        columnCheckboxes.forEach(checkboxDiv => {
            const checkbox = checkboxDiv.querySelector('input[type="checkbox"]');
            if (!checkbox) return;

            const columnName = checkbox.value.toLowerCase();
            const labelText = checkboxDiv.textContent.toLowerCase();
            
            // Check if search term matches column name or label
            const matches = !searchTerm || 
                           columnName.includes(searchTerm) || 
                           labelText.includes(searchTerm);

            if (matches) {
                checkboxDiv.classList.remove('hidden');
                checkboxDiv.classList.remove('highlight');
                visibleCount++;
                
                // Highlight exact matches
                if (searchTerm && (columnName.includes(searchTerm) || labelText.includes(searchTerm))) {
                    checkboxDiv.classList.add('highlight');
                    matchCount++;
                }
            } else {
                checkboxDiv.classList.add('hidden');
                checkboxDiv.classList.remove('highlight');
            }
        });

        // Update search status
        this.updateSearchStatus(searchTerm, visibleCount, matchCount);
    }

    updateSearchStatus(searchTerm, visibleCount, matchCount) {
        // Verwijder bestaande status als die er is
        const existingStatus = document.querySelector('.search-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        if (!searchTerm) return;

        // Voeg nieuwe status toe
        const searchBox = document.querySelector('.search-box');
        const statusDiv = document.createElement('div');
        statusDiv.className = 'search-status';
        
        if (visibleCount === 0) {
            statusDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Geen kolommen gevonden voor "${searchTerm}"`;
            statusDiv.style.color = '#e74c3c';
        } else {
            statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${visibleCount} kolom${visibleCount === 1 ? '' : 'men'} gevonden`;
            statusDiv.style.color = '#27ae60';
        }
        
        statusDiv.style.fontSize = '0.8rem';
        statusDiv.style.marginTop = '8px';
        statusDiv.style.display = 'flex';
        statusDiv.style.alignItems = 'center';
        statusDiv.style.gap = '5px';
        
        searchBox.parentNode.appendChild(statusDiv);
    }

    setupDataSearch() {
        const dataSearchInput = document.getElementById('dataSearch');
        const clearDataButton = document.getElementById('clearDataSearch');
        
        if (!dataSearchInput || !clearDataButton) return;

        // Search input event listener
        dataSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            this.filterTableRows(searchTerm);
            
            // Toon/verberg clear button
            if (searchTerm) {
                clearDataButton.classList.add('show');
            } else {
                clearDataButton.classList.remove('show');
            }
        });

        // Clear button event listener
        clearDataButton.addEventListener('click', () => {
            dataSearchInput.value = '';
            this.filterTableRows('');
            clearDataButton.classList.remove('show');
            dataSearchInput.focus();
        });

        // Keyboard shortcuts
        dataSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dataSearchInput.value = '';
                this.filterTableRows('');
                clearDataButton.classList.remove('show');
            }
        });
    }

    filterTableRows(searchTerm) {
        const baseTable = document.getElementById('basePreviewTable');
        if (!baseTable) return;

        const rows = baseTable.querySelectorAll('tbody tr');
        let visibleCount = 0;
        let totalCount = rows.length;

        rows.forEach(row => {
            if (!searchTerm) {
                // Geen zoekterm: toon alle rijen
                row.classList.remove('hidden-by-search', 'highlight-match');
                visibleCount++;
                return;
            }

            // Zoek in alle cellen van de rij
            const cells = row.querySelectorAll('td');
            let rowMatches = false;
            let hasHighlight = false;

            cells.forEach(cell => {
                const cellText = cell.textContent.toLowerCase();
                if (cellText.includes(searchTerm)) {
                    rowMatches = true;
                    
                    // Highlight de cel met match
                    if (cellText.includes(searchTerm)) {
                        hasHighlight = true;
                    }
                }
            });

            if (rowMatches) {
                row.classList.remove('hidden-by-search');
                if (hasHighlight) {
                    row.classList.add('highlight-match');
                }
                visibleCount++;
            } else {
                row.classList.add('hidden-by-search');
                row.classList.remove('highlight-match');
            }
        });

        // Update search statistics
        this.updateDataSearchStats(searchTerm, visibleCount, totalCount);

        // Filter ook de nieuwe CSV tabel als die er is
        const newTable = document.getElementById('newPreviewTable');
        if (newTable) {
            this.filterSecondaryTable(newTable, searchTerm);
        }
    }

    filterSecondaryTable(table, searchTerm) {
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            if (!searchTerm) {
                row.classList.remove('hidden-by-search', 'highlight-match');
                return;
            }

            const cells = row.querySelectorAll('td');
            let rowMatches = false;

            cells.forEach(cell => {
                const cellText = cell.textContent.toLowerCase();
                if (cellText.includes(searchTerm)) {
                    rowMatches = true;
                }
            });

            if (rowMatches) {
                row.classList.remove('hidden-by-search');
                row.classList.add('highlight-match');
            } else {
                row.classList.add('hidden-by-search');
                row.classList.remove('highlight-match');
            }
        });
    }

    updateDataSearchStats(searchTerm, visibleCount, totalCount) {
        const searchStats = document.getElementById('searchStats');
        if (!searchStats) return;

        if (!searchTerm) {
            searchStats.textContent = `📊 ${totalCount} klanten`;
            searchStats.style.color = '#666';
        } else if (visibleCount === 0) {
            searchStats.textContent = `❌ Geen resultaten`;
            searchStats.style.color = '#e74c3c';
        } else if (visibleCount === totalCount) {
            searchStats.textContent = `✅ Alle ${totalCount} klanten`;
            searchStats.style.color = '#27ae60';
        } else {
            searchStats.textContent = `🔍 ${visibleCount}/${totalCount} klanten`;
            searchStats.style.color = '#667eea';
        }
    }
}

// Application initialization moved to js/init.js

// Application initialization moved to js/init.js
