const API_BASE_URL = 'https://flatmate-node-backend.onrender.com';

/**
 * @param {string} endpoint 
 * @param {object} options - Fetch options.
 * @returns {Promise<Response>}
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
        },
        credentials: 'include', // Important for cross-origin cookies
    };

    if (options.body && typeof options.body === 'string') {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }

    const finalHeaders = { ...defaultOptions.headers, ...(options.headers || {}) };
    
    // If sending FormData, let browser set Content-Type (delete if exists in default)
    if (options.body instanceof FormData) {
        delete finalHeaders['Content-Type'];
    }

    const finalOptions = { 
        ...defaultOptions, 
        ...options, 
        headers: finalHeaders 
    };

    return fetch(url, finalOptions);
}

window.apiFetch = apiFetch;
window.API_BASE_URL = API_BASE_URL;
