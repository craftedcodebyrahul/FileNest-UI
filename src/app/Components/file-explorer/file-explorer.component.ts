import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { APP_MODULES } from '../../app.module';
import { MATERIAL_IMPORTS } from '../../material/material.module';
import { CreateFolderDialogComponent } from '../Dialogue/create-folder-dialog/create-folder-dialog.component';
import { UploadFilesDialogComponent } from '../Dialogue/upload-files-dialog/upload-files-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FileserviceService } from '../../Services/fileservice.service';
import { FilePreviewComponent } from '../FilePreview/file-preview/file-preview.component';
import { catchError, finalize, forkJoin, of, Subscription } from 'rxjs';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { error } from 'console';

@Component({
  selector: 'app-file-explorer',
  standalone: true,
  imports: [
    ...MATERIAL_IMPORTS,
    ...APP_MODULES,
    CreateFolderDialogComponent,
    UploadFilesDialogComponent,
    FilePreviewComponent,
  ],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.css',
})
export class FileExplorerComponent implements OnInit, OnDestroy {
  constructor(
    public dialog: MatDialog,
    private fileSerivce: FileserviceService,
    private snackBar: MatSnackBar
  ) {}
  current_directories: any = [];
  current_files: any = [];
  breadcrumb_paths: string[] = [];
  current_path = '';
  private rootFoldersSubscription: Subscription | undefined;
  private currentFolderSubscription: Subscription | undefined;
  contextMenuTargetType: 'file' | 'folder' | null = null;
  clicked_active_path: string;
  @ViewChild(MatMenuTrigger)
  contextMenu: MatMenuTrigger;
  isUploading = false;
  uploadProgress = 0;

  ngOnInit(): void {
    this.restoreNavigationState();

    this.rootFoldersSubscription = this.fileSerivce.rootFolders$.subscribe(
      (folders) => {}
    );
    this.currentFolderSubscription = this.fileSerivce.currentFolder$.subscribe(
      (folder) => {
        if (folder === '') {
          // Navigate to home
          // if (this.breadcrumb_paths.length === 0) {
          // Only reset if nothing was restored
          this.breadcrumb_paths = [];
          this.get_all_dir_files('');
          // }
        } else {
          // Navigate to specific folder
          this.breadcrumb_paths = [folder];
          this.get_all_dir_files(folder);
        }
      }
    );
  }
  ngAfterViewInit(): void {
    if (this.breadcrumb_paths.length === 0) {
      this.get_all_dir_files('');
    }
  }

  getFileIconClass(file: any): string {
    const icon = this.getFileIcon(file);

    // Map icons to CSS classes
    const iconClassMap: { [key: string]: string } = {
      image: 'image-icon',
      picture_as_pdf: 'pdf-icon',
      description: 'document-icon',
      grid_on: 'spreadsheet-icon',
      slideshow: 'presentation-icon',
      notes: 'text-icon',
      code: 'code-icon',
      folder_zip: 'archive-icon',
      audiotrack: 'audio-icon',
      videocam: 'video-icon',
      table_chart: 'data-icon',
      settings_applications: 'executable-icon',
      settings: 'system-icon',
    };

    return iconClassMap[icon] || 'default-icon';
  }

