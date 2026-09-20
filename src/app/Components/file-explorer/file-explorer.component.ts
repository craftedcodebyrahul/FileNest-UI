import {
  Component, OnDestroy, OnInit, ViewChild, NgZone, inject, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private platformId = inject(PLATFORM_ID);

  constructor(
    public dialog: MatDialog,
    private fileService: FileserviceService,
    private snackBar: MatSnackBar,
    private bottomSheet: MatBottomSheet,
    private ngZone: NgZone
  ) {}

  current_directories: any = [];
  current_files: any = [];
  displayed_directories: any = [];
  displayed_files: any = [];
  breadcrumb_paths: string[] = [];
  currentView: 'home' | 'recent' | 'starred' | 'trash' = 'home';
  searchQuery = '';

  private rootFoldersSubscription: Subscription | undefined;
  private currentFolderSubscription: Subscription | undefined;
  private viewSubscription: Subscription | undefined;
  private searchSubscription: Subscription | undefined;
  private configSubscription: Subscription | undefined;

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
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth < 768;
    }
    return false;
  }

  contextMenuPosition = { x: '0px', y: '0px' };


  ngOnInit(): void {
    this.fileService.loadConfig();
    this.restoreNavigationState();

    this.rootFoldersSubscription = this.fileService.rootFolders$.subscribe(() => {});

    this.viewSubscription = this.fileService.currentView$.subscribe((view) => {
      this.currentView = view;
      if (view === 'recent' || view === 'starred') {
        this.breadcrumb_paths = [];
      }
      this.get_all_dir_files(this.breadcrumbFullPath);
    });

    this.searchSubscription = this.fileService.searchQuery$.subscribe((query) => {
      this.searchQuery = query;
      this.filterItems(query);
    });

    this.configSubscription = this.fileService.config$.subscribe(() => {
      if (this.currentView === 'recent' || this.currentView === 'starred') {
        this.get_all_dir_files(this.breadcrumbFullPath);
      }
    });

    this.currentFolderSubscription = this.fileService.currentFolder$.subscribe((folder) => {
      if (this.currentView === 'home') {
        if (folder === '') {
          this.breadcrumb_paths = [];
        } else {
          this.breadcrumb_paths = folder.split('/').filter(s => s !== '');
        }
        this.get_all_dir_files(this.breadcrumbFullPath);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.currentView === 'home' && this.breadcrumb_paths.length === 0) {
      this.get_all_dir_files('');
    }
  }

  filterItems(query: string): void {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.displayed_directories = this.current_directories;
      this.displayed_files = this.current_files;
    } else {
      this.displayed_directories = this.current_directories.filter((d: any) => {
        const name = typeof d === 'string' ? d : d.name;
        return name.toLowerCase().includes(q);
      });
      this.displayed_files = this.current_files.filter((f: any) => {
        return f.name.toLowerCase().includes(q);
      });
    }
  }

  // ── Card click (single tap on mobile = open, desktop = select) ──────────

  onCardClick(event: MouseEvent, item: any, type: 'file' | 'folder'): void {
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
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  openMobileActions(item: any, type: 'file' | 'folder'): void {
    this.contextMenuTargetType = type;
    this.clicked_active_path = type === 'file' ? item.name : (typeof item === 'string' ? item : item.name);
    this.clicked_active_item = item;

    const fullPath = type === 'file' 
      ? item.fullPath 
      : (this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + this.clicked_active_path : this.clicked_active_path);

    const ref = this.bottomSheet.open(MobileActionsSheetComponent, {
      data: {
        type,
        name: this.clicked_active_path,
        hasClipboard: !!this.clipboard,
        isTrash: this.currentView === 'trash',
        isStarred: this.fileService.isStarred(fullPath, type)
      },
    });

    ref.afterDismissed().subscribe((action: string) => {
      if (!action) return;
      switch (action) {
        case 'open':
          if (type === 'folder') this.OnClickDir(item);
          else this.onFileClick(item);
          break;
        case 'star':
          this.toggleStar(item, type);
          break;
        case 'restore':
          this.onRestore(item, type);
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
    this.clicked_active_path = type === 'file' ? item.name : (typeof item === 'string' ? item : item.name);
    this.clicked_active_item = item;
    this.contextMenu.menuData = { item, type };
    this.contextMenu.menu!.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  // ── Star / Unstar ────────────────────────────────────────────────────────

  isStarred(item: any, type: 'file' | 'folder'): boolean {
    const name = type === 'file' ? item.name : (typeof item === 'string' ? item : item.name);
    const fullPath = type === 'file' 
      ? item.fullPath 
      : (this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + name : name);
    return this.fileService.isStarred(fullPath, type);
  }

  toggleStar(item: any, type: 'file' | 'folder'): void {
    const name = type === 'file' ? item.name : (typeof item === 'string' ? item : item.name);
    const fullPath = type === 'file' 
      ? item.fullPath 
      : (this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + name : name);

    // format folder structure matching fileservice
    const formattedItem = type === 'folder' 
      ? { name, fullPath } 
      : item;

    this.fileService.toggleStar(formattedItem, type);
    this.snackBar.open(
      this.fileService.isStarred(fullPath, type) ? 'Added to Starred' : 'Removed from Starred', 
      'Close', 
      { duration: 3000 }
    );
  }

  // ── CRUD actions ─────────────────────────────────────────────────────────

  onDelete(): void {
    const name = this.clicked_active_path;
    const type = this.contextMenuTargetType;
    if (!name || !type) return;

    if (this.currentView === 'trash') {
      // Permanent delete
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: `Delete Permanently`,
          message: `Are you sure you want to permanently delete "${name}"? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
      });

      dialogRef.afterClosed().subscribe((confirmed) => {
        if (!confirmed) return;
        const apiPath = '.trash/' + (this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + name : name);
        if (type === 'file') {
          this.fileService.deleteFile(apiPath).subscribe({
            next: () => {
              this.get_all_dir_files(this.breadcrumbFullPath);
              this.fileService.refreshStorage();
              this.snackBar.open('Permanently deleted file', 'Close', { duration: 3000 });
            },
            error: () => this.snackBar.open('Failed to delete file', 'Close', { duration: 4000 }),
          });
        } else {
          this.fileService.deleteDirectory(apiPath).subscribe({
            next: () => {
              this.get_all_dir_files(this.breadcrumbFullPath);
              this.fileService.refreshStorage();
              this.snackBar.open('Permanently deleted folder', 'Close', { duration: 3000 });
            },
            error: () => this.snackBar.open('Failed to delete folder', 'Close', { duration: 4000 }),
          });
        }
      });
    } else {
      // Move to trash
      const oldPath = this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + name : name;
      const newPath = '.trash/' + oldPath;

      if (type === 'file') {
        this.fileService.renameFile(oldPath, newPath).subscribe({
          next: () => {
            this.fileService.onFileDeleted(oldPath);
            this.get_all_dir_files(this.breadcrumbFullPath);
            this.fileService.refreshStorage();
            this.snackBar.open('File moved to Trash', 'Close', { duration: 3000 });
          },
          error: () => this.snackBar.open('Failed to move file to Trash', 'Close', { duration: 4000 }),
        });
      } else {
        this.fileService.renameDirectory(oldPath, newPath).subscribe({
          next: () => {
            this.fileService.onFileDeleted(oldPath);
            this.get_all_dir_files(this.breadcrumbFullPath);
            this.fileService.refreshStorage();
            this.snackBar.open('Folder moved to Trash', 'Close', { duration: 3000 });
          },
          error: () => this.snackBar.open('Failed to move folder to Trash', 'Close', { duration: 4000 }),
        });
      }
    }
  }

  onRestore(item: any, type: 'file' | 'folder'): void {
    const name = type === 'file' ? item.name : (typeof item === 'string' ? item : item.name);
    const trashPath = this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + name : name;
    const fullTrashPath = '.trash/' + trashPath;
    const restorePath = trashPath;

    if (type === 'file') {
      this.fileService.renameFile(fullTrashPath, restorePath).subscribe({
        next: () => {
          this.get_all_dir_files(this.breadcrumbFullPath);
          this.fileService.refreshStorage();
          this.snackBar.open('File restored successfully', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to restore file', 'Close', { duration: 4000 })
      });
    } else {
      this.fileService.renameDirectory(fullTrashPath, restorePath).subscribe({
        next: () => {
          this.get_all_dir_files(this.breadcrumbFullPath);
          this.fileService.refreshStorage();
          this.snackBar.open('Folder restored successfully', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to restore folder', 'Close', { duration: 4000 })
      });
    }
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
          const oldPath = this.clipboard!.path;
          this.fileService.onFileRenamed(oldPath, destination);
          this.clipboard = null;
          this.get_all_dir_files(this.breadcrumbFullPath);
          this.snackBar.open('Folder moved successfully', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to move folder', 'Close', { duration: 4000 }),
      });
    } else {
      this.fileService.renameFile(this.clipboard.path, destination).subscribe({
        next: () => {
          const oldPath = this.clipboard!.path;
          this.fileService.onFileRenamed(oldPath, destination);
          this.clipboard = null;
          this.get_all_dir_files(this.breadcrumbFullPath);
          this.snackBar.open('File moved successfully', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to move file', 'Close', { duration: 4000 }),
      });
    }
  }

  onDownload(): void {
    const name = this.clicked_active_path;
    const filePath = this.currentView === 'trash'
      ? '.trash/' + (this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + name : name)
      : (this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + name : name);

    this.fileService.getSignedUrl(filePath).subscribe({
      next: (res: any) => {
        const a = document.createElement('a');
        a.href = res.result;
        a.download = name;
        a.target = '_blank';
        a.click();
      },
      error: () => this.snackBar.open('Failed to get download link', 'Close', { duration: 4000 }),
    });
  }

  // ── Rename helpers ───────────────────────────────────────────────────────

  onRenameDirectory(newName: string): void {
    const oldName = this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + this.clicked_active_path : this.clicked_active_path;
    const newPath = this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + newName : newName;
    this.fileService.renameDirectory(oldName, newName).subscribe({
      next: () => {
        this.fileService.onFileRenamed(oldName, newPath);
        this.get_all_dir_files(this.breadcrumbFullPath);
        this.snackBar.open('Folder renamed', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to rename folder: ' + (err.error?.detail || err.message), 'Close', { duration: 6000 });
      },
    });
  }

  onRenameFile(newName: string): void {
    const oldName = this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + this.clicked_active_path : this.clicked_active_path;
    const newPath = this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + newName : newName;
    this.fileService.renameFile(oldName, newName).subscribe({
      next: () => {
        this.fileService.onFileRenamed(oldName, newPath);
        this.get_all_dir_files(this.breadcrumbFullPath);
        this.snackBar.open('File renamed', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to rename file: ' + (err.error?.detail || err.message), 'Close', { duration: 6000 });
      },
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  OnClickDir(folderName: any): void {
    const name = typeof folderName === 'string' ? folderName : folderName.name;
    this.breadcrumb_paths.push(name);
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
    const name = file.name;
    const file_url = this.currentView === 'trash'
      ? '.trash/' + (this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + name : name)
      : (this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + name : name);

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

      if (this.currentView !== 'trash') {
        const fullPath = this.breadcrumbFullPath ? this.breadcrumbFullPath + '/' + name : name;
        const recentFileObj = { ...file, fullPath };
        this.fileService.addToRecent(recentFileObj);
      }
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
          this.fileService.refreshStorage();
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
    if (this.currentView === 'recent') {
      this.current_directories = [];
      this.current_files = this.fileService.config.recent;
      this.filterItems(this.searchQuery);
      this.saveNavigationState();
      return;
    }

    if (this.currentView === 'starred') {
      this.current_directories = this.fileService.config.starred
        .filter((s: any) => s.type === 'folder')
        .map((s: any) => s.name);
      this.current_files = this.fileService.config.starred
        .filter((s: any) => s.type === 'file');
      this.filterItems(this.searchQuery);
      this.saveNavigationState();
      return;
    }

    let apiPath = path;
    if (this.currentView === 'trash') {
      apiPath = path ? '.trash/' + path : '.trash';
    }

    this.fileService.get_all_files(apiPath).subscribe({
      next: (data: any) => {
        let dirs = data.result?.directories ?? [];
        let files = data.result?.files ?? [];

        if (this.currentView === 'home' && !path) {
          dirs = dirs.filter((d: string) => d !== '.trash');
          files = files.filter((f: any) => f.name !== '.filenest_config.json');
        }

        this.current_directories = dirs;
        this.current_files = files;

        if (this.currentView === 'home' && !path) {
          this.fileService.setRootFolders(this.current_directories);
        }
        this.filterItems(this.searchQuery);
        this.saveNavigationState();
      },
      error: (err) => {
        console.error('Error loading files:', err);
        this.current_directories = [];
        this.current_files = [];
        this.filterItems(this.searchQuery);
      }
    });
  }

  create_new_directory(name: string): void {
    this.fileService.create_directory(name, this.breadcrumbFullPath).subscribe(() => {
      if (!this.breadcrumbFullPath) {
        this.fileService.addRootFolder(name);
      }
      this.get_all_dir_files(this.breadcrumbFullPath);
      this.fileService.refreshStorage();
    });
  }

  // ── State persistence ────────────────────────────────────────────────────

  private restoreNavigationState(): void {
    const savedPath = localStorage.getItem('fileExplorerCurrentPath');
    if (savedPath && this.currentView === 'home') {
      this.breadcrumb_paths = savedPath.split('/').filter((s) => s !== '');
      this.fileService.setCurrentFolder(this.breadcrumbFullPath);
      this.get_all_dir_files(this.breadcrumbFullPath);
    }
  }

  private saveNavigationState(): void {
    if (this.currentView === 'home') {
      localStorage.setItem('fileExplorerCurrentPath', this.breadcrumbFullPath);
    }
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
    this.viewSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
    this.configSubscription?.unsubscribe();
  }
}
