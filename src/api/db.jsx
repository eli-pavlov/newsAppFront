import axios from "axios";
import { getEnvVariable } from "../utils/env.jsx"; // Correctly imports the function
import { AUTH_USER, getCookie } from "../utils/cookies.js";
import { defaultSettings as getDefaultSettings } from "../utils/settings.jsx";

class Server {
    constructor() {
        this.serverUrl = getEnvVariable("SERVER_URL") || window.location.origin;
        this.axios = axios.create({
            validateStatus: () => true
        });
    }

    async _createFetch(path, method, data = null, withAuth = false, headers = null, isJson = true, onUploadProgress = null) {
        const url = `${this.serverUrl}${path}`;
        
        if (!headers) {
            headers = { "Content-Type": "application/json" };
        }

        if (withAuth) {
            const token = getCookie(AUTH_USER);
            if(token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        let config = { url, method };

        if (Object.keys(headers).length > 0) config.headers = headers;
        if (data) config.data = isJson ? JSON.stringify(data) : data;
        if (onUploadProgress) config.onUploadProgress = onUploadProgress;

        try {
            const response = await this.axios(config);
            return response.data;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // --- START: PRE-SIGNED URL METHODS ---

    async _generateUploadUrl(fileName, contentType) {
        return await this._createFetch('/files/generate-presigned-url', 'post', { fileName, contentType }, true);
    }
    
    async _finalizeUpload(objectKey, fileName, contentType) {
        return await this._createFetch('/files/finalize-upload', 'post', { objectKey, fileName, contentType }, true);
    }

    async uploadFileWithPresignedUrl(file, onUploadProgress) {
        try {
            onUploadProgress(5);
            const presignResponse = await this._generateUploadUrl(file.name, file.type);
            if (!presignResponse.success) {
                throw new Error(presignResponse.message || "Could not get an upload URL.");
            }
            const { uploadUrl, objectKey } = presignResponse;
            onUploadProgress(10);

            await axios.put(uploadUrl, file, {
                headers: { 'Content-Type': file.type },
                onUploadProgress: progressEvent => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onUploadProgress(10 + (percentCompleted * 0.85)); 
                }
            });
            onUploadProgress(95);

            const finalizeResponse = await this._finalizeUpload(objectKey, file.name, file.type);
            onUploadProgress(100);
            return finalizeResponse;

        } catch (error) {
            console.error("Upload failed:", error);
            onUploadProgress(0);
            const message = error.response?.data?.message || error.message;
            return { success: false, message };
        }
    }

    async deleteMovie(objectKey) {
        return await this._createFetch('/files/delete', 'post', { objectKey }, true);
    }

    // --- END: PRE-SIGNED URL METHODS ---


    // --- Other existing methods ---
    async available() {
        return new Promise(async (resolve) => {
            try {
                const result = await this._createFetch("/db/available", "get");
                resolve(result.success ? result : { success: false, message: result.message });
            }
            catch (e) {
                resolve({ success: false, message: e.message });
            }
        })
    }

    async getEnvVariables() {
        return new Promise(async (resolve) => {
            try {
                const result = await this._createFetch("/config", "get");
                resolve(result.success ? { success: true, data: result.data } : { success: false, message: result.message });
            }
            catch (e) {
                resolve({ success: false, message: e.message });
            }
        })
    }

    async verify() {
        return new Promise(async (resolve) => {
            try {
                const result = await this._createFetch('/auth/verify', 'get', null, true);
                resolve(result);
            }
            catch (e) {
                resolve({ success: false, message: e.message });
            }
        })
    }

    async login(email, password) {
        return new Promise(async (resolve) => {
            try {
                const result = await this._createFetch('/auth/login', 'post', { email, password });
                resolve(result.success ? result : { success: false, message: result.message });
            } catch (e) {
                resolve({ success: false, message: e.message });
            }
        });
    }

    async getSettings(user = null) {
        return new Promise(async (resolve) => {
            try {
                const result = await this._createFetch(user ? '/settings/user' : '/settings/get', user ? 'post' : 'get', user, true);
                if (result.success) {
                    resolve({ success: true, data: result.data });
                } else {
                    let defaultSettings = getDefaultSettings();
                    defaultSettings.movies = result.movies || [];
                    resolve({ success: true, data: defaultSettings });
                }
            }
            catch (e) {
                resolve({ success: false, message: e.message });
            }
        });
    }

    async saveSettings(data) {
        return new Promise(async (resolve) => {
            try {
                const result = await this._createFetch('/settings/set', 'post', data, true);
                resolve(result.success ? { success: true, data: data } : { success: false, message: result.message });
            } catch (e) {
                resolve({ success: false, message: e.message });
            }
        });
    }

    async getAllUsers() {
        return new Promise(async (resolve) => {
            try {
                const result = await this._createFetch('/user/all', 'get', null, true);
                resolve(result);
            } catch (e) {
                resolve({ success: false, message: e.message });
            }
        });
    }
    
    // ... include any other methods like getProtectedUsers, addUser, deleteUser
}

export const At = new Server();