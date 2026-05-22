import {
  Component, OnDestroy, OnInit, ViewChild, NgZone
} from '@angular/core';
import { APP_MODULES } from '../../app.module';
import { MATERIAL_IMPORTS } from '../../material/material.module';
import { CreateFolderDialogComponent } from '../Dialogue/create-folder-dialog/create-folder-dialog.component';
import { UploadFilesDialogComponent } from '../Dialogue/upload-files-dialog/upload-files-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../Dialogue/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FileserviceService } from '../../Services/fileservice.service';
import { FilePreviewComponent } from '../FilePreview/file-preview/file-preview.component';
import { catchError, finalize, forkJoin, of, Subscription } from 'rxjs';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MobileActionsSheetComponent } from '../Dialogue/mobile-actions-sheet/mobile-actions-sheet.component';

@Component({
  selector: 'app-file-explorer',
  standalone: true,
  imports: [
    ...MATERIAL_IMPORTS,
    ...APP_MODULES,
  ],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.css',
})
export class FileExplorerComponent implements OnInit, OnDestroy {
  constructor(
    public dialog: MatDialog,
    private fileService: FileserviceService,
    private snackBar: MatSnackBar,
    private bottomSheet: MatBottomSheet,
    private ngZone: NgZone
  ) {}

  current_directories: any = [];
  current_files: any = [];
  breadcrumb_paths: string[] = [];
  current_path = '';
  private rootFoldersSubscription: Subscription | undefined;
  private currentFolderSubscription: Subscription | undefined;
  contextMenuTargetType: 'file' | 'folder' | null = null;
  clicked_active_path: string = '';
  clicked_active_item: any = null;

  @ViewChild(MatMenuTrigger) contextMenu!: MatMenuTrigger;

  isUploading = false;
  uploadProgress = 0;

  // Cut/paste clipboard
  clipboard: { type: 'file' | 'folder'; path: string; name: string } | null = null;

  // Long-press state
  private longPressTimer: any = null;
  private longPressDuration = 600; // ms

  get isMobile(): boolean {
    return window.innerWidth < 768;
  }

  contextMenuPosition = { x: '0px', y: '0px' };

  ngOnInit(): void {
    this.restoreNavigationState();

    this.rootFoldersSubscription = this.fileService.rootFolders$.subscribe(
      (folders) => {}
    );
    this.currentFolderSubscription = this.fileService.currentFolder$.subscribe(
      (folder) => {
        if (folder === '') {
          this.breadcrumb_paths = [];
          this.get_all_dir_files('');
        } else {
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

  // ── Card click (single tap on mobile = open, desktop = select) ──────────

  onCardClick(event: MouseEvent, item: any, type: 'file' | 'folder'): void {
    // On touch devices a single tap should open; on desktop dblclick handles it
    if (this.isMobile) {
      if (type === 'folder') this.OnClickDir(item);
      else this.onFileClick(item);
    }
  }

  // ── Long press (mobile) ──────────────────────────────────────────────────

  onTouchStart(event: TouchEvent, item: any, type: 'file' | 'folder'): void {
    this.longPressTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.openMobileActions(item, type);
      });
    }, this.longPressDuration);
  }

