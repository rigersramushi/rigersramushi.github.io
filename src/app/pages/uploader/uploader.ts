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
  isUploading = false;
  isLoadingFolders = false;
  selectedFile: File | null = null;
  selectedFileName = '';

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
      await this.loadFolders();
      return;
    }

    const accts = this.pca.getAllAccounts();
    if (accts.length) {
      this.pca.setActiveAccount(accts[0]);
      this.signedIn = true;
      await this.loadFolders();
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
      await this.loadFolders();
    } else {
      this.status = '❌ Accesso non riuscito: nessun account disponibile.';
    }
  }

  /* ---------- upload ---------- */

  async onFile(evt: Event): Promise<void> {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.status = `File selezionato: ${file.name}. Premi "Carica ora" per continuare.`;
  }

  async uploadSelectedFile(): Promise<void> {
    await this.ready;

    const file = this.selectedFile;
    if (!file) {
      this.status = '❌ Seleziona prima una foto o un file.';
      return;
    }

    if (!this.account) {
      this.status = '❌ Accedi prima di caricare un file.';
      return;
    }

    const name     = new Date().toISOString().replace(/[:.]/g, '') + '.png';
    const fullPath = `/Pictures/${this.selectedFolder}/${name}`;

    this.isUploading = true;
    this.status = 'Caricamento in corso...';

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

      this.status = `✔ File caricato in ${this.selectedFolder}: ${name}`;
      this.selectedFile = null;
      this.selectedFileName = '';
    } catch (err: any) {
      this.status = `❌ Errore durante il caricamento: ${err.message}`;
    } finally {
      this.isUploading = false;
    }
  }

  /* ---------- helpers ---------- */

  private async loadFolders(): Promise<void> {
    if (!this.account) {
      return;
    }

    this.isLoadingFolders = true;

    try {
      const token = await this.getToken();
      const resp = await fetch(
        'https://graph.microsoft.com/v1.0/me/drive/root:/Pictures:/children?$select=name,folder',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`${resp.status}: ${txt}`);
      }

      const data = await resp.json();
      const folderNames = (data.value ?? [])
        .filter((item: any) => !!item.folder)
        .map((item: any) => item.name)
        .filter((name: string) => !!name);

      if (folderNames.length) {
        this.folders = folderNames;
        if (!this.folders.includes(this.selectedFolder)) {
          this.selectedFolder = this.folders[0];
        }
        this.status = '✔ Cartelle caricate automaticamente da OneDrive.';
      } else {
        this.status = '⚠️ Nessuna sottocartella trovata in OneDrive / Immagini.';
      }
    } catch (err: any) {
      this.status = `⚠️ Impossibile caricare dinamicamente le cartelle: ${err.message}`;
    } finally {
      this.isLoadingFolders = false;
    }
  }

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
