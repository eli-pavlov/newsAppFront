import { envVar } from "../utils/env";
import { getCookie, AUTH_COOKIE_NAME } from '../utils/cookies'
import { setEnvVarsFromServer } from "../utils/env";

class DB_SERVER {
    constructor() {
    }

    createFetch(urlParams, method, body=null, addToken=false) {
        const serverUrl=envVar('SERVER_URL');
        const apiUrl = `${serverUrl}${urlParams}`;

        let headers = {
            'Content-Type': 'application/json',
        };

        if (addToken) {
            const accessToken = getCookie(AUTH_COOKIE_NAME);
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        let requestParams = {
            method: method,
            headers: headers,
        }

        if (body) {
            requestParams['body'] = JSON.stringify(body);
        }

        return fetch(apiUrl, requestParams);
    }

    defaultSettings() {
        return {
            'colors_theme':'light',
            'title':'מיידעון - מערכת מידע אישית',
            'footer_messages':[
                {id:0, msg:'לא הוגדרו עדיין הודעות', active:1},
            ],
            'movies':[],
            'online_movies_categories':[],
        }
    }

    async available() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.createFetch('/db/available', 'get');
                const response = await result.json();

                if (response.success)
                    resolve({success:true});
                else
                    resolve({success:false, message:response.message});
            }
            catch (e) {
                reject({success:false, message:e.message})
            }
        })
    }

    async getEnvVariables() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.createFetch('/config', 'get');
                const response = await result.json();

                if (response.success) {
                    setEnvVarsFromServer(response.data);
                    
                    resolve({success:true});
                }
                else
                    resolve({success:false, message:response.message});
            }
            catch (e) {
                reject({success:false, message:e.message})
            }
        })
    }

    async verify() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.createFetch('/auth/verify', 'get', null, true);
                const response = await result.json();

                resolve(response);
            }
            catch (e) {
                reject({success:false, message:e.message})
            }
        })
    }

    async login(email, password) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.createFetch('/auth/login', 'post', {email:email, password:password});
                const response = await result.json();

                if (response.success)
                    resolve(response);
                else
                    resolve({success:false, message:response.message});
            }
            catch (e) {
                reject({success:false, message:e.message})
            }
        })
    }

    async getSettings(user=null) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = null;
                if (!user)
                    result = await this.createFetch('/settings/get', 'get', null, true);
                else
                    result = await this.createFetch('/settings/user', 'post', user, true);
                const response = await result.json();

                if (response.success)
                    resolve({success:true, data:response.data});
                else {
                    let settings = this.defaultSettings();
                    settings.movies = response.movies;
                    resolve({success:true, data:settings});
                }
            }
            catch (e) {
                reject({success:false, message:e.message})
            }
        })
    }

    async saveSettings(settings) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.createFetch('/settings/set', 'post', settings, true);
                const response = await result.json();

                if (response.success)
                    resolve({success:true, data:settings});
                else
                    resolve({success:false, message:response.messsage});
            }
            catch (e) {
                reject({success:false, message:e.message})
            }
        })
    }

    async getAllUsers() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.createFetch('/user/all', 'get', null, true);
                const response = await result.json();

                if (response.success)
                    resolve(response);
                else
                    resolve({success:false, message:response.message});
            }
            catch (e) {
                reject({success:false, message:e.message})
            }
        })
    }

    async getProtectedUsers() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.createFetch('/user/protected', 'get');
                const response = await result.json();

                if (response.success)
                    resolve(response);
                else
                    resolve({success:false, message:response.message});
            }
            catch (e) {
                reject({success:false, message:e.message})
            }
        })
    }

    async addUser(userData) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.createFetch('/user/add', 'post', userData, true);
                const response = await result.json();

                if (response.success)
                    resolve(response);
                else
                    resolve({success:false, message:response.message});
            }
            catch (e) {
                reject({success:false, message:e.message})
            }
        })
    }

    async deleteUser(email) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.createFetch('/user/delete', 'post', {email}, true);
                const response = await result.json();

                if (response.success)
                    resolve(response);
                else
                    resolve({success:false, message:response.message});
            }
            catch (e) {
                reject({success:false, message:e.message})
            }
        })
    }
}

export const db = new DB_SERVER();
