import { msalConfig, graphScopes } from "./authConfig.js";

const msal = new msal.PublicClientApplication(msalConfig);
const account = () => msal.getAllAccounts()[0];

document.getElementById("signin").onclick = async () => {
  await signIn();
};

document.getElementById("file").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file || !account()) { return; }

  const cat   = document.getElementById("cat").value;
  const name  = `${new Date().toISOString().replace(/[:.]/g,"")}.jpg`;
  const path  = `/Pictures/${cat}/${name}`;

  const token = await getToken();
  const resp  = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${encodeURI(path)}:/content`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: file
      });

  document.getElementById("status").textContent =
      resp.ok ? `✔ Uploaded: ${cat}/${name}` : `Upload failed ${resp.status}`;
};

async function signIn() {
  try {
    await msal.loginPopup({ scopes: graphScopes });
    document.getElementById("signin").textContent = "Signed in";
  } catch (err) { alert(err); }
}

async function getToken() {
  try {
    const res = await msal.acquireTokenSilent({ account: account(), scopes: graphScopes });
    return res.accessToken;
  } catch {
    const res = await msal.acquireTokenPopup({ scopes: graphScopes });
    return res.accessToken;
  }
}
