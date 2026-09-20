import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { APP_MODULES } from '../../app.module';
import { MATERIAL_IMPORTS } from '../../material/material.module';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FileExplorerComponent } from '../file-explorer/file-explorer.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [...APP_MODULES, ...MATERIAL_IMPORTS, HeaderComponent, SidebarComponent, FileExplorerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private platformId = inject(PLATFORM_ID);
  isSidebarOpen = true;

  get isMobile(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth < 768;
    }
    return false;
  }
}

