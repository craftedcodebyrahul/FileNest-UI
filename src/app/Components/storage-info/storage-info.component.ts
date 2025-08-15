import { Component } from '@angular/core';
import { APP_MODULES } from '../../app.module';
import { MATERIAL_IMPORTS } from '../../material/material.module';

@Component({
  selector: 'app-storage-info',
  standalone: true,
  imports: [MATERIAL_IMPORTS,APP_MODULES],
  templateUrl: './storage-info.component.html',
  styleUrl: './storage-info.component.css'
})
export class StorageInfoComponent {

}
