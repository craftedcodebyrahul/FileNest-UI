import { Component, Input } from '@angular/core';
import { MATERIAL_IMPORTS } from '../../material/material.module';
import { APP_MODULES } from '../../app.module';

@Component({
  selector: 'app-file-grid',
  standalone: true,
  imports: [MATERIAL_IMPORTS,APP_MODULES],
  templateUrl: './file-grid.component.html',
  styleUrl: './file-grid.component.css'
})
export class FileGridComponent {
 @Input() items: any[] = [];
  @Input() type: 'folder' | 'file' = 'folder';
  
  getFileIcon(fileType: string): string {
    switch(fileType) {
      case 'document': return 'description';
      case 'image': return 'image';
      case 'video': return 'movie';
      default: return 'insert_drive_file';
    }
  }
}
