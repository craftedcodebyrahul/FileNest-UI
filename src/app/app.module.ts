import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './Components/header/header.component';
import { SidebarComponent } from './Components/sidebar/sidebar.component';
import { FileExplorerComponent } from './Components/file-explorer/file-explorer.component';
import { FileGridComponent } from './Components/file-grid/file-grid.component';
import { StorageInfoComponent } from './Components/storage-info/storage-info.component';
import { SignupComponent } from './Components/Auth/signup/signup.component';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmDialogComponent } from './Components/Dialogue/confirm-dialog/confirm-dialog.component';
import { MobileActionsSheetComponent } from './Components/Dialogue/mobile-actions-sheet/mobile-actions-sheet.component';

export const APP_MODULES = [
  RouterOutlet,
  ReactiveFormsModule,
  RouterLink,
  RouterLinkActive,
  HeaderComponent,
  SidebarComponent,
  FileExplorerComponent,
  FileGridComponent,
  StorageInfoComponent,
  SignupComponent,
  ConfirmDialogComponent,
  MobileActionsSheetComponent,
  FormsModule,
  CommonModule,
  HttpClientModule,
];
