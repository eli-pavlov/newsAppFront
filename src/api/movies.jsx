import axios from 'axios';
import { getEnvVariable } from '../utils/env';
import { getCookie } from '../utils/cookies';

const serverUrl = getEnvVariable("SERVER_URL") || window.location.origin;
const AUTH_USER = 'authuser';

// Create an axios instance for API calls that require authentication
const authApi = axios.create({
    baseURL: serverUrl,
});

// Add a request interceptor to automatically attach the auth token
authApi.interceptors.request.use(config => {
    const token = getCookie(AUTH_USER);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
    }
    return config;
}, error => {
    return Promise.reject(error);
});

/**
 * Requests a presigned URL for uploading a file.
 * @param {string} fileName - The name of the file.
 * @param {string} fileType - The MIME type of the file.
 * @param {string|null} subFolder - The subfolder for the upload (e.g., user ID).
 * @returns {Promise<object>} The API response.
 */
export const getPresignedUrl = async (fileName, fileType, subFolder = null) => {
    try {
        const response = await authApi.post("/files/presign", { fileName, contentType: fileType, subFolder });
        return response.data;
    } catch (e) {
        return { success: false, message: e.message };
    }
};

/**
 * Notifies the backend that the upload to S3 is complete.
 * @param {string} fileName - The name of the file.
 * @param {string|null} subFolder - The subfolder where the file was uploaded.
 * @returns {Promise<object>} The API response.
 */
export const finalizeUpload = async (fileName, subFolder = null) => {
    try {
        const response = await authApi.post("/files/finalize", { fileName, subFolder });
        return response.data;
    } catch (e) {
        return { success: false, message: e.message };
    }
};

/**
 * Requests a presigned URL for deleting a file.
 * @param {string} fileName - The name of the file to delete.
 * @param {string} subFolder - The subfolder where the file is located.
 * @returns {Promise<object>} The API response.
 */
export const getPresignedDeleteUrl = async (fileName, subFolder) => {
    try {
        const response = await authApi.post("/files/delete-presign", { fileName, subFolder });
        return response.data;
    } catch (e) {
        return { success: false, message: e.message };
    }
};

/**
 * Notifies the backend that the file deletion from S3 is complete.
 * @param {string} fileName - The name of the deleted file.
 * @param {string} subFolder - The subfolder from which the file was deleted.
 * @returns {Promise<object>} The API response.
 */
export const finalizeDelete = async (fileName, subFolder) => {
    try {
        const response = await authApi.post("/files/finalize-delete", { fileName, subFolder });
        return response.data;
    } catch (e) {
        return { success: false, message: e.message };
    }
};