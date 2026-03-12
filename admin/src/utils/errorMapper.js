/**
 * Centralized error mapping for Admin Portal to hide raw backend messages.
 */

export const getFriendlyErrorMessage = (error, defaultMsg = "An unexpected error occurred") => {
    const detail = error?.response?.data?.detail;
    const status = error?.response?.status;
    const message = error?.message;

    if (detail) {
        const detailStr = String(detail).toLowerCase();

        // Auth & Permissions
        if (status === 401) return "Session expired. Please log in again.";
        if (status === 403) {
            if (detailStr.includes("permission") || detailStr.includes("not authorized")) {
                return "Access Denied: You do not have permissions for this action.";
            }
            return "Action forbidden. Please contact the system owner.";
        }

        // Employee Management
        if (detailStr.includes("already exists")) return "Record already exists (email or ID).";
        if (detailStr.includes("empty file") || detailStr.includes("invalid csv")) {
            return "The uploaded file is empty or invalid. Please use the provided template.";
        }
        if (detailStr.includes("manager not found")) return "Assigned manager could not be found in the system.";

        // Field tracking
        if (detailStr.includes("no pings found")) return "No location history available for this employee in the selected range.";

        // General
        if (detailStr.includes("database") || detailStr.includes("server error")) {
            return "Server is currently busy. Please try again in 1 minute.";
        }

        // Return detail if it looks safe/short, otherwise default
        if (detailStr.length < 60 && !detailStr.includes("error") && !detailStr.includes("exception")) {
            return String(detail);
        }
    }

    if (message === "Network Error") return "Network failure. Please check your connection to the server.";
    if (message?.includes("timeout")) return "Request timed out. The server might be under heavy load.";

    return defaultMsg;
};
