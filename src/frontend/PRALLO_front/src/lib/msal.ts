import { PublicClientApplication, type Configuration } from '@azure/msal-browser'

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID as string,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI ?? window.location.origin,
    // CRITIQUE : empêche MSAL de naviguer vers l'URL stockée après le redirect
    // (sinon il recharge la page avant que handleRedirectPromise() puisse résoudre)
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

export const msalInstance = new PublicClientApplication(msalConfig)

await msalInstance.initialize()

export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
}
