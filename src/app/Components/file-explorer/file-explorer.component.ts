import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { APP_MODULES } from '../../app.module';
import { MATERIAL_IMPORTS } from '../../material/material.module';
import { CreateFolderDialogComponent } from '../Dialogue/create-folder-dialog/create-folder-dialog.component';
import { UploadFilesDialogComponent } from '../Dialogue/upload-files-dialog/upload-files-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FileserviceService } from '../../Services/fileservice.service';
import { FilePreviewComponent } from '../FilePreview/file-preview/file-preview.component';
import { Subscription } from 'rxjs';
import { MatMenuTrigger } from '@angular/material/menu';

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
    private fileSerivce: FileserviceService
  ) {}
  current_directories: any = [];
  current_files: any = [];
  breadcrumb_paths: string[] = [];
  current_path = '';
  private rootFoldersSubscription: Subscription | undefined;
  private currentFolderSubscription: Subscription | undefined;

  @ViewChild(MatMenuTrigger)
  contextMenu: MatMenuTrigger;


  ngOnInit(): void {
    this.rootFoldersSubscription = this.fileSerivce.rootFolders$.subscribe(
      (folders) => {}
    );
    this.currentFolderSubscription = this.fileSerivce.currentFolder$.subscribe(
      (folder) => {
        if (folder === '') {
          // Navigate to home
          this.breadcrumb_paths = [];
          this.get_all_dir_files('');
        } else {
          // Navigate to specific folder
          this.breadcrumb_paths = [folder];
          this.get_all_dir_files(folder);
        }
      }
    );
  }
  ngAfterViewInit(): void {
    this.get_all_dir_files('');
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
    });
  }
  create_new_directory(name: string) {
    this.fileSerivce
      .create_directory(name, this.breadcrumbFullPath)
      .subscribe((data: any) => {
        this.current_directories.push(name);
        if (!this.breadcrumbFullPath) {
          this.fileSerivce.addRootFolder(name);
        }
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
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Creating folder:', result);

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

        files.forEach((file) => {
          this.fileSerivce
            .upload(file, this.breadcrumbFullPath)
            .subscribe((data: any) => {
              console.log(data);
            });

          // const type = this.getFileTypeFromExtension(file.name);
          // this.files.push({
          //   name: file.name,
          //   size: this.formatFileSize(file.size),
          //   date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          //   type: type
          // });
        });
      }
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
    // return file;
    this.dialog.open(FilePreviewComponent, {
      data: file,
      width: '80vw', // Better to use viewport units
      height: '80vh',
      maxWidth: '1000px', // Set maximum dimensions
      maxHeight: '800px',
      panelClass: 'file-preview-dialog',
      autoFocus: false,
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
  ngOnDestroy(): void {
    this.rootFoldersSubscription?.unsubscribe();
    this.currentFolderSubscription?.unsubscribe();
  }



  contextMenuPosition = { x: '0px', y: '0px' };

  onContextMenu(event: MouseEvent, item: any) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { 'item': item };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }
}
