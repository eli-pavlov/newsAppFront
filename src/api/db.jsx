import axios from "axios";
import { getEnvVariable } from "../utils/env";
import { AUTH_USER, getCookie, removeCookie, setCookie } from "../utils/cookies";
import { defaultSettings as getDefaultSettings } from "../utils/settings";

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

    async available() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this._createFetch("/db/available", "get");
                if (result.success) {
                    resolve(result);
                } else {
                    resolve({ success: false, message: result.message });
                }
            }
            catch (e) {
                reject({ success: false, message: e.message });
            }
        })
    }

    async getEnvVariables() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this._createFetch("/config", "get");
                if (result.success) {
                    resolve({ success: true, data: result.data });
                } else {
                    resolve({ success: false, message: result.message });
                }
            }
            catch (e) {
                reject({ success: false, message: e.message });
            }
        })
    }

    async verify() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this._createFetch('/auth/verify', 'get', null, true);
                resolve(result);
            }
            catch (e) {
                reject({ success: false, message: e.message });
            }
        })
    }

    async login(email, password) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this._createFetch('/auth/login', 'post', { email, password });

                if (result.success) {
                    resolve(result);
                }
                else {
                    resolve({ success: false, message: result.message });
                }
            }
            catch (e) {
                reject({ success: false, message: e.message });
            }
        });
    }

    async getSettings(user = null) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = null;
                if (user) {
                    result = await this._createFetch('/settings/user', 'post', user, true);
                }
                else {
                    result = await this._createFetch('/settings/get', 'get', null, true);
                }

                if (result.success) {
                    resolve({ success: true, data: result.data });
                }
                else {
                    // in case of fail get settings - return the default settings
                    let defaultSettings = getDefaultSettings();
                    defaultSettings.movies = result.movies;
                    resolve({ success: true, data: defaultSettings });
                }
            }
            catch (e) {
                reject({ success: false, message: e.message });
            }
        });
    }

    async saveSettings(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this._createFetch('/settings/set', 'post', data, true);

                if (result.success) {
                    resolve({ success: true, data: data });
                }
                else {
                    resolve({ success: false, message: result.messsage });
                }
            }
            catch (e) {
                reject({ success: false, message: e.message });
            }
        });
    }

    async getAllUsers() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this._createFetch('/user/all', 'get', null, true);

                if (result.success) {
                    resolve(result);
                }
                else {
                    resolve({ success: false, message: result.message });
                }
            }
            catch (e) {
                reject({ success: false, message: e.message });
            }
        });
    }

    async getProtectedUsers() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this._createFetch('/user/protected', 'get');

                if (result.success) {
                    resolve(result);
                }
                else {
                    resolve({ success: false, message: result.message });
                }
            }
            catch (e) {
                reject({ success: false, message: e.message });
            }
        });
    }

    async addUser(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this._createFetch('/user/add', 'post', data, true);

                if (result.success) {
                    resolve(result);
                }
                else {
                    resolve({ success: false, message: result.message });
                }
            }
            catch (e) {
                reject({ success: false, message: e.message });
            }
        });
    }

    async deleteUser(email) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this._createFetch('/user/delete', 'post', { email }, true);

                if (result.success) {
                    resolve(result);
                }
                else {
                    resolve({ success: false, message: result.message });
                }
            }
            catch (e) {
                reject({ success: false, message: e.message });
            }
        });
    }

    // --- REVISED FILE UPLOAD METHODS ---

    /**
     * Deletes a movie from the server using its S3 object key.
     * @param {string} objectKey - The unique key of the S3 object to delete.
     */
    async deleteMovie(objectKey) {
        return await this._createFetch('/files/delete', 'post', { objectKey }, true);
    }

    /**
     * STEP 1: Get a pre-signed URL from our server.
     */
    async _generateUploadUrl(fileName, contentType) {
        const path = '/files/generate-presigned-url';
        return await this._createFetch(path, 'post', { fileName, contentType }, true);
    }
    
    /**
     * STEP 3: Tell our server the upload is done and to create a DB record.
     */
    async _finalizeUpload(objectKey, fileName, contentType) {
        const path = '/files/finalize-upload';
        return await this._createFetch(path, 'post', { objectKey, fileName, contentType }, true);
    }

    /**
     * Orchestrates the 3-step S3 upload process.
     * @param {File} file - The file object to upload.
     * @param {function} onUploadProgress - Progress callback for the S3 upload.
     * @returns {Promise<object>} - The result of the finalization step.
     */
    async uploadFileWithPresignedUrl(file, onUploadProgress) {
        try {
            // 1. Get pre-signed URL from our server
            const presignResponse = await this._generateUploadUrl(file.name, file.type);
            if (!presignResponse.success) {
                throw new Error(presignResponse.message || "Could not get an upload URL.");
            }
            const { uploadUrl, objectKey } = presignResponse;
            onUploadProgress(10); // Initial progress after getting URL

            // 2. Upload the file directly to S3 using the pre-signed URL
            await axios.put(uploadUrl, file, {
                headers: { 'Content-Type': file.type },
                onUploadProgress: progressEvent => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    // Scale progress to leave room for finalization step
                    onUploadProgress(10 + (percentCompleted * 0.85)); 
                }
            });
            onUploadProgress(95); // Mark as nearly complete before finalization

            // 3. Finalize the upload with our server
            const finalizeResponse = await this._finalizeUpload(objectKey, file.name, file.type);
            onUploadProgress(100);
            return finalizeResponse;

        } catch (error) {
            console.error("Upload failed:", error);
            onUploadProgress(0); // Reset progress on error
            const message = error.response?.data?.message || error.message;
            return { success: false, message };
        }
    }
}

export const At = new Server();