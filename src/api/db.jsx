import axios from 'axios';
import { getEnvVariable } from '../utils/env';
import { getCookie } from '../utils/cookies';

class Db {
    constructor() {
        this.serverUrl = getEnvVariable('SERVER_URL') || window.location.origin;
        this.axios = axios.create({
            validateStatus: () => true, // Handle all status codes in the response
        });
    }

    async _createFetch(path, method, data = null, auth = false, headers = null, onUploadProgress = null) {
        const url = `${this.serverUrl}${path}`;
        const isFormData = data instanceof FormData;

        const effectiveHeaders = headers || {};
        if (!isFormData) {
            effectiveHeaders['Content-Type'] = 'application/json';
        }

        if (auth) {
            const token = getCookie('authuser');
            if (token) {
                effectiveHeaders.Authorization = `Bearer ${token}`;
            }
        }

        const config = {
            url,
            method,
            headers: effectiveHeaders,
            data: isFormData ? data : data ? JSON.stringify(data) : null,
            onUploadProgress,
        };

        try {
            const response = await this.axios(config);
            return response.data;
        } catch (error) {
            console.error(`API call failed: ${method.toUpperCase()} ${path}`, error);
            return { success: false, message: error.message || 'A network error occurred.' };
        }
    }

    // --- GENERAL ---
    async available() {
        return await this._createFetch('/db/available', 'get');
    }

    async getEnvVariables() {
        return await this._createFetch('/config', 'get');
    }

    // --- AUTH ---
    async verify() {
        return await this._createFetch('/auth/verify', 'get', null, true);
    }

    async login(email, password) {
        return await this._createFetch('/auth/login', 'post', { email, password });
    }

    // --- SETTINGS ---
    async getSettings(user = null) {
        const path = user ? '/settings/user' : '/settings/get';
        const method = user ? 'post' : 'get';
        return await this._createFetch(path, method, user, true);
    }

    async saveSettings(data) {
        return await this._createFetch('/settings/set', 'post', data, true);
    }

    // --- USERS ---
    async getAllUsers() {
        return await this._createFetch('/user/all', 'get', null, true);
    }
    
    async getProtectedUsers() {
        return await this._createFetch('/user/protected', 'get');
    }

    async addUser(data) {
        return await this._createFetch('/user/add', 'post', data, true);
    }

    async deleteUser(email) {
        return await this._createFetch('/user/delete', 'post', { email }, true);
    }

    // --- FILES (S3 Pre-signed URL Flow) ---
    async uploadMovie(file, progressHandler) {
        try {
            // 1. Get pre-signed URL from our server
            const presignResponse = await this._createFetch('/files/generate-presigned-url', 'post', {
                fileName: file.name,
                contentType: file.type,
            }, true);

            if (!presignResponse.success) {
                return presignResponse;
            }

            const { uploadUrl, objectKey } = presignResponse.data;

            // 2. Upload file directly to S3 using the provided URL
            const uploadResponse = await axios.put(uploadUrl, file, {
                onUploadProgress: progressHandler,
                headers: { 'Content-Type': file.type }
            });

            if (uploadResponse.status !== 200) {
                return { success: false, message: 'File upload to S3 failed.' };
            }

            // 3. Notify our server that the upload is complete for verification
            const finalizeResponse = await this._createFetch('/files/finalize-upload', 'post', {
                objectKey,
                fileName: file.name,
                contentType: file.type
            }, true);
            
            if (finalizeResponse.success) {
                 return { success: true, message: 'Upload successful!', data: finalizeResponse.data };
            } else {
                return finalizeResponse;
            }

        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    async deleteFile(objectKey) {
        return await this._createFetch('/files/delete', 'post', { objectKey }, true);
    }
}

const At = new Db();
export default At;