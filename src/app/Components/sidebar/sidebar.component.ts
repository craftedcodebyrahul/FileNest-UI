import { Component } from '@angular/core';
import { APP_MODULES } from '../../app.module';
import { MATERIAL_IMPORTS } from '../../material/material.module';
import { Subscription } from 'rxjs';
import { FileserviceService } from '../../Services/fileservice.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MATERIAL_IMPORTS,APP_MODULES],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  
  folders: string[] = [];
  private foldersSubscription: Subscription | undefined;

  constructor(private fileService: FileserviceService) {}

  ngOnInit() {
    this.foldersSubscription = this.fileService.rootFolders$.subscribe(
      folders => this.folders = folders
    );
  }

  onFolderClick(folder: string) {
  
    this.fileService.setCurrentFolder(folder);
  }

  ngOnDestroy() {
    this.foldersSubscription?.unsubscribe();
  }
}
