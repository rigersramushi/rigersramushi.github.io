export const msalConfig = {
  auth: {
    clientId: "c0b18728-14e5-4ac9-941a-d50180587e97",
    authority: "https://login.microsoftonline.com/consumers",
    redirectUri: "https://rigersramushi.github.io/"
  },
  cache: {
    cacheLocation: "sessionStorage"
  }
};

export const graphScopes = ["Files.ReadWrite", "offline_access"];
