import axios from "axios";
import Cookies from "js-cookie";
import { logout } from "./helper.js";
import { handleToast } from "./helper.js"; // Assuming this exists in the helper file

// Create an axios instance
const instance = axios.create({
    baseURL: "", // Base URL for your API
    timeout: 100000, // Request timeout
    headers: {
        "Content-Type": "application/json",
    },
});

// Function to get token from cookies
const getTokenFromCookies = () => {
    return Cookies.get("token");
};

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        const token = getTokenFromCookies();

        if (token) {
            config.headers = config.headers || {};
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        config.headers["Content-Type"] = "application/json";
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
instance.interceptors.response.use(
    (response) => {
        if (response.data?.message) {
            handleToast({ res: { message: response.data.message } });
        }
        return response;
    },
    (error) => {
        if (error.response) {
            const { status } = error.response;

            if (status === 401) {
                logout();
                window.location.href = "/login";
                return Promise.reject(error);
            }

            console.error("Error response:", error.response);
        } else {
            console.error("Error message:", error.message);
            handleToast({
                err: { response: { data: { message: error.message } } },
            });
        }

        return Promise.reject(error);
    }
);

export default instance;
