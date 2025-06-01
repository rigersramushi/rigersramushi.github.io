export const msalConfig = {
  auth: {
    clientId: "ac2caf92-d690-42d9-a731-2eaceaa9fb74",
    authority: "https://login.microsoftonline.com/a20cc188-b4b8-4f19-97e6-3e1724e52d1c",
    redirectUri: "https://rigersramushi.github.io/"
  },
  cache: {
    cacheLocation: "sessionStorage"
  }
};

export const graphScopes = ["Files.ReadWrite", "offline_access"];