  onTouchEnd(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  onTouchMove(): void {
    // Cancel long press if user scrolls
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  openMobileActions(item: any, type: 'file' | 'folder'): void {
    this.contextMenuTargetType = type;
    if (type === 'file') {
      this.clicked_active_path = item.name;
    } else {
      this.clicked_active_path = item;
    }
    this.clicked_active_item = item;

    const ref = this.bottomSheet.open(MobileActionsSheetComponent, {
      data: {
        type,
        name: type === 'file' ? item.name : item,
        hasClipboard: !!this.clipboard,
      },
    });

    ref.afterDismissed().subscribe((action: string) => {
      if (!action) return;
      switch (action) {
        case 'open':
          if (type === 'folder') this.OnClickDir(item);
          else this.onFileClick(item);
          break;
        case 'rename': this.onRename(); break;
        case 'cut': this.onCut(); break;
        case 'paste': this.onPaste(); break;
        case 'download': this.onDownload(); break;
        case 'delete': this.onDelete(); break;
      }
    });
  }

  // ── Context menu (desktop) ───────────────────────────────────────────────

  onContextMenu(event: MouseEvent, item: any, type: 'file' | 'folder'): void {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenuTargetType = type;
    if (type === 'file') {
      this.clicked_active_path = item.name;
    } else {
      this.clicked_active_path = item;
    }
    this.clicked_active_item = item;
    this.contextMenu.menuData = { item, type };
    this.contextMenu.menu!.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  // ── CRUD actions ─────────────────────────────────────────────────────────

  onDelete(): void {
    const name = this.clicked_active_path;
    const type = this.contextMenuTargetType;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: `Delete ${type === 'folder' ? 'Folder' : 'File'}`,
        message: `Are you sure you want to permanently delete "${name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      if (type === 'file') {
        this.fileService
          .deleteFile(this.breadcrumbFullPath + '/' + name)
          .subscribe({
            next: () => {
              this.get_all_dir_files(this.breadcrumbFullPath);
              this.snackBar.open('File deleted', 'Close', { duration: 3000 });
            },
            error: (err) => {
              this.snackBar.open('Failed to delete file', 'Close', { duration: 4000 });
            },
          });
      } else {
        this.fileService
          .deleteDirectory(this.breadcrumbFullPath + '/' + name)
          .subscribe({
            next: () => {
              this.get_all_dir_files(this.breadcrumbFullPath);
              this.snackBar.open('Folder deleted', 'Close', { duration: 3000 });
            },
            error: (err) => {
              this.snackBar.open('Failed to delete folder', 'Close', { duration: 4000 });
            },
          });
      }
    });
  }

  onRename(): void {
    const dialogRef = this.dialog.open(CreateFolderDialogComponent, {
      width: '400px',
      data: {
        mode: 'rename',
        initialName: this.clicked_active_path,
      },
    });

    dialogRef.afterClosed().subscribe((newName) => {
      if (!newName || newName === this.clicked_active_path) return;
      if (this.contextMenuTargetType === 'folder') {
        this.onRenameDirectory(newName);
      } else {
        this.onRenameFile(newName);
      }
    });
  }

  onCut(): void {
    const fullPath = this.breadcrumbFullPath
      ? this.breadcrumbFullPath + '/' + this.clicked_active_path
      : this.clicked_active_path;
    this.clipboard = {
      type: this.contextMenuTargetType!,
      path: fullPath,
      name: this.clicked_active_path,
    };
    this.snackBar.open(`"${this.clicked_active_path}" cut to clipboard`, 'Close', { duration: 3000 });
  }

  onPaste(): void {
    if (!this.clipboard) return;
    const destination = this.breadcrumbFullPath
      ? this.breadcrumbFullPath + '/' + this.clipboard.name
      : this.clipboard.name;

    if (this.clipboard.type === 'folder') {
      this.fileService.renameDirectory(this.clipboard.path, destination).subscribe({
        next: () => {
          this.clipboard = null;
          this.get_all_dir_files(this.breadcrumbFullPath);
          this.snackBar.open('Folder moved successfully', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to move folder', 'Close', { duration: 4000 }),
      });
    } else {
      this.fileService.renameFile(this.clipboard.path, destination).subscribe({
        next: () => {
          this.clipboard = null;
          this.get_all_dir_files(this.breadcrumbFullPath);
          this.snackBar.open('File moved successfully', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to move file', 'Close', { duration: 4000 }),
      });
    }
  }

  onDownload(): void {
    const filePath = this.breadcrumbFullPath
      ? this.breadcrumbFullPath + '/' + this.clicked_active_path
      : this.clicked_active_path;

    this.fileService.getSignedUrl(filePath).subscribe({
      next: (res: any) => {
        const a = document.createElement('a');
        a.href = res.result;
        a.download = this.clicked_active_path;
        a.target = '_blank';
        a.click();
      },
      error: () => this.snackBar.open('Failed to get download link', 'Close', { duration: 4000 }),
    });
  }

  // ── Rename helpers ───────────────────────────────────────────────────────

  onRenameDirectory(newName: string): void {
    const oldName = this.breadcrumbFullPath + '/' + this.clicked_active_path;
    this.fileService.renameDirectory(oldName, newName).subscribe({
      next: () => {
        this.get_all_dir_files(this.breadcrumbFullPath);
        this.snackBar.open('Folder renamed', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to rename folder: ' + (err.error?.detail || err.message), 'Close', { duration: 6000 });
      },
    });
  }

  onRenameFile(newName: string): void {
    const oldName = this.breadcrumbFullPath + '/' + this.clicked_active_path;
    this.fileService.renameFile(oldName, newName).subscribe({
      next: () => {
        this.get_all_dir_files(this.breadcrumbFullPath);
        this.snackBar.open('File renamed', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to rename file: ' + (err.error?.detail || err.message), 'Close', { duration: 6000 });
      },
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  OnClickDir(folderName: string): void {
    this.breadcrumb_paths.push(folderName);
    this.get_all_dir_files(this.breadcrumbFullPath);
  }

  onBreadcrumbClick(index: number): void {
    this.breadcrumb_paths = this.breadcrumb_paths.slice(0, index + 1);
    this.get_all_dir_files(this.breadcrumbFullPath);
  }

  get breadcrumbFullPath(): string {
    return this.breadcrumb_paths.join('/');
  }

  // ── File click / preview ─────────────────────────────────────────────────

  onFileClick(file: any): void {
    const file_url = this.breadcrumb_paths.length === 0
      ? file.name
      : this.breadcrumbFullPath + '/' + file.name;

    this.fileService.getSignedUrl(file_url).subscribe((url: any) => {
      this.dialog.open(FilePreviewComponent, {
        data: { file, url: url.result },
        width: '90vw',
        height: '85vh',
        maxWidth: '1000px',
        maxHeight: '800px',
        panelClass: 'file-preview-dialog',
        autoFocus: false,
      });
    });
  }

  // ── Upload ───────────────────────────────────────────────────────────────

  openCreateFolderDialog(): void {
    const dialogRef = this.dialog.open(CreateFolderDialogComponent, {
      width: '400px',
      data: { mode: 'create' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.create_new_directory(result);
    });
  }

  openUploadFilesDialog(): void {
    const dialogRef = this.dialog.open(UploadFilesDialogComponent, {
      width: '500px',
    });
    dialogRef.afterClosed().subscribe((files: File[] | undefined) => {
      if (files && files.length) this.uploadFiles(files);
    });
  }

  uploadFiles(files: File[]): void {
    this.isUploading = true;
    this.uploadProgress = 0;

    const uploadObservables = files.map((file) =>
      this.fileService.upload(file, this.breadcrumbFullPath).pipe(
        catchError((error) => {
          this.snackBar.open(`Failed to upload ${file.name}`, 'Close', { duration: 5000 });
          return of(null);
        })
      )
    );

    let completedUploads = 0;
    const progressUpdate = () => {
      completedUploads++;
      this.uploadProgress = Math.round((completedUploads / files.length) * 100);
    };

    forkJoin(uploadObservables.map((obs) => obs.pipe(finalize(progressUpdate)))).subscribe({
      next: (results) => {
        const successCount = results.filter((r) => r !== null).length;
        if (successCount > 0) {
          this.get_all_dir_files(this.breadcrumbFullPath);
          this.snackBar.open(`Uploaded ${successCount} of ${files.length} files`, 'Close', { duration: 5000 });
        } else {
          this.snackBar.open('No files were uploaded', 'Close', { duration: 5000 });
        }
      },
      error: () => this.snackBar.open('Upload failed', 'Close', { duration: 5000 }),
      complete: () => {
        this.isUploading = false;
        this.uploadProgress = 0;
      },
    });
  }

  // ── Directory loading ────────────────────────────────────────────────────

  get_all_dir_files(path: string): void {
    this.fileService.get_all_files(path).subscribe((data: any) => {
      this.current_directories = data.result.directories ?? [];
      this.current_files = data.result.files ?? [];
      if (!path) {
        this.fileService.setRootFolders(this.current_directories);
      }
      this.saveNavigationState();
    });
  }

  create_new_directory(name: string): void {
    this.fileService.create_directory(name, this.breadcrumbFullPath).subscribe(() => {
      if (!this.breadcrumbFullPath) {
        this.fileService.addRootFolder(name);
      }
      this.get_all_dir_files(this.breadcrumbFullPath);
    });
  }

  // ── State persistence ────────────────────────────────────────────────────

  private restoreNavigationState(): void {
    const savedPath = localStorage.getItem('fileExplorerCurrentPath');
    if (savedPath) {
      this.breadcrumb_paths = savedPath.split('/').filter((s) => s !== '');
      this.fileService.setCurrentFolder(this.breadcrumbFullPath);
      this.get_all_dir_files(this.breadcrumbFullPath);
    }
  }

  private saveNavigationState(): void {
    localStorage.setItem('fileExplorerCurrentPath', this.breadcrumbFullPath);
  }

  // ── File icon helpers ────────────────────────────────────────────────────

  getFileIconClass(file: any): string {
    const icon = this.getFileIcon(file);
    const iconClassMap: { [key: string]: string } = {
      image: 'image-icon', picture_as_pdf: 'pdf-icon', description: 'document-icon',
      grid_on: 'spreadsheet-icon', slideshow: 'presentation-icon', notes: 'text-icon',
      code: 'code-icon', folder_zip: 'archive-icon', audiotrack: 'audio-icon',
      videocam: 'video-icon', table_chart: 'data-icon',
      settings_applications: 'executable-icon', settings: 'system-icon',
    };
    return iconClassMap[icon] || 'default-icon';
  }

  getFileIcon(file: any): string {
    if (!file?.mimetype && !file?.name) return 'insert_drive_file';
    const mime = file.mimetype?.toLowerCase() || '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const iconMap: { [key: string]: string } = {
      'image/': 'image', pdf: 'picture_as_pdf', 'application/pdf': 'picture_as_pdf',
      doc: 'description', docx: 'description', docm: 'description',
      xls: 'grid_on', xlsx: 'grid_on', xlsm: 'grid_on',
      ppt: 'slideshow', pptx: 'slideshow', pptm: 'slideshow',
      txt: 'notes', rtf: 'notes', log: 'notes', md: 'notes', 'text/': 'notes',
      js: 'code', ts: 'code', html: 'code', css: 'code', py: 'code',
      java: 'code', cpp: 'code', cs: 'code', php: 'code',
      zip: 'folder_zip', rar: 'folder_zip', '7z': 'folder_zip', tar: 'folder_zip', gz: 'folder_zip',
      mp3: 'audiotrack', wav: 'audiotrack', flac: 'audiotrack', 'audio/': 'audiotrack',
      mp4: 'videocam', avi: 'videocam', mov: 'videocam', mkv: 'videocam', 'video/': 'videocam',
      csv: 'table_chart', exe: 'settings_applications', dll: 'settings',
    };
    if (iconMap[ext]) return iconMap[ext];
    for (const pattern in iconMap) {
      if (mime.includes(pattern)) return iconMap[pattern];
    }
    return 'insert_drive_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  ngOnDestroy(): void {
    this.rootFoldersSubscription?.unsubscribe();
    this.currentFolderSubscription?.unsubscribe();
  }
}
