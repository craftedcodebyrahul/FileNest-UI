import { Component, Inject } from '@angular/core';
import { MATERIAL_IMPORTS } from '../../../material/material.module';
import { APP_MODULES } from '../../../app.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-upload-files-dialog',
  standalone: true,
   imports: [...APP_MODULES,...MATERIAL_IMPORTS],
  templateUrl: './upload-files-dialog.component.html',
  styleUrl: './upload-files-dialog.component.css'
})
export class UploadFilesDialogComponent {
 selectedFiles: File[] = [];
  dragOver = false;

  constructor(
    public dialogRef: MatDialogRef<UploadFilesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onFilesSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    
    if (event.dataTransfer?.files) {
      this.selectedFiles = Array.from(event.dataTransfer.files);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onUpload(): void {
    if (this.selectedFiles.length) {
      this.dialogRef.close(this.selectedFiles);
    }
  }
}
