import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MATERIAL_IMPORTS } from '../../../material/material.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mobile-actions-sheet',
  standalone: true,
  imports: [...MATERIAL_IMPORTS, CommonModule],
  template: `
    <div class="sheet-shell">
      <div class="sheet-handle"></div>
      <div class="sheet-header">
        <mat-icon class="sheet-type-icon">{{ data.type === 'folder' ? 'folder' : 'insert_drive_file' }}</mat-icon>
        <span class="sheet-name" [title]="data.name">{{ data.name }}</span>
      </div>
      <mat-divider></mat-divider>
      <mat-nav-list class="sheet-list">
        <mat-list-item (click)="dismiss('open')">
          <mat-icon matListItemIcon>{{ data.type === 'folder' ? 'folder_open' : 'visibility' }}</mat-icon>
          <span matListItemTitle>{{ data.type === 'folder' ? 'Open' : 'Preview' }}</span>
        </mat-list-item>
        <mat-list-item (click)="dismiss('rename')">
          <mat-icon matListItemIcon>drive_file_rename_outline</mat-icon>
          <span matListItemTitle>Rename</span>
        </mat-list-item>
        <mat-list-item (click)="dismiss('cut')">
          <mat-icon matListItemIcon>content_cut</mat-icon>
          <span matListItemTitle>Cut (Move)</span>
        </mat-list-item>
        <mat-list-item *ngIf="data.hasClipboard" (click)="dismiss('paste')">
          <mat-icon matListItemIcon>content_paste</mat-icon>
          <span matListItemTitle>Paste here</span>
        </mat-list-item>
        <mat-list-item *ngIf="data.type === 'file'" (click)="dismiss('download')">
          <mat-icon matListItemIcon>download</mat-icon>
          <span matListItemTitle>Download</span>
        </mat-list-item>
        <mat-divider></mat-divider>
        <mat-list-item class="delete-item" (click)="dismiss('delete')">
          <mat-icon matListItemIcon class="delete-icon">delete_outline</mat-icon>
          <span matListItemTitle class="delete-label">Delete</span>
        </mat-list-item>
      </mat-nav-list>
    </div>
  `,
  styles: [`
    .sheet-shell { padding-bottom: env(safe-area-inset-bottom, 16px); }
    .sheet-handle {
      width: 36px; height: 4px; border-radius: 2px;
      background: #cbd5e1; margin: 10px auto 8px; display: block;
    }
    .sheet-header {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 16px 12px;
    }
    .sheet-type-icon { color: #f59e0b; font-size: 22px; width: 22px; height: 22px; }
    .sheet-name {
      font-size: 15px; font-weight: 600; color: #0f172a;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px;
    }
    .sheet-list { padding: 4px 0 8px; }
    .delete-item mat-icon, .delete-icon { color: #ef4444 !important; }
    .delete-label { color: #ef4444 !important; }
  `]
})
export class MobileActionsSheetComponent {
  constructor(
    private sheetRef: MatBottomSheetRef<MobileActionsSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {
      type: 'file' | 'folder';
      name: string;
      hasClipboard: boolean;
    }
  ) {}

  dismiss(action: string): void {
    this.sheetRef.dismiss(action);
  }
}
