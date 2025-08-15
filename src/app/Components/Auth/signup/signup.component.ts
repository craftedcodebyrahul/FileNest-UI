import { Component } from '@angular/core';
import { AuthService } from '../../../Services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { APP_MODULES } from '../../../app.module';
import { MATERIAL_IMPORTS } from '../../../material/material.module';
import { last } from 'rxjs';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [...MATERIAL_IMPORTS, ...APP_MODULES],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
 constructor(private authService:AuthService){}
 form = new FormGroup({
    first_name: new FormControl('', Validators.required),
    last_name: new FormControl('', Validators.required),
    phone_number: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  onSignup() {
    debugger;
    if (this.form.valid) {
     this.authService.register(this.form.value);
    }
  }
}
