import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PublicClientApplication,
  AccountInfo,
  AuthenticationResult
} from '@azure/msal-browser';

import { msalConfig, graphScopes } from '../../authConfig';

@Component({
  selector: 'app-uploader',
  standalone: true,
  templateUrl: './uploader.html',
  styleUrls: ['./uploader.css'],
  imports: [CommonModule, FormsModule]
})
export class UploaderComponent implements OnInit {
  status   = '';
  signedIn = false;

  /** -------- Folder selection -------- */
  folders: string[] = [
    'Client1',
    'Client2'
  ];
  selectedFolder = this.folders[0];

  /* -------- MSAL set‑up -------- */
  private pca   = new PublicClientApplication(msalConfig);
  private ready = this.pca.initialize();

  private get account(): AccountInfo | null {
    return this.pca.getActiveAccount();
  }

  /* ---------- life‑cycle ---------- */

  async ngOnInit(): Promise<void> {
    await this.ready;

    const redir = await this.pca.handleRedirectPromise();
    if (redir?.account) {
      this.pca.setActiveAccount(redir.account);
      this.signedIn = true;
      return;
    }
    const accts = this.pca.getAllAccounts();
    if (accts.length) {
      this.pca.setActiveAccount(accts[0]);
      this.signedIn = true;
    }
  }

  /* ---------- auth ---------- */

  async signIn(): Promise<void> {
    await this.ready;
    const res: AuthenticationResult =
      await this.pca.loginPopup({ scopes: graphScopes });

    const acct = res.account ?? this.pca.getAllAccounts()[0];
    if (acct) {
      this.pca.setActiveAccount(acct);
      this.signedIn = true;
    } else {
      this.status = '❌ Login failed – no account returned.';
    }
  }

  /* ---------- upload ---------- */

  async onFile(evt: Event): Promise<void> {
    await this.ready;

    const input = evt.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file || !this.account) {
      this.status = '❌ Please sign in before uploading.';
      return;
    }

    const name     = new Date().toISOString().replace(/[:.]/g, '') + '.png';
    const fullPath = `/Pictures/${this.selectedFolder}/${name}`;  // ← folder from dropdown

    try {
      const token = await this.getToken();

      const uploadUrl =
        `https://graph.microsoft.com/v1.0/me/drive/root:${encodeURI(fullPath)}:/content`;

      const resp = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`${resp.status}: ${txt}`);
      }
      this.status = `✔ Uploaded ${name} to ${this.selectedFolder}`;
    } catch (err: any) {
      this.status = `Error: ${err.message}`;
    }
  }

  /* ---------- helpers ---------- */

  private async getToken(): Promise<string> {
    await this.ready;
    try {
      const r = await this.pca.acquireTokenSilent({
        account: this.account!,
        scopes : graphScopes
      });
      return r.accessToken;
    } catch {
      const r = await this.pca.acquireTokenPopup({ scopes: graphScopes });
      return r.accessToken;
    }
  }
}
