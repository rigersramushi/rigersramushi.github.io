export const msalConfig = {
  auth: {
    clientId: "ac2caf92-d690-42d9-a731-2eaceaa9fb74",
    authority: "https://login.microsoftonline.com/b1fbc6e5-5c4b-45bd-ad4c-4556e0b49d61",
    redirectUri: "https://rigersramushi.github.io/"
  },
  cache: {
    cacheLocation: "sessionStorage"
  }
};

export const graphScopes = ["Files.ReadWrite", "offline_access"];
