import { Component, Inject, Input } from '@angular/core';
import { APP_MODULES } from '../../../app.module';
import { MATERIAL_IMPORTS } from '../../../material/material.module';
import { SafeUrlPipe } from '../../../Pipes/safe-url.pipe';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [...APP_MODULES, ...MATERIAL_IMPORTS, SafeUrlPipe],
  templateUrl: './file-preview.component.html',
  styleUrl: './file-preview.component.css',
})
export class FilePreviewComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  get isImage(): boolean {
    return this.data.mimetype.startsWith('image/');
  }

  get isPdf(): boolean {
    return this.data.mimetype === 'application/pdf';
  }

  get isOfficeDoc(): boolean {
    const officeTypes = [
      'application/vnd.openxmlformats-officedocument',
      'application/msword',
      'application/vnd.ms-excel',
    ];
    return officeTypes.some((type) => this.data.mimetype.includes(type));
  }
  openInBrowser(): void {
    window.open(this.data.url, '_blank');
    // this.dialog.closeAll();  
  }
}
