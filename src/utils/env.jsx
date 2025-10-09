/**
 * Retrieves an environment variable. It prioritizes variables loaded by Vite.
 * Vite exposes env variables on the `import.meta.env` object.
 * * @param {string} name - The name of the environment variable (e.g., "SERVER_URL").
 * @returns {string|undefined} The value of the environment variable.
 */
export function getEnvVariable(name) {
    // Vite requires env variables exposed to the client to be prefixed with `VITE_`
    const varName = name.startsWith('VITE_') ? name : `VITE_${name}`;
    return import.meta.env[varName];
}