import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Validate environment variable
if (!API_BASE_URL) {
    console.warn("VITE_API_BASE_URL is not set. Using relative paths.");
}

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
    withCredentials: true,
});

// Response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        const { status } = error.response || {};

        switch (status) {
            case 401:
                // Unauthorized - redirect to login
                window.location.assign("/login");
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
