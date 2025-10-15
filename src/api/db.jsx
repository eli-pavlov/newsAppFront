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
        // New S3 pre-signed URL upload flow (headers+JSON so server always sees fileName)
        const subFolderSafe = (subFolder === undefined || subFolder === null) ? null : subFolder;

        // build header fallbacks (work even if a client accidentally posts multipart/form-data)
        const fallbackHeaders = {
        'x-file-name': encodeURIComponent(file.name),
        'x-content-type': file.type || 'application/octet-stream',
        };
        if (subFolderSafe) fallbackHeaders['x-sub-folder'] = subFolderSafe;

        // 1) ask backend to presign (JSON body + headers)
        const presignRes = await this.axios.post(
        '/files/presign',
        {
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            subFolder: subFolderSafe,
        },
        { headers: Object.assign({ 'Content-Type': 'application/json' }, fallbackHeaders) }
        );
        const presignResp = presignRes.data;
        if (!presignResp || !presignResp.success) {
        return presignResp || { success: false, message: 'Presign failed' };
        }

        // 2) upload directly to S3 with PUT (progress supported)
        const { url, headers, objectKey, publicUrl } = presignResp;

        const putResp = await this.axios.put(url, file, {
        headers: Object.assign(
            { 'Content-Type': file.type || 'application/octet-stream' },
            headers || {}
        ),
        onUploadProgress: (onUploadProgressCB ? onUploadProgressCB : undefined),
        maxBodyLength: Infinity,
        });
        if (!(putResp.status === 200 || putResp.status === 201 || putResp.status === 204)) {
        return { success: false, message: 'S3 upload failed', status: putResp.status };
        }

        // 3) finalize on backend (verification + normalized response)
        // send both JSON body and the same fallback headers, so either path works
        const finalizeRes = await this.axios.post(
        '/files/finalize',
        { objectKey, fileName: file.name, subFolder: subFolderSafe },
        { headers: Object.assign({ 'Content-Type': 'application/json' }, fallbackHeaders) }
        );
        const finalizeResp = finalizeRes.data;
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
