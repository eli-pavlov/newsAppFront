import axios from 'axios';
import { getEnvVariable } from '../utils/env';
import { getCookie } from '../utils/cookies';

class Db {
    constructor() {
        this.serverUrl = getEnvVariable('SERVER_URL') || window.location.origin;
        this.axios = axios.create({
            validateStatus: () => true,
        });
    }

    async createFetch(path, method, data = null, auth = false, headers = null, isFormData = false, onUploadProgress = null) {
        const url = `${this.serverUrl}${path}`;

        if (!headers) {
            headers = { "Content-Type": "application/json" };
        }

        if (auth) {
            const token = getCookie('authuser');
            headers.Authorization = `Bearer ${token}`;
        }

        let config = {
            url,
            method,
        };

        if (Object.keys(headers).length > 0) {
            config.headers = headers;
        }

        if (data) {
            config.data = isFormData ? data : JSON.stringify(data);
        }

        if (onUploadProgress) {
            config.onUploadProgress = onUploadProgress;
        }

        let response = null;
        try {
            response = await this.axios(config);
            return response.data;
        } catch (e) {
            return { success: false };
        }
    }

    defaultSettings = () => {
        return {
            colors_theme: 'light',
            title: "News App - Personalized Information System",
            footer_messages: [{ id: 0, msg: "No messages have been set yet", active: true }],
            movies: [],
            online_movies_categories: []
        };
    }

    // GENERAL
    async available() {
        return await this.createFetch('/db/available', 'get');
    }

    async getEnvVariables() {
        return await this.createFetch('/config', 'get');
    }

    // AUTH
    async verify() {
        return await this.createFetch('/auth/verify', 'get', null, true);
    }

    async login(email, password) {
        return await this.createFetch('/auth/login', 'post', { email, password });
    }

    // SETTINGS
    async getSettings(user = null) {
        const path = user ? '/settings/user' : '/settings/get';
        const method = user ? 'post' : 'get';
        const res = await this.createFetch(path, method, user, true);

        if (res.success) {
            return { success: true, data: res.data };
        }
        
        const defaultData = this.defaultSettings();
        defaultData.movies = res.movies || [];
        return { success: true, data: defaultData };
    }

    async saveSettings(data) {
        return await this.createFetch('/settings/set', 'post', data, true);
    }

    // USERS
    async getAllUsers() {
        return await this.createFetch('/user/all', 'get', null, true);
    }

    async getProtectedUsers() {
        return await this.createFetch('/user/protected', 'get');
    }

    async addUser(data) {
        return await this.createFetch('/user/add', 'post', data, true);
    }

    async deleteUser(email) {
        return await this.createFetch('/user/delete', 'post', { email }, true);
    }

    // FILES / MOVIES
    async uploadMovie(file, progressHandler, subFolder = null) {
        try {
            // 1. Get pre-signed URL from server
            const presignResponse = await this.createFetch('/files/generate-presigned-url', 'post', {
                fileName: file.name,
                contentType: file.type,
            }, true);

            if (!presignResponse.success) {
                return presignResponse;
            }

            const { uploadUrl, objectKey } = presignResponse.data;

            // 2. Upload file directly to S3
            const uploadResponse = await axios.put(uploadUrl, file, {
                onUploadProgress: progressHandler,
                headers: { 'Content-Type': file.type }
            });

            if (uploadResponse.status !== 200) {
                return { success: false, message: 'File upload to S3 failed.' };
            }

            // 3. Finalize upload with our server
            const finalizeResponse = await this.createFetch('/files/finalize-upload', 'post', {
                objectKey,
                fileName: file.name,
                contentType: file.type
            }, true);
            
            if (finalizeResponse.success) {
                 return { success: true, message: 'Upload successful!', ...finalizeResponse.data };
            } else {
                return finalizeResponse;
            }

        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    async deleteFile(objectKey) {
        return await this.createFetch('/files/delete', 'post', { objectKey }, true);
    }
}

const At = new Db();
export default At;