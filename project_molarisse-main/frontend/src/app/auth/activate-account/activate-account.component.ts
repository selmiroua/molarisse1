import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.scss']
})
export class ActivateAccountComponent implements OnInit {
  activationForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.activationForm = this.fb.group({
      code: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check for token in URL query params
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.activateAccount(token);
      }
    });
  }

  private activateAccount(token: string) {
    this.loading = true;
    this.authService.activateAccount(token).subscribe({
      next: () => {
        this.snackBar.open('Account activated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Activation failed', error);
        this.snackBar.open(error.error?.message || 'Account activation failed', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.activationForm.valid) {
      const code = this.activationForm.get('code')?.value;
      this.activateAccount(code);
    }
  }
}