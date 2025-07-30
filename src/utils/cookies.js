export const AUTH_COOKIE_NAME = 'authuser'

export function createCookie(name, value, expHours = 24 * 7) {
    const d = new Date();
    d.setTime(d.getTime() + (expHours * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

export function getCookie(cookieKey) {
    const cookies = document.cookie.split(';');
 
    for (let cookie of cookies) {
        const [key, val] = cookie.trim().split('=');
        
        if (key === cookieKey) 
            return val;
    }

    return null;
}

export function deleteCookie(name) {
    createCookie(name, 0, 0);
}
