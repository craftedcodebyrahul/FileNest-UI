import { Component, Inject } from '@angular/core';
import { APP_MODULES } from '../../../app.module';
import { MATERIAL_IMPORTS } from '../../../material/material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-folder-dialog',
  standalone: true,
  imports: [...APP_MODULES,...MATERIAL_IMPORTS],
  templateUrl: './create-folder-dialog.component.html',
  styleUrl: './create-folder-dialog.component.css'
})
export class CreateFolderDialogComponent {
  folderName = '';

  constructor(
    public dialogRef: MatDialogRef<CreateFolderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.folderName.trim()) {
      this.dialogRef.close(this.folderName.trim());
    }
  }
}
