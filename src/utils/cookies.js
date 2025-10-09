// This constant holds the name of our authentication cookie.
// Exporting it ensures we use the exact same name everywhere in the app.
export const AUTH_USER = 'news_app_auth_user';

/**
 * Sets a cookie in the browser.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value to store.
 * @param {number} days - The number of days until the cookie expires.
 */
export function setCookie(name, value, days = 7) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

/**
 * Gets a cookie's value by its name.
 * @param {string} name - The name of the cookie.
 * @returns {string|null} The cookie's value or null if not found.
 */
export function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

/**
 * Removes a cookie by its name.
 * @param {string} name - The name of the cookie to remove.
 */
export function removeCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999; path=/';
}