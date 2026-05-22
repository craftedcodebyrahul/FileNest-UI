import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL_IMPORTS } from '../../../material/material.module';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [...MATERIAL_IMPORTS, CommonModule],
  template: `
    <div class="confirm-shell">
      <div class="confirm-header">
        <div class="confirm-icon" [class.danger]="data.danger">
          <mat-icon>{{ data.danger ? 'delete_forever' : 'help_outline' }}</mat-icon>
        </div>
        <h2 class="confirm-title">{{ data.title }}</h2>
      </div>
      <mat-dialog-content class="confirm-body">
        <p class="confirm-message">{{ data.message }}</p>
      </mat-dialog-content>
      <div class="confirm-actions">
        <button mat-stroked-button class="cancel-btn" (click)="onCancel()">
          {{ data.cancelLabel || 'Cancel' }}
        </button>
        <button mat-flat-button class="confirm-btn" [class.danger-btn]="data.danger" (click)="onConfirm()">
          <mat-icon *ngIf="data.danger">delete_outline</mat-icon>
          {{ data.confirmLabel || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-shell { min-width: 300px; max-width: 420px; }
    .confirm-header { display: flex; align-items: center; gap: 12px; padding: 20px 20px 0; }
    .confirm-icon {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #4f46e5, #06b6d4); flex-shrink: 0;
    }
    .confirm-icon.danger { background: linear-gradient(135deg, #ef4444, #f97316); }
    .confirm-icon mat-icon { color: #fff; font-size: 20px; width: 20px; height: 20px; }
    .confirm-title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0; }
    .confirm-body { padding: 12px 20px 8px !important; }
    .confirm-message { font-size: 14px; color: #475569; margin: 0; line-height: 1.5; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 8px 20px 20px; }
    .cancel-btn { border-radius: 8px !important; color: #64748b !important; }
    .confirm-btn { border-radius: 8px !important; background: linear-gradient(135deg, #4f46e5, #06b6d4) !important; color: #fff !important; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .danger-btn { background: linear-gradient(135deg, #ef4444, #f97316) !important; }
    @media (max-width: 480px) { .confirm-shell { min-width: unset; } }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void { this.dialogRef.close(false); }
  onConfirm(): void { this.dialogRef.close(true); }
}
