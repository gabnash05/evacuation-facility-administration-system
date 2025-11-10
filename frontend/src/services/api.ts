import axios from "axios";

// Use environment variable if set, otherwise use relative path for production
// When served from backend, relative paths will work since both are on same domain
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
    timeout: 10000,
    withCredentials: true,
});

// Add request interceptor to ensure Authorization header is set for all requests
api.interceptors.request.use(
    (config) => {
        // Try to get token from cookie
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
        if (tokenCookie) {
            const token = tokenCookie.split('=')[1];
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        const { status } = error.response || {};
        const currentPath = window.location.pathname;

        switch (status) {
            case 401:
                // Unauthorized - redirect to login
                if (!currentPath.includes("/login")) {
                    window.location.assign("/login");
                }
                break;
            case 403:
                // Forbidden - user doesn't have permission
                console.warn("Access forbidden for this resource");
                break;
            case 500:
                // Server error - could show maintenance message
                console.error("Server error occurred");
                break;
            case 502:
            case 503:
                // Service unavailable
                console.error("Service temporarily unavailable");
                break;
            default:
                // Network errors or other issues
                if (!navigator.onLine) {
                    console.error("Network connection lost");
                }
        }

        return Promise.reject(error);
    }
);

export const handleApiError = (error: any): string => {
    // Network errors
    if (!error.response) {
        return "Unable to connect to server. Please check your internet connection.";
    }

    const { status, data } = error.response;

    // Use server message if available
    if (data?.message) {
        return data.message;
    }

    // Fallback messages based on status codes
    const errorMessages: Record<number, string> = {
        400: "Invalid request. Please check your input.",
        401: "Session expired. Please log in again.",
        403: "You do not have permission to perform this action.",
        404: "The requested resource was not found.",
        409: "This resource already exists.",
        422: "Validation error. Please check your input.",
        500: "Server error. Please try again later.",
        502: "Service temporarily unavailable.",
        503: "Service undergoing maintenance.",
    };

    return errorMessages[status] || "An unexpected error occurred.";
};
