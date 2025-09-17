/**
 * Updated showSearch function and navigation integration
 * Replace the existing placeholder function with this implementation
 */

// Enhanced showSearch function that redirects to the search page
function showSearch() {
    // Check if we're already on the search page
    if (window.location.pathname.includes('search.html')) {
        // Focus the search input if already on search page
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
        return;
    }
    
    // Navigate to search page
    window.location.href = 'search.html';
}

// Alternative function for searching with a specific query
function searchWithQuery(query) {
    if (query && query.trim()) {
        // Navigate to search page with query parameter
        window.location.href = `search.html?q=${encodeURIComponent(query.trim())}`;
    } else {
        showSearch();
    }
}

// Function to add search functionality to existing navigation
function enhanceSearchNavigation() {
    // Find all search links and update them
    const searchLinks = document.querySelectorAll('a[href="#"], .search-link, [onclick*="showSearch"]');
    
    searchLinks.forEach(link => {
        // Remove existing onclick handlers
        link.removeAttribute('onclick');
        
        // Update href to point to search page
        link.href = 'search.html';
        
        // Ensure proper navigation
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showSearch();
        });
    });
    
    // Add keyboard shortcut for search (/ key)
    document.addEventListener('keydown', function(e) {
        // Only trigger if not typing in an input field
        if (e.key === '/' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            showSearch();
        }
    });
}

// Function to show search suggestions in a dropdown
function showSearchSuggestions(inputElement, suggestions) {
    // Remove existing suggestions
    const existingSuggestions = document.querySelector('.search-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    if (!suggestions || suggestions.length === 0) {
        return;
    }
    
    // Create suggestions dropdown
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
    `;
    
    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.style.cssText = `
            padding: 0.75rem;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
            transition: background-color 0.2s;
        `;
        item.textContent = suggestion;
        
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f3f4f6';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'white';
        });
        
        item.addEventListener('click', () => {
            searchWithQuery(suggestion);
        });
        
        suggestionsContainer.appendChild(item);
    });
    
    // Position relative to input
    const inputRect = inputElement.getBoundingClientRect();
    inputElement.parentNode.style.position = 'relative';
    inputElement.parentNode.appendChild(suggestionsContainer);
}

// Enhanced MobileProblemApp class extension for search
if (typeof MobileProblemApp !== 'undefined') {
    // Extend the existing MobileProblemApp with search functionality
    const originalInit = MobileProblemApp.prototype.init || function() {};
    
    MobileProblemApp.prototype.init = function() {
        // Call original init if it exists
        originalInit.call(this);
        
        // Add search enhancements
        this.initSearchFunctionality();
    };
    
    MobileProblemApp.prototype.initSearchFunctionality = function() {
        // Enhance navigation
        enhanceSearchNavigation();
        
        // Add search functionality to any existing search inputs
        const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
        searchInputs.forEach(input => {
            this.enhanceSearchInput(input);
        });
    };
    
    MobileProblemApp.prototype.enhanceSearchInput = function(input) {
        let debounceTimer;
        
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (query.length >= 2) {
                    // Simulate getting suggestions (replace with actual API call)
                    const mockSuggestions = [
                        '二次方程式',
                        '現在完了',
                        '有機化学',
                        '力学'
                    ].filter(s => s.includes(query));
                    
                    showSearchSuggestions(input, mockSuggestions);
                } else {
                    // Remove suggestions
                    const suggestions = document.querySelector('.search-suggestions');
                    if (suggestions) {
                        suggestions.remove();
                    }
                }
            }, 300);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchWithQuery(input.value);
            }
        });
    };
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceSearchNavigation);
} else {
    enhanceSearchNavigation();
}

// Export functions for global use
window.showSearch = showSearch;
window.searchWithQuery = searchWithQuery;
window.enhanceSearchNavigation = enhanceSearchNavigation;