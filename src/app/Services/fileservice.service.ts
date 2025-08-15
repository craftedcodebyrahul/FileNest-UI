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
  private currentFolderSubject = new BehaviorSubject<string>('');
  currentFolder$ = this.currentFolderSubject.asObservable();

  setCurrentFolder(folder: string): void {
    this.currentFolderSubject.next(folder);
  }
}
