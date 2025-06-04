import cookie from "js-cookie";
import { toast } from "react-toastify";

// Set cookie
export const setCookie = (key, value) => {
    if (typeof window !== "undefined") {
        cookie.set(key, value, {
            expires: 1,
        });
    }
};

// Remove cookie
export const removeCookie = (key) => {
    if (typeof window !== "undefined") {
        cookie.remove(key);
    }
};

// Get cookie (from browser)
export const getCookie = (key) => {
    return getCookieFromBrowser(key);
};

export const getCookieFromBrowser = (key) => {
    return cookie.get(key);
};

// Get cookie from server-side
export const getCookieFromServer = (key, req) => {
    if (!req.headers.cookie) {
        return undefined;
    }
    const token = req.headers.cookie
        .split(";")
        .find((c) => c.trim().startsWith(`${key}=`));
    if (!token) {
        return undefined;
    }
    const tokenValue = token.split("=")[1];
    return tokenValue;
};

// Set localStorage
export const setLocalStorage = (key, value) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

// Get localStorage
export const getLocalStorage = (key) => {
    if (typeof window !== "undefined") {
        if (localStorage.getItem(key)) {
            return JSON.parse(localStorage.getItem(key));
        } else {
            return false;
        }
    }
};

// Remove localStorage
export const removeLocalStorage = (key) => {
    if (typeof window !== "undefined") {
        localStorage.removeItem(key);
    }
};

// Authenticate user
export const authenticate = (response, next) => {
    setCookie("accessToken", response?.accessToken);
    setLocalStorage("accessToken", response?.accessToken);
    if (typeof next === "function") next();
};

// Check if user is authenticated
export const isAuth = () => {
    if (typeof window !== "undefined") {
        const cookieChecked = getCookie("accessToken");
        const isLoggedInYN = getCookie("isLoggedInYN");
        if (cookieChecked && isLoggedInYN === "true") {
            return true;
        } else {
            logout();
            return false;
        }
    }
};

// Logout user
export const logout = () => {
    removeCookie("accessToken");
    removeLocalStorage("accessToken");
};

// Update user
export const updateUser = (user, next) => {
    if (typeof window !== "undefined") {
        if (localStorage.getItem("user")) {
            localStorage.setItem("user", JSON.stringify(user));
            if (typeof next === "function") next();
        }
    }
};

// Get base URL based on type
export const getBaseUrl = (caseType) => {
    switch (caseType) {
        case "common":
            return process.env.NEXT_PUBLIC_COMMON_BASE_URL;
        default:
            return process.env.NEXT_PUBLIC_COMMON_BASE_URL;
    }
};

// Handle toast notifications
export const handleToast = ({ res, err, next }) => {
    if (res) {
        toast.success(res.message || "Operation successful!");
        if (typeof next === "function") next();
    } else if (err) {
        if (err.response?.status === 422) {
            const validationErrors = err.response.data?.errors || {};
            const errorMessages = Object.values(validationErrors).flat();
            errorMessages.forEach((message) => toast.error(message));
        } else {
            toast.error(
                err.response?.data?.message || "Something went wrong. Please try again."
            );
        }
    }
};
