let envVarsFromServer = {};

export function setEnvVarsFromServer(lst) {
    envVarsFromServer = {...lst};
}

export function envVar(key) {
    if (!key.toUpperCase().startsWith("VITE_"))
        key = `VITE_${key}`;
    
    const varKey = `${key.toUpperCase()}`;

    return envVarsFromServer[varKey] || import.meta.env[varKey];
}

