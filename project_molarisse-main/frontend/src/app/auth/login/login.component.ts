import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms'; 


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    RouterModule
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  rememberMe = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    public router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà authentifié et le rediriger vers son dashboard
    if (this.authService.isAuthenticated()) {
      const role = this.authService.getUserRole();
      if (role) {
        this.router.navigate([`/dashboard/${role.toLowerCase()}`]);
      }
    }
    
    this.loginForm.valueChanges.subscribe(value => {
      console.log('Form value:', value);
      console.log('Form valid:', this.loginForm.valid);
      console.log('Email errors:', this.loginForm.get('email')?.errors);
      console.log('Password errors:', this.loginForm.get('password')?.errors);
      console.log('Form status:', this.loginForm.status);
      console.log('Form touched:', this.loginForm.touched);
      console.log('Form dirty:', this.loginForm.dirty);
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const credentials = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };
      this.authService.authenticate(credentials).subscribe(
        (response: any) => {
          console.log('Full authentication response:', response);
          const role = response.role?.toLowerCase(); // Convert role to lowercase
          console.log('Extracted role (lowercase):', role);
          
          if (!role) {
            console.error('No role received from backend');
            return;
          }

          // Define valid roles
          const validRoles = ['doctor', 'admin', 'patient', 'secretaire', 'fournisseur', 'pharmacie', 'labo'];
          
          if (!validRoles.includes(role)) {
            console.error('Invalid role received:', role);
            return;
          }

          const dashboardPath = `/dashboard/${role}`;
          console.log('Navigating to:', dashboardPath);
          this.router.navigate([dashboardPath]);
        },
        error => {
          console.error('Login failed', error);
        }
      );
    }
  }

  loginWithGoogle() {
    // Implémentez la logique de connexion avec Google ici
  }

  loginWithApple() {
    // Implémentez la logique de connexion avec Apple ici
  }

  loginWithFacebook() {
    // Implémentez la logique de connexion avec Facebook ici
  }
}