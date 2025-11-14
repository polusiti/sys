#!/usr/bin/env node

// Simple test for unified API client
import('./js/core/unified-api-client.js').then(module => {
    const { UnifiedAPIClient } = module;

    console.log('Testing UnifiedAPIClient...');

    // Create client instance
    const apiClient = new UnifiedAPIClient();

    console.log('API Base URL:', apiClient.apiBaseUrl);
    console.log('Endpoints:', Object.keys(apiClient.endpoints));

    // Test health check method if it exists
    if (typeof apiClient.healthCheck === 'function') {
        console.log('Testing health check...');
        apiClient.healthCheck()
            .then(result => {
                console.log('Health check result:', result);
            })
            .catch(error => {
                console.log('Health check error:', error.message);
            });
    } else {
        console.log('Health check method not found');
    }

    console.log('UnifiedAPIClient test completed.');
}).catch(error => {
    console.error('Error importing UnifiedAPIClient:', error);
});