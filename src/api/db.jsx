// Frontend — src/api/db.jsx
//
// Client API Wrapper
// This file serves as the central client-side interface for communicating with the backend server.
// It uses axios to handle HTTP requests and provides a unified way to call API endpoints.
// All responses are normalized: successful calls return data, errors return { success: false, message: '...' }.
//
// Key Features:
// - Configured axios instance: Base URL, JSON headers, cookie credentials for sessions.
// - Generic createFetch: Handles methods (GET/POST), bodies (JSON/FormData), progress callbacks, blob responses.
// - Environment support: SERVER_URL from Vite env or window global.
// - Backward compatibility: uploadMovie returns same shape as legacy to avoid UI changes.
//
// Upload Flow Update:
// The uploadMovie method implements direct S3 uploads to reduce server load.
// 1. Presign: Request signed URL from backend.
// 2. PUT: Browser uploads file directly to S3 (progress tracked).
// 3. Finalize: Backend verifies upload via S3 HEAD.
//
// Dependencies:
// - axios: For HTTP operations.
// 
// Usage: Import 'db' instance and call methods like db.login().
// 
// Potential Improvements:
// - Add request interceptors for auth tokens if needed.
// - Timeout configuration in axios create.
// - Retry logic in createFetch for transient errors.

import axios from "axios"; // HTTP client library for making requests.

// DB_SERVER class: Encapsulates all API methods and shared axios configuration.
class DB_SERVER {
    // Constructor: Sets up server URL and axios instance.
    // Normalizes URL (removes trailing slash for consistency).
    // Axios config includes baseURL, default headers, and withCredentials for session cookies.
    constructor(serverUrl) {
        this.serverUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;

        this.axios = axios.create({
            baseURL: this.serverUrl,
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true // Enables sending cookies for authentication.
        })
    }

    /**
     * createFetch: Core utility for all API calls.
     * Parameters:
     * - url: Endpoint path (e.g., '/auth/login').
     * - method: HTTP verb ('get', 'post', etc.).
     * - body: Data to send (null for GET).
     * - isForm: If true, send as FormData (raw, for files).
     * - headers: Custom headers override.
     * - isBlob: Response as blob (e.g., for downloads).
     * - onUploadProgressCB: Callback for progress events (e.g., percentage uploaded).
     * 
     * Logic:
     * - Builds axios options.
     * - Serializes body as JSON unless isForm.
     * - Attaches progress for FormData uploads.
     * - Executes and catches errors, normalizing to { success: false, message }.
     * 
     * Purpose: Centralizes request handling, error normalization, and features like progress.
     */
    async createFetch(url, method, body=null, isForm=false, headers={}, isBlob=false, onUploadProgressCB=null) {
        let options = {
            method: method,
            url: this.serverUrl + url,
            responseType: (isBlob ? 'blob' : 'json'),
            headers: headers
        };

        if (body) {
            if (isForm) options.data = body; // Raw FormData.
            else options.data = JSON.stringify(body); // JSON string for non-form.
        }

        if (isForm && onUploadProgressCB) {
            options.onUploadProgress = onUploadProgressCB; // Streams progress to UI.
        }

        try {
            const response = await this.axios(options);
            return response.data; // Direct data return on success.
        }
        catch (e) {
            // Normalize all errors (network, server) into consistent shape.
            return { success: false, message: e.message };
        }
    }

    // available: Health check endpoint to verify backend connectivity.
    // Returns whatever the server responds (e.g., { available: true }).
    async available() {
        return this.createFetch('/db/available', 'get');
    }

    // login: Authenticates user with email and password.
    // Body: { email, password } → Sent as JSON POST.
    async login(email, password) {
        return this.createFetch('/auth/login', 'post', { email, password });
    }

    // logout: Ends current session.
    // No body needed.
    async logout() {
        return this.createFetch('/auth/logout', 'post');
    }

    // settingsGet: Fetches global app settings.
    // GET request, expects JSON response.
    async settingsGet() {
        return this.createFetch('/settings/get', 'get');
    }

    // usersGetAll: Admin endpoint to list all users.
    // Protected by auth, GET.
    async usersGetAll() {
        return this.createFetch('/user/all', 'get');
    }

