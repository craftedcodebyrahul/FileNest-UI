import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { MATERIAL_IMPORTS } from '../../material/material.module';
import { APP_MODULES } from '../../app.module';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MATERIAL_IMPORTS, APP_MODULES],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  router = inject(Router);
   @Output() toggleSidebar = new EventEmitter<void>();
  constructor(private authService: AuthService) {}
  user: any;
  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  get userInitials(): string {
    const f = this.user?.first_name?.[0] ?? '';
    const l = this.user?.last_name?.[0] ?? '';
    return (f + l).toUpperCase() || 'U';
  }

  logout(): void {
    this.authService.logout().subscribe((x) => {

 
      });
  }
}
