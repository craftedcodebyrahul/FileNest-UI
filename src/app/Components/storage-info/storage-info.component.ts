import { Component, OnInit, OnDestroy } from '@angular/core';
import { APP_MODULES } from '../../app.module';
import { MATERIAL_IMPORTS } from '../../material/material.module';
import { FileserviceService } from '../../Services/fileservice.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-storage-info',
  standalone: true,
  imports: [MATERIAL_IMPORTS, APP_MODULES],
  templateUrl: './storage-info.component.html',
  styleUrl: './storage-info.component.css'
})
export class StorageInfoComponent implements OnInit, OnDestroy {
  usedBytes = 0;
  limitBytes = 15 * 1024 * 1024 * 1024; // Default 15 GB
  private storageSub: Subscription | undefined;

  constructor(private fileService: FileserviceService) {}

  ngOnInit(): void {
    this.storageSub = this.fileService.storageUpdated$.subscribe(() => {
      this.loadStorageInfo();
    });
  }

  loadStorageInfo(): void {
    this.fileService.getStorageInfo().subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.usedBytes = res.result.used_bytes;
          this.limitBytes = res.result.limit_bytes;
        }
      },
      error: (err) => {
        console.error('Failed to load storage info:', err);
      }
    });
  }

  get progressValue(): number {
    if (!this.limitBytes) return 0;
    return Math.min(100, Math.round((this.usedBytes / this.limitBytes) * 100));
  }

  get formattedUsed(): string {
    return this.formatBytes(this.usedBytes);
  }

  get formattedLimit(): string {
    return this.formatBytes(this.limitBytes);
  }

  get formattedRemaining(): string {
    return this.formatBytes(Math.max(0, this.limitBytes - this.usedBytes));
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  ngOnDestroy(): void {
    this.storageSub?.unsubscribe();
  }
}
