import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatSelectModule
  ],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent {
  signInForm: FormGroup;
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  roles: string[] = [];

  // List of roles that should not be available for registration
  private restrictedRoles: string[] = ['Admin'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signInForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });

    this.authService.getRoles().subscribe(roles => {
      // Filter out restricted roles
      this.roles = roles.filter(role => !this.restrictedRoles.includes(role));
      console.log('Available roles for registration:', this.roles);
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.signInForm.invalid) {
      console.log('Form is invalid');
      return;
    }

    const { confirmPassword, ...userData } = this.signInForm.value;
    console.log('Submitting form with user data:', userData);
    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.router.navigate(['/activate-account']);
      },
      error: (error) => {
        console.error('Registration failed', error);
      }
    });
  }

  signInWithGoogle() {
    // Implement Google sign-in
  }

  signInWithApple() {
    // Implement Apple sign-in
  }

  signInWithFacebook() {
    // Implement Facebook sign-in
  }
}
