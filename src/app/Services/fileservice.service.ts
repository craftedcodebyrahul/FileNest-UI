import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { url_constants } from './url_constants';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

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
  // Add to FileserviceService

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
    );
  }
  deleteDirectory(dirPath: string) {
    return this.http.delete(
      `${environment.API_URL}${url_constants.file.delete_dir}`,
      { body: { dir_path: dirPath } }
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
