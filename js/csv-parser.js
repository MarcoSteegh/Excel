/**
 * CSV Parser Module
 * Handles CSV file reading, parsing, and validation
 */

class CSVParser {
    constructor() {
        this.supportedEncodings = ['UTF-8', 'ISO-8859-1', 'Windows-1252'];
        this.supportedSeparators = [',', ';', '\t', '|'];
    }

    /**
     * Read file as text with specified encoding
     */
    readFileAsText(file, encoding = 'UTF-8') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Kon bestand niet lezen'));
            reader.readAsText(file, encoding);
        });
    }

    /**
     * Parse CSV text into structured data
     */
    parseCSV(text, separator = 'auto') {
        const lines = text.trim().split('\n');
        
        if (lines.length < 1) {
            throw new Error('CSV bestand is leeg');
        }

        // Auto-detect separator if needed
        if (!separator || separator === 'auto') {
            separator = this.detectSeparator(lines[0]);
            console.log(`Automatisch gedetecteerd scheidingsteken: "${separator}"`);
        }

        if (lines.length < 2) {
            console.warn('CSV bestand bevat alleen headers, geen data rijen');
        }

        const headers = this.parseLine(lines[0], separator);
        const data = [];

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

    /**
     * Detect CSV separator from first line
     */
    detectSeparator(firstLine) {
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
        
        return maxCount > 0 ? detectedSep : ',';
    }

    /**
     * Parse a CSV line respecting quotes
     */
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

    /**
     * Convert array data to CSV string
     */
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

    /**
     * Validate CSV data structure
     */
    validateCSV(data) {
        if (!data || !data.headers || !data.data) {
            return { valid: false, error: 'Ongeldige CSV structuur' };
        }

        if (data.headers.length === 0) {
            return { valid: false, error: 'Geen headers gevonden' };
        }

        if (data.data.length === 0) {
            return { valid: false, error: 'Geen data rijen gevonden' };
        }

        return { valid: true };
    }
}

// Export for use in other modules
window.CSVParser = CSVParser;
