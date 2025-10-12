// newsAppFront/src/api/db.jsx
import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

class Wp {
    constructor() {
        this.axios = axios.create({
            baseURL: SERVER_URL,
            validateStatus: () => true
        });
    }

    async createFetch(endpoint, method, data = null, auth = false, headers = {}, useFormData = false, onProgress = null) {
        const config = {
            method,
            url: endpoint,
            headers: { ...headers },
            onUploadProgress: onProgress
        };

        if (data) {
            if (useFormData && data instanceof FormData) {
                config.data = data;
            } else {
                config.data = JSON.stringify(data);
                config.headers['Content-Type'] = 'application/json';
            }
        }

        if (auth) {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('authuser='))
                ?.split('=')[1];
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        try {
            const response = await this.axios(config);
            return response.data;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async available() {
        return await this.createFetch('/db/available', 'GET');
    }

    async login(email, password) {
        return await this.createFetch('/auth/login', 'POST', { email, password });
    }

    async getSettings(user = null) {
        if (user) {
            return await this.createFetch('/settings/user', 'POST', user, true);
        }
        return await this.createFetch('/settings/get', 'GET', null, true);
    }

    async saveSettings(settings, user = null) {
        return await this.createFetch('/settings/set', 'POST', settings, true);
    }

    async getAllUsers() {
        return await this.createFetch('/user/all', 'GET', null, true);
    }

    async getProtectedUsers() {
        return await this.createFetch('/user/protected', 'GET', null, true);
    }

    async addUser(userData) {
        return await this.createFetch('/user/add', 'POST', userData, true);
    }

    async deleteUser(email) {
        return await this.createFetch('/user/delete', 'POST', { email }, true);
    }

    async deleteMovie(fileName, subFolder) {
        return await this.createFetch('/files/delete', 'POST', { fileName, subFolder }, true);
    }

    // Legacy upload method (unchanged for backward compatibility)
    async uploadMovie(file, onProgress = null, subFolder = null) {
        return new Promise(async (resolve, reject) => {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('subFolder', subFolder);
                const result = await this.createFetch('/files/upload', 'POST', formData, true, {}, false, onProgress);
                if (result.success) {
                    resolve(result);
                } else {
                    resolve({ success: false, message: result.message });
                }
            } catch (error) {
                reject({ success: false, message: error.message });
            }
        });
    }

    // New presigned S3 methods
    async presignUpload(fileName, subFolder, contentType = 'video/mp4') {
        return await this.createFetch('/files/presign', 'POST', { fileName, subFolder, contentType }, true);
    }

    async finalizeUpload(fileName, subFolder) {
        return await this.createFetch('/files/finalize', 'POST', { fileName, subFolder }, true);
    }

    async presignDelete(fileName, subFolder) {
        return await this.createFetch('/files/delete_presign', 'POST', { fileName, subFolder }, true);
    }

    async finalizeDelete(fileName, subFolder) {
        return await this.createFetch('/files/finalize_delete', 'POST', { fileName, subFolder }, true);
    }

    async verify() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.createFetch("/auth/verify", "get", null, true);
                resolve(result);
            } catch (e) {
                reject({ success: false, message: e.message });
            }
        });
    }

}

export default new Wp();