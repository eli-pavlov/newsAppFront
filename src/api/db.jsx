import { envVar, setEnvVarsFromServer } from "../utils/env";
import { getCookie, AUTH_COOKIE_NAME } from "../utils/cookies";
import axios from "axios";

class DB_SERVER {
  constructor() {
    // Preserve original behavior
    this.serverUrl = envVar("SERVER_URL") || window.location.href;

    this.axios = axios.create({
      validateStatus: () => true, // Always resolve; don't throw on non-2xx
    });
  }

  _join(u1, u2) {
    const a = (u1 || "").replace(/\/+$/, "");
    const b = (u2 || "");
    return a + b;
  }

  _authHeaders(addToken = true) {
    const headers = {};
    if (addToken) {
      const token = getCookie(AUTH_COOKIE_NAME);
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async createFetch(
    urlParams,
    method,
    body = null,
    addToken = true,
    headers = null,
    stringifyBody = true,
    onUploadProgressCB = null
  ) {
    const apiUrl = this._join(this.serverUrl, urlParams);

    const cfg = {
      url: apiUrl,
      method: method || "get",
      headers: {
        ...(headers || {}),
        ...this._authHeaders(addToken),
      },
      withCredentials: false,
    };

    if (body != null) {
      if (stringifyBody && !(body instanceof FormData)) {
        cfg.headers["Content-Type"] = "application/json";
        cfg.data = JSON.stringify(body);
      } else {
        cfg.data = body; // FormData or raw body
      }
    }

    if (typeof onUploadProgressCB === "function") {
      cfg.onUploadProgress = onUploadProgressCB;
    }

    const resp = await this.axios.request(cfg);
    try {
      return typeof resp.data === "object"
        ? resp.data
        : { success: false, message: "Invalid response" };
    } catch {
      return { success: false, message: "Invalid response" };
    }
  }

  // ---------- ENV ----------
  async getEnvVariables() {
    const res = await this.createFetch("/config", "get", null, false);
    if (res?.success && res?.data) {
      setEnvVarsFromServer(res.data);
    }
    return res;
  }

  // ---------- AUTH ----------
  async verify() {
    return await this.createFetch("/auth/verify", "get", null, true);
  }

  async login(email, password) {
    return await this.createFetch("/auth/login", "post", { email, password }, false);
  }

  // ---------- DB ----------
  async available() {
    return await this.createFetch("/db/available", "get", null, false);
  }

  // ---------- SETTINGS ----------
  async getSettings(user = null) {
    if (user) {
      return await this.createFetch("/settings/user", "post", { user }, true);
    }
    return await this.createFetch("/settings/get", "get", null, true);
  }

  async saveSettings(data, user = null) {
    const payload = user ? { ...data, user } : data;
    return await this.createFetch("/settings/set", "post", payload, true);
  }

  // ---------- USERS (admin-protected) ----------
  async getAllUsers() {
    return await this.createFetch("/user/all", "get", null, true);
  }

  async getProtectedUsers() {
    return await this.createFetch("/user/protected", "get", null, true);
  }

  async addUser(user) {
    return await this.createFetch("/user/add", "post", user, true);
  }

  async deleteUser(user) {
    const payload = typeof user === "string" ? { id: user } : user;
    return await this.createFetch("/user/delete", "post", payload, true);
  }

  // ---------- MOVIES (S3 presigned flow) ----------
  /**
   * Upload a movie file using backend S3 presigned URL flow.
   * 1) POST /files/presign  -> { success, url }
   * 2) PUT file to S3       -> 200/204 from S3
   * 3) POST /files/finalize -> { success, ... } (backend may return {data:{file_name, subFolder}})
   */
  async uploadMovie(file, onUploadProgressCB = null, subFolder = null) {
    try {
      if (!file) return { success: false, message: "No file selected" };

      // 1) Ask backend for a presigned PUT URL
      const contentType = file.type || "application/octet-stream";
      const presign = await this.createFetch(
        "/files/presign",
        "post",
        { fileName: file.name, subFolder, contentType },
        true
      );
      if (!presign?.success || !presign?.url) {
        return { success: false, message: presign?.message || "Failed to get upload URL" };
      }

      // 2) Upload directly to S3 using the signed URL
      const putResp = await axios.put(presign.url, file, {
        headers: { "Content-Type": contentType },
        onUploadProgress: onUploadProgressCB || undefined,
        validateStatus: () => true,
      });
      if (putResp.status >= 400) {
        return { success: false, message: `S3 upload failed (${putResp.status})` };
      }

      // 3) Finalize so backend can register/update DB & return canonical item
      const finalize = await this.createFetch(
        "/files/finalize",
        "post",
        { fileName: file.name, subFolder },
        true
      );

      return finalize?.success
        ? finalize
        : { success: false, message: finalize?.message || "Upload finalize failed" };
    } catch (e) {
      return { success: false, message: e?.message || "Upload failed" };
    }
  }

  /**
   * Delete a movie via S3 presigned URL.
   * 1) POST /files/deletePresign -> { success, url }
   * 2) DELETE to S3 signed URL   -> 204 from S3
   * 3) POST /files/finalizeDelete -> { success }
   */
  async deleteMovie(fileName, subFolder) {
    try {
      if (!fileName) return { success: false, message: "Missing file name" };

      const presign = await this.createFetch(
        "/files/deletePresign",
        "post",
        { fileName, subFolder },
        true
      );
      if (!presign?.success || !presign?.url) {
        return { success: false, message: presign?.message || "Failed to get delete URL" };
      }

      const delResp = await axios.delete(presign.url, { validateStatus: () => true });
      if (delResp.status >= 400) {
        return { success: false, message: `S3 delete failed (${delResp.status})` };
      }

      const finalize = await this.createFetch(
        "/files/finalizeDelete",
        "post",
        { fileName, subFolder },
        true
      );

      return finalize?.success
        ? finalize
        : { success: false, message: finalize?.message || "Delete finalize failed" };
    } catch (e) {
      return { success: false, message: e?.message || "Delete failed" };
    }
  }

  // ---------- Defaults ----------
  defaultSettings() {
    return {
      colors_theme: "light",
      title: "מיידעון - מערכת מידע אישית",
      footer_messages: [{ id: 0, msg: "לא הוגדרו עדיין הודעות", active: 1 }],
      movies: [],
      online_movies_categories: [],
    };
  }
}

export const db = new DB_SERVER();
