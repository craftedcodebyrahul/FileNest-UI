import { Component, OnInit, OnDestroy } from '@angular/core';
import { APP_MODULES } from '../../app.module';
import { MATERIAL_IMPORTS } from '../../material/material.module';
import { Subscription } from 'rxjs';
import { FileserviceService } from '../../Services/fileservice.service';

export interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  children: TreeNode[];
  level: number;
  size?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MATERIAL_IMPORTS, APP_MODULES],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  treeNodes: TreeNode[] = [];
  currentView: 'home' | 'recent' | 'starred' | 'trash' = 'home';
  currentFolder = '';
  
  private foldersSubscription: Subscription | undefined;
  private viewSubscription: Subscription | undefined;
  private currentFolderSubscription: Subscription | undefined;
  private storageSub: Subscription | undefined;

  constructor(private fileService: FileserviceService) {}

  ngOnInit(): void {
    this.foldersSubscription = this.fileService.rootFolders$.subscribe(
      folders => {
        const rootFolderNames = folders.filter(f => f !== '.trash');
        this.updateRootNodes(rootFolderNames);
      }
    );

    this.viewSubscription = this.fileService.currentView$.subscribe(
      view => this.currentView = view
    );

    this.currentFolderSubscription = this.fileService.currentFolder$.subscribe(
      folder => this.currentFolder = folder
    );

    // Refresh expanded nodes when files/folders change
    this.storageSub = this.fileService.storageUpdated$.subscribe(() => {
      this.refreshExpandedNodes(this.treeNodes);
    });
  }

  updateRootNodes(names: string[]): void {
    const currentMap = new Map<string, TreeNode>();
    this.treeNodes.forEach(node => currentMap.set(node.name, node));

    this.treeNodes = names.map(name => {
      const existing = currentMap.get(name);
      if (existing) {
        return existing;
      } else {
        return {
          name: name,
          fullPath: name,
          isFolder: true,
          isExpanded: false,
          isLoading: false,
          children: [],
          level: 0
        };
      }
    });
  }

  toggleNode(event: MouseEvent, node: TreeNode): void {
    event.stopPropagation();
    if (!node.isFolder) return;
    node.isExpanded = !node.isExpanded;
    if (node.isExpanded) {
      this.loadNodeChildren(node);
    }
  }

  loadNodeChildren(node: TreeNode): void {
    if (!node.isFolder) return;
    node.isLoading = true;
    this.fileService.get_all_files(node.fullPath).subscribe({
      next: (data: any) => {
        node.isLoading = false;
        const subdirs = (data.result?.directories ?? []).filter((d: string) => d !== '.trash');
        const files = data.result?.files ?? [];
        
        const existingMap = new Map<string, TreeNode>();
        node.children.forEach(c => existingMap.set(c.name, c));

        const dirNodes: TreeNode[] = subdirs.map((d: string) => {
          const existing = existingMap.get(d);
          return {
            name: d,
            fullPath: node.fullPath ? `${node.fullPath}/${d}` : d,
            isFolder: true,
            isExpanded: existing ? existing.isExpanded : false,
            isLoading: false,
            children: existing ? existing.children : [],
            level: node.level + 1
          };
        });

        const fileNodes: TreeNode[] = files.map((f: any) => {
          const fileName = f.name || (f.fullPath ? f.fullPath.split('/').pop() : 'File');
          return {
            name: fileName,
            fullPath: f.fullPath || (node.fullPath ? `${node.fullPath}/${fileName}` : fileName),
            isFolder: false,
            isExpanded: false,
            isLoading: false,
            children: [],
            level: node.level + 1,
            size: f.size
          };
        });

        node.children = [...dirNodes, ...fileNodes];
      },
      error: (err) => {
        node.isLoading = false;
        console.error('Failed to load node children for ' + node.fullPath, err);
      }
    });
  }

  private refreshExpandedNodes(nodes: TreeNode[]): void {
    nodes.forEach(node => {
      if (node.isFolder && node.isExpanded) {
        this.loadNodeChildren(node);
        if (node.children.length > 0) {
          this.refreshExpandedNodes(node.children);
        }
      }
    });
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'picture_as_pdf';
    if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(ext)) return 'movie';
    if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) return 'audiotrack';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'folder_zip';
    if (['js', 'ts', 'html', 'css', 'py', 'json', 'cpp'].includes(ext)) return 'code';
    if (['doc', 'docx', 'txt', 'md'].includes(ext)) return 'description';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'table_chart';
    return 'insert_drive_file';
  }

  onHomeClick(): void {
    this.fileService.setCurrentView('home');
    this.fileService.setCurrentFolder('');
  }

  onRecentClick(): void {
    this.fileService.setCurrentView('recent');
  }

  onStarredClick(): void {
    this.fileService.setCurrentView('starred');
  }

  onTrashClick(): void {
    this.fileService.setCurrentView('trash');
  }

  onNodeClick(node: TreeNode): void {
    this.fileService.setCurrentView('home');
    if (node.isFolder) {
      this.fileService.setCurrentFolder(node.fullPath);
    } else {
      // For a file, navigate to its parent directory
      const parentFolder = node.fullPath.substring(0, node.fullPath.lastIndexOf('/'));
      this.fileService.setCurrentFolder(parentFolder);
    }
  }

  ngOnDestroy(): void {
    this.foldersSubscription?.unsubscribe();
    this.viewSubscription?.unsubscribe();
    this.currentFolderSubscription?.unsubscribe();
    this.storageSub?.unsubscribe();
  }
}

