import { Component, inject, OnInit } from '@angular/core';
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
  constructor(private authService: AuthService) {}
    user :any
  ngOnInit(): void {
    this.authService.getProfile().subscribe((data) => {
      this.user = data;
    })

  }



  logout(): void {
    // TODO: Implement actual logout logic (e.g., clear token, call auth service)
    console.log('Logging out...');
    this.authService.logout();
  }
}
