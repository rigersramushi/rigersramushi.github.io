// paste your GUIDs from the portal
export const msalConfig = {
    auth: {
      clientId: "YOUR_CLIENT_ID",
      authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
      redirectUri: "https://rigersramushi.github.io/"   // or your repo path
    },
    cache: { cacheLocation: "sessionStorage" }
  };
  
  export const graphScopes = ["Files.ReadWrite", "offline_access"];
  