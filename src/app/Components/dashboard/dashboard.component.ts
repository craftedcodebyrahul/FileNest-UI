import { Component } from '@angular/core';
import { APP_MODULES } from '../../app.module';
import { MATERIAL_IMPORTS } from '../../material/material.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [...APP_MODULES, ...MATERIAL_IMPORTS],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

}
