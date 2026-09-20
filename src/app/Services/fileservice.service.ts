import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { url_constants } from './url_constants';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FileserviceService {
  constructor(private http: HttpClient, private router: Router) {}

  upload(file: File, path: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    return this.http.post(
      `${environment.API_URL}${url_constants.file.upload}`,
      formData
    ).pipe(
      tap(() => this.refreshStorage())
    );
  }

  get_all_files(path: string) {
    return this.http.get(
      `${environment.API_URL}${url_constants.file.get_all_files}?path=${path}`
    );
  }
  create_directory(name: string, path: string) {
    const formData = new FormData();
    formData.append('dir_name', name);
    formData.append('path', path);

    return this.http.post(
      `${environment.API_URL}${url_constants.file.create_directory}`,
      formData
    );
  }

  private rootFoldersSubject = new BehaviorSubject<string[]>([]);
  rootFolders$ = this.rootFoldersSubject.asObservable();

  setRootFolders(folders: string[]): void {
    this.rootFoldersSubject.next(folders);
  }

  addRootFolder(folder: string): void {
    const current = this.rootFoldersSubject.value;
    this.rootFoldersSubject.next([...current, folder]);
  }

  // App navigation view and search queries
  private currentViewSubject = new BehaviorSubject<'home' | 'recent' | 'starred' | 'trash'>('home');
  currentView$ = this.currentViewSubject.asObservable();

  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  setCurrentView(view: 'home' | 'recent' | 'starred' | 'trash'): void {
    this.currentViewSubject.next(view);
  }

  setSearchQuery(query: string): void {
    this.searchQuerySubject.next(query);
  }

  // Storage Stats API
  storageUpdated$ = new BehaviorSubject<void>(undefined);

  refreshStorage(): void {
    this.storageUpdated$.next();
  }

  getStorageInfo() {
    return this.http.get(`${environment.API_URL}file/storage_info`);
  }

  // Starred / Recent config file metadata
  config: { starred: any[]; recent: any[] } = { starred: [], recent: [] };
  private configSubject = new BehaviorSubject<{ starred: any[]; recent: any[] }>(this.config);
  config$ = this.configSubject.asObservable();

  loadConfig(): void {
    if (!localStorage.getItem('token')) return;
    this.getSignedUrl('.filenest_config.json').subscribe({
      next: (res: any) => {
        this.http.get(res.result).subscribe({
          next: (data: any) => {
            if (data && (data.starred || data.recent)) {
              this.config = {
                starred: data.starred || [],
                recent: data.recent || []
              };
              this.configSubject.next(this.config);
            }
          },
          error: (err) => {
            console.log('No config file or error fetching:', err);
          }
        });
      },
      error: (err) => {
        console.log('Config signed URL error:', err);
      }
    });
  }

  saveConfig(): void {
    const jsonStr = JSON.stringify(this.config);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const file = new File([blob], '.filenest_config.json', { type: 'application/json' });
    this.upload(file, '').subscribe({
      next: () => {
        this.configSubject.next(this.config);
      },
      error: (err) => {
        console.error('Failed to save config:', err);
      }
    });
  }

  toggleStar(item: any, type: 'file' | 'folder'): void {
    const path = type === 'file' ? item.fullPath : item;
    const idx = this.config.starred.findIndex(s => (s.type === 'file' ? s.fullPath : s.name) === path);
    if (idx > -1) {
      this.config.starred.splice(idx, 1);
    } else {
      this.config.starred.push({
        type,
        name: type === 'file' ? item.name : item,
        fullPath: type === 'file' ? item.fullPath : item,
        size: item.size,
        mimetype: item.mimetype,
        updatedAt: item.updatedAt
      });
    }
    this.saveConfig();
  }

  isStarred(path: string, type: 'file' | 'folder'): boolean {
    return this.config.starred.some(s => {
      if (type === 'file') {
        return s.type === 'file' && s.fullPath === path;
      } else {
        return s.type === 'folder' && s.name === path;
      }
    });
  }

  addToRecent(file: any): void {
    const existingIdx = this.config.recent.findIndex(f => f.fullPath === file.fullPath);
    if (existingIdx > -1) {
      this.config.recent.splice(existingIdx, 1);
    }
    this.config.recent.unshift(file);
    if (this.config.recent.length > 50) {
      this.config.recent = this.config.recent.slice(0, 50);
    }
    this.saveConfig();
  }

  onFileDeleted(filePath: string): void {
    this.config.starred = this.config.starred.filter(s => s.fullPath !== filePath && s.name !== filePath);
    this.config.recent = this.config.recent.filter(f => f.fullPath !== filePath);
    this.saveConfig();
  }

  onFileRenamed(oldPath: string, newPath: string): void {
    this.config.starred.forEach(s => {
      if (s.type === 'file' && s.fullPath === oldPath) {
        s.fullPath = newPath;
        s.name = newPath.split('/').pop() || s.name;
      } else if (s.type === 'folder' && s.name === oldPath) {
        s.name = newPath;
        s.fullPath = newPath;
      }
    });
    const recentItem = this.config.recent.find(f => f.fullPath === oldPath);
    if (recentItem) {
      recentItem.fullPath = newPath;
      recentItem.name = newPath.split('/').pop() || recentItem.name;
    }
    this.saveConfig();
  }

  private currentFolderSubject = new BehaviorSubject<string>(
    localStorage.getItem('fileExplorerCurrentPath') || ''
  );
  currentFolder$ = this.currentFolderSubject.asObservable();

  setCurrentFolder(folder: string): void {
    this.currentFolderSubject.next(folder);
  }

  deleteFile(filePath: string) {
    return this.http.delete(
      `${environment.API_URL}${url_constants.file.delete_file}`,
      { body: { file_path: filePath } }
    ).pipe(
      tap(() => this.refreshStorage())
    );
  }

  deleteDirectory(dirPath: string) {
    return this.http.delete(
      `${environment.API_URL}${url_constants.file.delete_dir}`,
      { body: { dir_path: dirPath } }
    ).pipe(
      tap(() => this.refreshStorage())
    );
  }


  getSignedUrl(filePath: string) {
    return this.http.get(
      `${environment.API_URL}${url_constants.file.get_signed_url}?file_path=${filePath}`
    );
  }

  renameDirectory(oldPath: string, newName: string) {
    const formData = new FormData();
    formData.append('old_dir_path', oldPath);
    formData.append('new_dir_name', newName);

    return this.http.post(
      `${environment.API_URL}${url_constants.file.rename_dir}`,
      formData
    );
  }

  renameFile(oldPath: string, newName: string) {
    const formData = new FormData();
    formData.append('old_file_path', oldPath);
    formData.append('new_file_name', newName);

    return this.http.post(
      `${environment.API_URL}${url_constants.file.rename_file}`,
      formData
    );
  }
}
