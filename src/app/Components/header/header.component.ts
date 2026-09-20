import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { MATERIAL_IMPORTS } from '../../material/material.module';
import { APP_MODULES } from '../../app.module';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../Services/auth.service';
import { FileserviceService } from '../../Services/fileservice.service';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from '../Dialogue/change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MATERIAL_IMPORTS, APP_MODULES],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  router = inject(Router);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private fileService = inject(FileserviceService);

  @Output() toggleSidebar = new EventEmitter<void>();

  user: UserProfile | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u) => {
      this.user = u;
    });
  }

  get userDisplayName(): string {
    if (!this.user) return 'User';
    if (this.user.full_name) return this.user.full_name;
    if (this.user.name) return this.user.name;
    const f = (this.user as any).first_name || '';
    const l = (this.user as any).last_name || '';
    if (f || l) return `${f} ${l}`.trim();
    return this.user.email ? this.user.email.split('@')[0] : 'User';
  }

  get userInitials(): string {
    const name = this.userDisplayName;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'FN';
  }

  get userAvatarUrl(): string | null {
    return this.user?.picture || this.user?.avatar_url || null;
  }

  openChangePasswordDialog(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '420px',
      disableClose: true,
      panelClass: 'custom-dialog-panel'
    });
  }

  onSearch(event: any): void {
    this.fileService.setSearchQuery(event.target?.value || '');
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {},
      error: () => {}
    });
  }
}

