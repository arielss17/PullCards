/**
 * ApiClient - Centralized HTTP requests for PullCards
 * Ensures standard headers (like auth) and uniform error handling.
 */
const ApiClient = (() => {
    const getHeaders = (customHeaders = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...customHeaders
        };

        // Auto-inject admin/user auth if AuthManager is present
        if (typeof AuthManager !== 'undefined') {
            const user = AuthManager.getUser();
            if (user && user.email) {
                headers['x-user-email'] = user.email;
            }
        }
        return headers;
    };

    const request = async (endpoint, method = 'GET', body = null, customHeaders = {}) => {
        const options = {
            method,
            headers: getHeaders(customHeaders)
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(endpoint, options);
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await response.json() : null;

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data?.error || response.statusText,
                    data
                };
            }

            return data;
        } catch (error) {
            console.error(`[ApiClient] Error in ${method} ${endpoint}:`, error);
            throw error;
        }
    };

    return {
        get: (endpoint, headers) => request(endpoint, 'GET', null, headers),
        post: (endpoint, body, headers) => request(endpoint, 'POST', body, headers),
        put: (endpoint, body, headers) => request(endpoint, 'PUT', body, headers),
        delete: (endpoint, headers) => request(endpoint, 'DELETE', null, headers),
        // Helper specifically for legacy fetching that just wants the raw response object
        rawFetch: fetch
    };
})();
