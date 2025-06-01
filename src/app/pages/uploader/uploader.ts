// src/app/pages/uploader/uploader.component.ts
import { Component } from '@angular/core';
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
export class UploaderComponent {
  category = 'Client1';
  status   = '';
  signedIn = false;

  /** MSAL v3 requires initialize() once */
  private pca   = new PublicClientApplication(msalConfig);
  private ready = this.pca.initialize();               // ← initialise async

  private get account(): AccountInfo | null {
    return this.pca.getAllAccounts()[0] ?? null;
  }

  /* ---------- UI actions ---------- */

  async signIn(): Promise<void> {
    await this.ready;                                  // ensure MSAL ready
    await this.pca.loginPopup({ scopes: graphScopes });
    this.signedIn = true;
  }

  async onFile(evt: Event): Promise<void> {
    await this.ready;
    const input = evt.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file || !this.account) return;

    const name = new Date().toISOString().replace(/[:.]/g, '') + '.jpg';
    const path = `/Pictures/${this.category}/${name}`;

    try {
      const token = await this.getToken();
      const resp  = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:${encodeURI(path)}:/content`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
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
