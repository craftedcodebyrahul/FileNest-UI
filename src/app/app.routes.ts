import { Routes } from '@angular/router';
import { LoginComponent } from './Components/Auth/Login/login/login.component';
import { AppComponent } from './app.component';

import { UploadComponent } from './Components/Upload/upload/upload.component';
import { SignupComponent } from './Components/Auth/signup/signup.component';
import { DashboardComponent } from './Components/dashboard/dashboard.component';
import { authGuard } from './Guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

 { path: 'upload', component: UploadComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
