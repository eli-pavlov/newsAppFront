import { envVar, setEnvVarsFromServer } from "../utils/env";
import { getCookie, AUTH_COOKIE_NAME } from '../utils/cookies'
import axios from "axios";

class DB_SERVER {
    constructor() {
        this.serverUrl = envVar('SERVER_URL') || window.location.href;

        this.axios = axios.create({
            validateStatus: () => true // Always resolve, never reject for HTTP codes
        });
    }

    async createFetch(urlParams, method, body = null, addToken = false, headers = null, stringifyBody = true, onUploadProgressCB = null) {
        const apiUrl = `${this.serverUrl}${urlParams}`;

        if (!headers) {
            headers = { // default
                'Content-Type': 'application/json',
            };
        }

        if (addToken) {
            const accessToken = getCookie(AUTH_COOKIE_NAME);
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        let requestParams = {
            url: apiUrl,
            method: method,
        }

        if (Object.keys(headers).length > 0)
            requestParams['headers'] = headers;

        if (body) {
            if (stringifyBody)
                requestParams['data'] = JSON.stringify(body);
            else
                requestParams['data'] = body;
        }

        if (onUploadProgressCB) {
            requestParams['onUploadProgress'] = onUploadProgressCB;
        }

        let result = null;
        try {
            result = await this.axios(requestParams);

            return result.data;
        }
        catch (e) {
            return { success: false };
        }
    }

    defaultSettings() {
        return {
            'colors_theme': 'light',
            'title': 'מיידעון - מערכת מידע אישית',
            'footer_messages': [
                { id: 0, msg: 'לא הוגדרו עדיין הודעות', active: 1 },
            ],
            'movies': [],
            'online_movies_categories': [],
        }
    }

    async available() {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.createFetch('/db/available', 'get');

                if (response.success)
                    resolve(response);
                else
                    resolve({ success: false, message: response.message });
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    async getEnvVariables() {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.createFetch('/config', 'get');

                if (response.success) {
                    setEnvVarsFromServer(response.data);

                    resolve({ success: true });
                }
                else
                    resolve({ success: false, message: response.message });
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    async verify() {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.createFetch('/auth/verify', 'get', null, true);

                resolve(response);
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    async login(email, password) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.createFetch('/auth/login', 'post', { email: email, password: password });

                if (response.success)
                    resolve(response);
                else
                    resolve({ success: false, message: response.message });
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    async getSettings(user = null) {
        return new Promise(async (resolve, reject) => {
            try {
                let response = null;
                if (!user)
                    response = await this.createFetch('/settings/get', 'get', null, true);
                else
                    response = await this.createFetch('/settings/user', 'post', user, true);

                if (response.success)
                    resolve({ success: true, data: response.data });
                else {
                    let settings = this.defaultSettings();
                    settings.movies = response.movies;
                    resolve({ success: true, data: settings });
                }
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    async saveSettings(settings) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.createFetch('/settings/set', 'post', settings, true);

                if (response.success)
                    resolve({ success: true, data: settings });
                else
                    resolve({ success: false, message: response.messsage });
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    async getAllUsers() {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.createFetch('/user/all', 'get', null, true);

                if (response.success)
                    resolve(response);
                else
                    resolve({ success: false, message: response.message });
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    async getProtectedUsers() {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.createFetch('/user/protected', 'get');

                if (response.success)
                    resolve(response);
                else
                    resolve({ success: false, message: response.message });
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    async addUser(userData) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.createFetch('/user/add', 'post', userData, true);

                if (response.success)
                    resolve(response);
                else
                    resolve({ success: false, message: response.message });
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    async deleteUser(email) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.createFetch('/user/delete', 'post', { email }, true);

                if (response.success)
                    resolve(response);
                else
                    resolve({ success: false, message: response.message });
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    async deleteMovie(fileName, subFolder) {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.createFetch('/files/delete', 'post', { fileName, subFolder }, true);

                if (response.success)
                    resolve(response);
                else
                    resolve({ success: false, message: response.message });
            }
            catch (e) {
                reject({ success: false, message: e.message })
            }
        })
    }

    // ⬇️ THIS IS THE ONLY METHOD THAT HAS BEEN REVISED ⬇️
    async uploadMovie(file, onUploadProgressCB) {
        try {
            // Step 1: Request a pre-signed URL from our backend
            const presignResponse = await this.createFetch(
                '/files/presigned-url',
                'post',
                {
                    fileName: file.name,
                    contentType: file.type,
                },
                true // Authenticated request
            );

            if (!presignResponse.success) {
                return { success: false, message: presignResponse.message };
            }

            const { preSignedUrl, ...newMovieData } = presignResponse;

            // Step 2: Upload the actual file directly to S3 using a PUT request
            await axios.put(preSignedUrl, file, {
                headers: {
                    'Content-Type': file.type,
                },
                onUploadProgress: progressEvent => {
                    if (onUploadProgressCB) {
                        // The onUploadProgressCB from your Settings.jsx expects a percentage
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onUploadProgressCB(percentCompleted);
                    }
                },
            });

            // If the axios PUT request finishes without an error, the upload was successful.
            return {
                success: true,
                message: 'File uploaded successfully!',
                data: newMovieData // This contains the final URL and other details
            };

        } catch (error) {
            console.error("Upload process failed:", error);
            const message = error.response ? 'S3 upload failed.' : error.message;
            return { success: false, message: message };
        }
    }
}

export const db = new DB_SERVER();
