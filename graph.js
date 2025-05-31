import { msalConfig, graphScopes } from "./authConfig.js";

// Use the global msal object (from the CDN script)
const msalInstance = new msal.PublicClientApplication(msalConfig);
const account = () => msalInstance.getAllAccounts()[0];

document.getElementById("signin").onclick = async () => {
  await signIn();
};

document.getElementById("file").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file || !account()) return;

  const cat = document.getElementById("cat").value;
  const name = `${new Date().toISOString().replace(/[:.]/g, "")}.jpg`;
  const path = `/Pictures/${cat}/${name}`;

  try {
    const token = await getToken();
    const resp = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${encodeURI(path)}:/content`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: file,
      }
    );

    document.getElementById("status").textContent =
      resp.ok ? `✔ Uploaded: ${cat}/${name}` : `❌ Upload failed: ${resp.status}`;
  } catch (err) {
    document.getElementById("status").textContent = `❌ Error: ${err.message}`;
  }
};

async function signIn() {
  try {
    await msalInstance.loginPopup({ scopes: graphScopes });
    document.getElementById("signin").textContent = "Signed in";
  } catch (err) {
    alert("Sign-in failed: " + err.message);
  }
}

async function getToken() {
  try {
    const res = await msalInstance.acquireTokenSilent({
      account: account(),
      scopes: graphScopes,
    });
    return res.accessToken;
  } catch {
    const res = await msalInstance.acquireTokenPopup({ scopes: graphScopes });
    return res.accessToken;
  }
}