  openCreateFolderDialog(): void {
    const dialogRef = this.dialog.open(CreateFolderDialogComponent, {
      width: '400px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.create_new_directory(result);
      }
    });
  }
  openUploadFilesDialog(): void {
    const dialogRef = this.dialog.open(UploadFilesDialogComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((files: File[] | undefined) => {
      if (files && files.length) {
        console.log('Uploading files:', files);
        this.uploadFiles(files);
      }
    });
  }

  uploadFiles(files: File[]) {
    this.isUploading = true;
    this.uploadProgress = 0;

    // Create an array of upload observables
    const uploadObservables = files.map((file) => {
      return this.fileSerivce.upload(file, this.breadcrumbFullPath).pipe(
        catchError((error) => {
          // Handle individual upload errors without breaking the whole process
          console.error(`Failed to upload ${file.name}:`, error);
          this.snackBar.open(`Failed to upload ${file.name}`, 'Close', {
            duration: 5000,
          });
          return of(null); // Return null for failed uploads
        })
      );
    });

    // Calculate progress
    let completedUploads = 0;
    const progressUpdate = () => {
      completedUploads++;
      this.uploadProgress = Math.round((completedUploads / files.length) * 100);
    };

    // Execute all uploads in parallel
    forkJoin(
      uploadObservables.map((obs) => obs.pipe(finalize(progressUpdate)))
    ).subscribe({
      next: (results) => {
        // Count successful uploads
        const successfulUploads = results.filter(
          (result) => result !== null
        ).length;

        if (successfulUploads > 0) {
          // Only refresh the file list once after all uploads are done
          this.get_all_dir_files(this.breadcrumbFullPath);

          // Show success message
          this.snackBar.open(
            `Successfully uploaded ${successfulUploads} of ${files.length} files`,
            'Close',
            { duration: 5000 }
          );
        } else {
          this.snackBar.open('No files were uploaded successfully', 'Close', {
            duration: 5000,
          });
        }
      },
      error: (error) => {
        console.error('Upload process failed:', error);
        this.snackBar.open('Upload process failed', 'Close', {
          duration: 5000,
        });
      },
      complete: () => {
        this.isUploading = false;
        this.uploadProgress = 0;
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    const unit = sizes[i];
    return `${size} ${unit}`;
  }
  get breadcrumbFullPath(): string {
    return this.breadcrumb_paths.join('/');
  }

  onFileClick(file: any): any {
    debugger;
    var file_url =
      this.breadcrumb_paths.length == 0
        ? file.name
        : this.breadcrumbFullPath + '/' + file.name;
    this.fileSerivce.getSignedUrl(file_url).subscribe((url: any) => {
      this.dialog.open(FilePreviewComponent, {
        data: { file: file, url: url.result },
        width: '80vw', // Better to use viewport units
        height: '80vh',
        maxWidth: '1000px', // Set maximum dimensions
        maxHeight: '800px',
        panelClass: 'file-preview-dialog',
        autoFocus: false,
      });
    });
  }

  // Add this to your component class
  getFileIcon(file: any): string {
    if (!file?.mimetype && !file?.name) return 'insert_drive_file';

    const mime = file.mimetype?.toLowerCase() || '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // File type mapping
    const iconMap: { [key: string]: string } = {
      // Images
      'image/': 'image',

      // Documents
      pdf: 'picture_as_pdf',
      'application/pdf': 'picture_as_pdf',

      // Word
      doc: 'description',
      docx: 'description',
      docm: 'description',
      dotx: 'description',
      'application/msword': 'description',
      'application/vnd.openxmlformats-officedocument.wordprocessingml':
        'description',

      // Excel
      xls: 'grid_on',
      xlsx: 'grid_on',
      xlsm: 'grid_on',
      xltx: 'grid_on',
      'application/vnd.ms-excel': 'grid_on',
      'application/vnd.openxmlformats-officedocument.spreadsheetml': 'grid_on',

      // PowerPoint
      ppt: 'slideshow',
      pptx: 'slideshow',
      pptm: 'slideshow',
      potx: 'slideshow',
      'application/vnd.ms-powerpoint': 'slideshow',
      'application/vnd.openxmlformats-officedocument.presentationml':
        'slideshow',

      // Text
      txt: 'notes',
      rtf: 'notes',
      log: 'notes',
      md: 'notes',
      'text/': 'notes',

      // Code
      js: 'code',
      ts: 'code',
      html: 'code',
      css: 'code',
      scss: 'code',
      py: 'code',
      java: 'code',
      cpp: 'code',
      cs: 'code',
      php: 'code',

      // Archives
      zip: 'folder_zip',
      rar: 'folder_zip',
      '7z': 'folder_zip',
      tar: 'folder_zip',
      gz: 'folder_zip',
      'application/zip': 'folder_zip',
      'application/x-rar-compressed': 'folder_zip',
      'application/x-tar': 'folder_zip',
      'application/gzip': 'folder_zip',

      // Audio
      mp3: 'audiotrack',
      wav: 'audiotrack',
      flac: 'audiotrack',
      aac: 'audiotrack',
      ogg: 'audiotrack',
      'audio/': 'audiotrack',

      // Video
      mp4: 'videocam',
      avi: 'videocam',
      mov: 'videocam',
      mkv: 'videocam',
      flv: 'videocam',
      'video/': 'videocam',

      // Data
      csv: 'table_chart',
      'application/csv': 'table_chart',

      // Executables
      exe: 'settings_applications',
      msi: 'settings_applications',
      app: 'settings_applications',
      dmg: 'settings_applications',

      // System files
      dll: 'settings',
      sys: 'settings',
      ini: 'settings',
      cfg: 'settings',
    };

    // Check for direct matches first
    if (iconMap[ext]) return iconMap[ext];

    // Check for MIME type patterns
    for (const pattern in iconMap) {
      if (mime.includes(pattern)) {
        return iconMap[pattern];
      }
    }

    // Default icon
    return 'insert_drive_file';
  }

  contextMenuPosition = { x: '0px', y: '0px' };

  onContextMenu(event: MouseEvent, item: any, type: 'file' | 'folder') {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { item: item, type: type };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
    this.contextMenuTargetType = type;
    // console.log(item);
    if (type === 'file') {
      this.clicked_active_path = item.name;
    } else {
      this.clicked_active_path = item;
    }
  }
  OnDeleteFile() {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this file?'
    );
    if (!confirmDelete) {
      return; // user canceled
    }
    this.fileSerivce
      .deleteFile(this.breadcrumbFullPath + '/' + this.clicked_active_path)
      .subscribe(() => {
        this.get_all_dir_files(this.breadcrumbFullPath);
        this.snackBar.open('File deleted successfully', 'Close', {
          duration: 3000,
        });
      });
  }
  OnDeleteDirectory() {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this directory?'
    );
    if (!confirmDelete) {
      return; // user canceled
    }
    this.fileSerivce
      .deleteDirectory(this.breadcrumbFullPath + '/' + this.clicked_active_path)
      .subscribe(() => {
        this.get_all_dir_files(this.breadcrumbFullPath);
        this.snackBar.open('Directory deleted successfully', 'Close', {
          duration: 3000,
        });
      });
  }

  onDelete() {
    if (this.contextMenuTargetType === 'file') {
      this.OnDeleteFile();
    } else if (this.contextMenuTargetType === 'folder') {
      this.OnDeleteDirectory();
    }
  }

  private restoreNavigationState(): void {
    const savedPath = localStorage.getItem('fileExplorerCurrentPath');
    if (savedPath) {
      this.breadcrumb_paths = savedPath
        .split('/')
        .filter((segment) => segment !== '');
      this.fileSerivce.setCurrentFolder(this.breadcrumbFullPath); // <--
      this.get_all_dir_files(this.breadcrumbFullPath);
    }
  }

  // Save navigation state to localStorage
  private saveNavigationState(): void {
    localStorage.setItem('fileExplorerCurrentPath', this.breadcrumbFullPath);
  }

  get_all_dir_files(path: string) {
    this.fileSerivce.get_all_files(path).subscribe((data: any) => {
      console.log(data);
      this.current_directories = data.result.directories
        ? data.result.directories
        : [];
      this.current_files = data.result.files ? data.result.files : [];
      if (!path) {
        this.fileSerivce.setRootFolders(this.current_directories);
      }

      // Save the current path after loading directory contents
      this.saveNavigationState();
    });
  }

  create_new_directory(name: string) {
    this.fileSerivce
      .create_directory(name, this.breadcrumbFullPath)
      .subscribe((data: any) => {
        // this.current_directories.push(name);
        if (!this.breadcrumbFullPath) {
          this.fileSerivce.addRootFolder(name);
        }
        this.get_all_dir_files(this.breadcrumbFullPath);
      });
  }

  OnClickDir(folderName: string) {
    this.breadcrumb_paths.push(folderName);
    this.get_all_dir_files(this.breadcrumbFullPath);
  }

  onBreadcrumbClick(index: number) {
    this.breadcrumb_paths = this.breadcrumb_paths.slice(0, index + 1);
    this.get_all_dir_files(this.breadcrumbFullPath);
  }

  // ... rest of your existing methods remain the same ...

  ngOnDestroy(): void {
    this.rootFoldersSubscription?.unsubscribe();
    this.currentFolderSubscription?.unsubscribe();
  }

  onRenameDirectory(newName: string) {
    const oldName = this.breadcrumbFullPath + '/' + this.clicked_active_path;

    this.fileSerivce.renameDirectory(oldName, newName).subscribe({
    next: res => {
      this.get_all_dir_files(this.breadcrumbFullPath);
      this.snackBar.open('Directory renamed successfully', 'Close', {
        duration: 3000,
      });
    },
    error: err => {
      console.error('Error renaming directory:', err);
      this.snackBar.open('Failed to rename directory: ' + err.error.detail, 'Close', {
        duration: 6000,
      });
    }
  });
  }
  onRenameFile(newName: string) {
    const oldName = this.breadcrumbFullPath + '/' + this.clicked_active_path;

    this.fileSerivce.renameFile(oldName, newName).subscribe({
      next: res => {
        this.get_all_dir_files(this.breadcrumbFullPath);
        this.snackBar.open('File renamed successfully', 'Close', {
          duration: 3000,
        });
      },
      error: err => {
        console.error('Error renaming file:', err);
        this.snackBar.open('Failed to rename file: ' + err.error.detail, 'Close', {
          duration: 6000,
        });
      }
    });
  }
  onRename( ) {
    const dialogRef = this.dialog.open(CreateFolderDialogComponent, {
      width: '400px',
      data: {
        mode: 'rename',
        initialName: this.clicked_active_path,
      },
    });

    dialogRef.afterClosed().subscribe((newName) => {
      if (newName && newName !== this.clicked_active_path) {
        if (this.contextMenuTargetType === 'folder') {
          this.onRenameDirectory(newName);
        } else {
          this.onRenameFile(newName);
        }
      }
    });
  }
}
