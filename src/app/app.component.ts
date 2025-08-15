import { Component, inject, signal, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MATERIAL_IMPORTS } from './material/material.module';
import { APP_MODULES } from './app.module';
import { MatSidenav } from '@angular/material/sidenav';
import { MediaMatcher } from '@angular/cdk/layout';
import { FormBuilder } from '@angular/forms';
import { LoaderService } from './Services/loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...APP_MODULES, ...MATERIAL_IMPORTS],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'FileNestFE';
   isLoading$ = this.loaderService.loading$;

  constructor(private loaderService: LoaderService) {}
}
