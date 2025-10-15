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

    async uploadMovie(file, onUploadProgressCB, subFolder=null) {
        // Robust S3 pre-signed upload (tries /api/* first, then /files/*; sends header fallbacks)
        const subFolderSafe = (subFolder === undefined || subFolder === null) ? null : subFolder;

        // fallback headers so server sees values even if some client lib posts multipart/form-data
        const fallbackHeaders = {
        'x-file-name': encodeURIComponent(file.name),
        'x-content-type': file.type || 'application/octet-stream',
        };
        if (subFolderSafe) fallbackHeaders['x-sub-folder'] = subFolderSafe;

        // small helper to try a list of paths until one works
        const postJSON = async (paths, body) => {
        let lastErr;
        for (const p of paths) {
            try {
            const res = await this.axios.post(
                p,
                body,
                { headers: Object.assign({ 'Content-Type': 'application/json' }, fallbackHeaders) }
            );
            return res.data;
            } catch (e) {
            lastErr = e;
            if (e?.response?.status !== 404 && e?.response?.status !== 405) throw e;
            // else try next path
            }
        }
        throw lastErr || new Error('No working endpoint path');
        };

        // 1) presign
        const presignResp = await postJSON(
        ['/api/files/presign', '/files/presign'],
        {
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            subFolder: subFolderSafe,
        }
        );
        if (!presignResp || !presignResp.success) {
        return presignResp || { success: false, message: 'Presign failed' };
        }

        // 2) direct PUT to S3 (progress supported)
        const { url, headers, objectKey, publicUrl } = presignResp;
        const putResp = await this.axios.put(url, file, {
        headers: Object.assign({ 'Content-Type': file.type || 'application/octet-stream' }, headers || {}),
        onUploadProgress: (onUploadProgressCB ? onUploadProgressCB : undefined),
        maxBodyLength: Infinity,
        });
        if (!(putResp.status === 200 || putResp.status === 201 || putResp.status === 204)) {
        return { success: false, message: 'S3 upload failed', status: putResp.status };
        }

        // 3) finalize (server verifies object; returns normalized shape)
        const finalizeResp = await postJSON(
        ['/api/files/finalize', '/files/finalize'],
        { objectKey, fileName: file.name, subFolder: subFolderSafe }
        );
        if (!finalizeResp || !finalizeResp.success) {
        return finalizeResp || { success: false, message: 'Finalize failed' };
        }

        return {
        success: true,
        url: publicUrl || finalizeResp.url,
        file_name: file.name,
        subFolder: subFolderSafe
        };
    }
}

export const db = new DB_SERVER();
