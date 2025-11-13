/**
 * Application Initialization
 * Bootstraps the CSV Analyzer and Year Management system
 */

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing CSV Analyzer Application...');
    
    // Initialize main CSV analyzer
    window.csvAnalyzer = new CSVAnalyzer();
    console.log('✅ CSV Analyzer initialized');
    
    // Initialize Year Management system
    if (typeof YearManager !== 'undefined' && typeof YearUI !== 'undefined') {
        window.yearManager = new YearManager();
        window.yearUI = new YearUI(window.yearManager, window.csvAnalyzer);
        
        // Initialize year UI components
        window.yearUI.init();
        
        // Load previously stored year files
        const storedYears = window.yearManager.loadStoredYears();
        
        // Update UI with loaded years
        window.yearUI.updateYearOverview();
        window.yearUI.updateYearSelector();
        
        console.log('✅ Year management system initialized');
        console.log('📅 Available years:', window.yearManager.getAvailableYears());
        
        if (storedYears.length > 0) {
            console.log(`📂 Loaded ${storedYears.length} year file(s) from storage`);
        }
    } else {
        console.warn('⚠️ Year management modules not loaded');
        console.log('ℹ️ Application running in basic mode without year management');
    }
    
    console.log('✅ Application initialization complete');
});
