// Frontend — src/api/db.jsx
//
// Client API Wrapper
// This file provides a wrapper for all client-side API calls to the backend.
// It centralizes HTTP requests using axios.
//
// Key Change: The uploadMovie() method now uses a pre-signed S3 URL for direct uploads.
// Flow:
// 1. Request pre-signed URL from backend.
// 2. Upload file directly to S3 using the signed URL.
// 3. Notify backend to finalize and verify.
//
// All other methods remain unchanged.

import axios from "axios"; // HTTP client for API requests.

// DB_SERVER class encapsulates all backend API interactions.
class DB_SERVER {
    // Constructor: Initializes with server URL and configures axios instance.
    constructor(serverUrl) {
        // Normalize URL by removing trailing slash.
        this.serverUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;

        // Axios instance with base URL, JSON headers, and credential support.
        this.axios = axios.create({
            baseURL: this.serverUrl,
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true
        })
    }

    /**
     * createFetch: Generic method to handle API requests.
     * Supports different methods, bodies (JSON or FormData), headers, blob responses, and upload progress.
     * Returns response data or normalized error object.
     */
    async createFetch(url, method, body=null, isForm=false, headers={}, isBlob=false, onUploadProgressCB=null) {
        // Base options for the request.
        let options = {
            method: method,
            url: this.serverUrl + url,
            responseType: (isBlob ? 'blob' : 'json'),
            headers: headers
        };

        // Add body if provided: FormData for forms, JSON otherwise.
        if (body) {
            if (isForm) options.data = body;
            else options.data = JSON.stringify(body);
        }

        // Add upload progress callback if provided and using FormData.
        if (isForm && onUploadProgressCB)
            options.onUploadProgress = onUploadProgressCB;

        // Execute request and handle errors.
        try {
            const response = await this.axios(options);
            return response.data;
        }
        catch (e) {
            return { success: false, message: e.message };
        }
    }

    // Check if backend is available.
    async available() {
        return this.createFetch('/db/available', 'get');
    }

    // Login with credentials.
    async login(email, password) {
        return this.createFetch('/auth/login', 'post', { email, password });
    }

    // Logout current session.
    async logout() {
        return this.createFetch('/auth/logout', 'post');
    }

    // Retrieve application settings.
    async settingsGet() {
        return this.createFetch('/settings/get', 'get');
    }

    // Get list of all users (admin endpoint).
    async usersGetAll() {
        return this.createFetch('/user/all', 'get');
    }

    // Test access to protected user endpoint.
    async userProtected() {
        return this.createFetch('/user/protected', 'get');
    }

    /**
     * uploadMovie: Handles file upload using pre-signed S3 flow.
     * 1. Post to /presign to get signed URL.
     * 2. PUT file directly to S3.
     * 3. Post to /finalize for verification.
     * Supports fallback paths and custom headers for compatibility.
     */
    async uploadMovie(file, onUploadProgressCB, subFolder=null) {
        // Helper to post JSON with fallback endpoint paths.
        const postJSON = async (paths, body, extraHeaders = {}) => {
            let lastErr;
            for (const p of paths) {
                try {
                    const res = await this.axios.post(
                        p,
                        body,
                        { headers: Object.assign({ 'Content-Type': 'application/json' }, extraHeaders) }
                    );
                    return res.data;
                } catch (e) {
                    lastErr = e;
                    // Continue on 404/405 errors (proxy-related), otherwise throw.
                    if (e?.response?.status !== 404 && e?.response?.status !== 405) throw e;
                }
            }
            throw lastErr || new Error('No working endpoint path');
        };

        // Fallback headers for FormData compatibility.
        const fallbackHeaders = {
            'x-file-name': encodeURIComponent(file.name),
            'x-content-type': file.type || 'application/octet-stream',
        };
        if (subFolder !== null && subFolder !== undefined) {
            fallbackHeaders['x-sub-folder'] = subFolder;
        }

        // Step 1: Request pre-signed URL.
        const presignResp = await postJSON(
            ['/api/files/presign', '/files/presign'],
            {
                fileName: file.name,
                contentType: file.type || 'application/octet-stream',
                subFolder: (subFolder === undefined ? null : subFolder)
            },
            fallbackHeaders
        );
        if (!presignResp || !presignResp.success) {
            return presignResp || { success: false, message: 'Presign failed' };
        }

        // Step 2: Upload to S3 using signed URL.
        const { url, headers, objectKey, publicUrl } = presignResp;
        const putResp = await this.axios.put(url, file, {
            headers: Object.assign({ 'Content-Type': file.type || 'application/octet-stream' }, headers || {}),
            onUploadProgress: (onUploadProgressCB ? onUploadProgressCB : undefined),
            maxBodyLength: Infinity, // Support large files.
        });
        if (!(putResp.status === 200 || putResp.status === 201 || putResp.status === 204)) {
            return { success: false, message: 'S3 upload failed', status: putResp.status };
        }

        // Step 3: Finalize with backend.
        const finalizeResp = await postJSON(
            ['/api/files/finalize', '/files/finalize'],
            { objectKey, fileName: file.name, subFolder: (subFolder === undefined ? null : subFolder) },
            fallbackHeaders
        );
        if (!finalizeResp || !finalizeResp.success) {
            return finalizeResp || { success: false, message: 'Finalize failed' };
        }

        // Return in format expected by UI.
        return {
            success: true,
            url: publicUrl || finalizeResp.url,
            file_name: file.name,
            subFolder: (subFolder === undefined ? null : subFolder)
        };
    }

    // Delete movie file by name and optional subFolder.
    async deleteMovie(fileName, subFolder=null) {
        return this.createFetch('/files/delete', 'post', { fileName, subFolder });
    }

    // Retrieve public configuration.
    async getConfig() {
        return this.createFetch('/config', 'get');
    }
}

// Helper to access environment variables.
export function envVar(name) {
    const v = import.meta?.env?.[name] ?? window?.__ENV__?.[name];
    return (v === undefined || v === null) ? '' : String(v);
}

// Create and export single DB_SERVER instance.
const serverUrl = envVar('SERVER_URL') || window.location.href;
export const db = new DB_SERVER(serverUrl);