    // userProtected: Tests access to a role-protected endpoint.
    // Used for session/validation checks.
    async userProtected() {
        return this.createFetch('/user/protected', 'get');
    }

    /**
     * uploadMovie: Updated method for movie file uploads via S3 pre-signed URLs.
     * Parameters:
     * - file: File object from input.
     * - onUploadProgressCB: Function to update UI progress.
     * - subFolder: Optional folder prefix in S3.
     * 
     * Internal Helper (postJSON):
     * - Tries primary path (/ Parenting/api/...), falls back to secondary (/files/...).
     * - Handles proxy/404 issues by continuing on specific statuses.
     * - Sends JSON with optional extra headers (for FormData fallback).
     * 
     * Steps:
     * 1. Prepare fallback headers (x-file-name etc.) for compatibility.
     * 2. Presign: POST to get signed URL, objectKey, etc.
     * 3. PUT: Direct axios PUT to S3 URL with file and progress.
     * 4. Finalize: POST to verify, get final public URL.
     * 
     * Error Handling: Propagates backend errors or S3 status issues.
     * Returns: { success, url, file_name, subFolder } matching legacy.
     * 
     * Benefits: Offloads bandwidth from server, supports large files.
     */
    async uploadMovie(file, onUploadProgressCB, subFolder=null) {
        // postJSON helper: Robust POST with path fallbacks.
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
                    if (e?.response?.status !== 404 && e?.response?.status !== 405) throw e;
                }
            }
            throw lastErr || new Error('No working endpoint path');
        };

        // Fallback headers: Allow backend parsing if client uses FormData.
        const fallbackHeaders = {
            'x-file-name': encodeURIComponent(file.name),
            'x-content-type': file.type || 'application/octet-stream',
        };
        if (subFolder !== null && subFolder !== undefined) {
            fallbackHeaders['x-sub-folder'] = subFolder;
        }

        // Step 1: Request pre-signed URL from backend.
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

        // Step 2: Upload directly to S3.
        const { url, headers, objectKey, publicUrl } = presignResp;
        const putResp = await this.axios.put(url, file, {
            headers: Object.assign({ 'Content-Type': file.type || 'application/octet-stream' }, headers || {}),
            onUploadProgress: (onUploadProgressCB ? onUploadProgressCB : undefined),
            maxBodyLength: Infinity, // No size limit enforcement.
        });
        // Check S3 response status (200 OK, etc.).
        if (!(putResp.status === 200 || putResp.status === 201 || putResp.status === 204)) {
            return { success: false, message: 'S3 upload failed', status: putResp.status };
        }

        // Step 3: Finalize verification with backend.
        const finalizeResp = await postJSON(
            ['/api/files/finalize', '/files/finalize'],
            { objectKey, fileName: file.name, subFolder: (subFolder === undefined ? null : subFolder) },
            fallbackHeaders
        );
        if (!finalizeResp || !finalizeResp.success) {
            return finalizeResp || { success: false, message: 'Finalize failed' };
        }

        // Compatible return format.
        return {
            success: true,
            url: publicUrl || finalizeResp.url,
            file_name: file.name,
            subFolder: (subFolder === undefined ? null : subFolder)
        };
    }

    // deleteMovie: Deletes a file by name and optional subFolder.
    // POST to /files/delete with body.
    async deleteMovie(fileName, subFolder=null) {
        return this.createFetch('/files/delete', 'post', { fileName, subFolder });
    }

    // getConfig: Fetches public config (e.g., features, versions).
    // GET request.
    async getConfig() {
        return this.createFetch('/config', 'get');
    }
}

// envVar: Utility to read environment variables.
// Sources: Vite's import.meta.env or window.__ENV__ (injected in prod).
// Returns empty string if missing.
export function envVar(name) {
    const v = import.meta?.env?.[name] ?? window?.__ENV__?.[name];
    return (v === undefined || v === null) ? '' : String(v);
}

// Singleton instance: Uses SERVER_URL env or fallback to current origin.
const serverUrl = envVar('SERVER_URL') || window.location.href;
export const db = new DB_SERVER(serverUrl);