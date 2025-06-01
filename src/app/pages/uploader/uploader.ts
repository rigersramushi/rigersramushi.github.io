// src/app/pages/uploader/uploader.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PublicClientApplication,
  AccountInfo
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
  category = 'Client1';
  status   = '';
  signedIn = false;

  /** MSAL v3 requires initialize() once */
  private pca   = new PublicClientApplication(msalConfig);
  private ready = this.pca.initialize();               // ← initialise async

  private get account(): AccountInfo | null {
    return this.pca.getActiveAccount();
  }

  /* ---------- On Init ---------- */

  async ngOnInit(): Promise<void> {
    await this.ready;
    const accounts = this.pca.getAllAccounts();
    if (accounts.length > 0) {
      this.pca.setActiveAccount(accounts[0]);
      this.signedIn = true;
    }
  }

  /* ---------- UI actions ---------- */

  async signIn(): Promise<void> {
    await this.ready;
    const result = await this.pca.loginPopup({ scopes: graphScopes });
    const account = result.account ?? this.pca.getAllAccounts()[0];

    if (account) {
      this.pca.setActiveAccount(account);
      this.signedIn = true;
    } else {
      this.status = '❌ Login failed: No account returned.';
    }
  }

  async onFile(evt: Event): Promise<void> {
    await this.ready;
    const input = evt.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file || !this.account) {
      this.status = '❌ Please sign in before uploading.';
      return;
    }

    const name = new Date().toISOString().replace(/[:.]/g, '') + '.jpg';
    const path = `/Pictures/${this.category}/${name}`;

    try {
      const token = await this.getToken();
      const resp  = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:${encodeURI(path)}:/content`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': file.type || 'image/jpeg'
          },
          body: file
        }
      );

      this.status = resp.ok
        ? `✔ Uploaded ${name}`
        : `❌ Upload failed (${resp.status})`;
    } catch (err: any) {
      this.status = `Error: ${err.message}`;
    }
  }

  /* ---------- helpers ---------- */

  private async getToken(): Promise<string> {
    await this.ready;
    try {
      const res = await this.pca.acquireTokenSilent({
        account: this.account!,
        scopes : graphScopes
      });
      return res.accessToken;
    } catch {
      const res = await this.pca.acquireTokenPopup({ scopes: graphScopes });
      return res.accessToken;
    }
  }
}
