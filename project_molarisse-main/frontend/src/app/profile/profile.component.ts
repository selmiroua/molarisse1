import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { ProfileService, UserProfile } from './profile.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { CvViewerDialogComponent } from '../shared/cv-viewer-dialog/cv-viewer-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  loading = false;
  showEditForm = true;
  userProfile?: UserProfile;
  selectedFile?: File;
  previewUrl?: string;
  uploadProgress = 0;
  passwordChangeSubmitted = false;
  profileUpdateSubmitted = false;
  passwordChangeSuccess = false;
  environment = environment;
  selectedCVFile?: File;
  cvFileName?: string;
  cvUploadProgress = 0;
  isSecretary = false;
  userRole = '';
  apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private http: HttpClient,
    private dialog: MatDialog
  ) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if the user is a secretary
    const role = this.authService.getUserRole();
    this.userRole = role || '';
    this.isSecretary = role?.toLowerCase() === 'secretaire';
  }

  ngOnInit(): void {
    console.log('Profile component initialized');
    this.initializeForm();
    this.loadProfile();
    this.testBackendConnection();
    
    // Reset success state when user starts typing in password form
    this.passwordForm.valueChanges.subscribe(() => {
      if (this.passwordChangeSuccess) {
        this.passwordChangeSuccess = false;
      }
    });
  }

  private initializeForm(): void {
    console.log('Initializing forms');
    // Main profile form - no required fields
    this.profileForm = this.fb.group({
      nom: [''],
      prenom: [''],
      email: ['', [Validators.email]],
      address: [''],
      phoneNumber: ['', [Validators.pattern('^[0-9]{8}$')]]
    });

    // Password change form with validation
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
    console.log('Forms initialized:', {
      profileForm: this.profileForm,
      passwordForm: this.passwordForm
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  loadProfile(): void {
    this.loading = true;
    console.log('Loading profile...');
    const token = localStorage.getItem('auth_token');
    console.log('Current token:', token);
    
    this.profileService.getCurrentProfile().subscribe({
      next: (profile) => {
        console.log('Profile loaded successfully:', profile);
        this.userProfile = profile;
        if (this.profileForm) {
          this.profileForm.patchValue(profile);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.snackBar.open('Error loading profile', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  toggleEditForm(): void {
    this.showEditForm = !this.showEditForm;
    if (this.showEditForm && this.userProfile) {
      this.profileForm.patchValue(this.userProfile);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // File validation
      if (file.size > 5000000) { // 5MB limit
        this.snackBar.open('File size should not exceed 5MB', 'Close', { duration: 3000 });
        this.selectedFile = undefined;
        return;
      }
      
      if (!file.type.match(/image\/(png|jpeg|jpg|gif)$/)) {
        this.snackBar.open('Invalid file type. Please upload an image file (PNG, JPEG, JPG, GIF).', 'Close', { duration: 3000 });
        this.selectedFile = undefined;
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadProfilePicture(): void {
    if (!this.selectedFile) return;

    this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.snackBar.open('Profile picture updated successfully', 'Close', { duration: 3000 });
          this.uploadProgress = 0;
          
          // Update the user profile to get the new profile picture path
          this.loadProfile();
          
          // Clear the selected file
          this.selectedFile = undefined;
        }
      },
      error: (error) => {
        this.snackBar.open('Error uploading profile picture', 'Close', { duration: 3000 });
        this.uploadProgress = 0;
      }
    });
  }

  onSubmitProfile(): void {
    this.profileUpdateSubmitted = true;
    
    // Check if form is valid (considering the non-required fields with validators)
    if (this.profileForm.valid) {
      this.loading = true;
      const profileData = this.profileForm.value;

      this.profileService.updateProfile(profileData).subscribe({
        next: (response) => {
          this.userProfile = response;
          this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
          this.loading = false;
        },
        error: (error) => {
          this.snackBar.open('Error updating profile', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });

      if (this.selectedFile) {
        this.uploadProfilePicture();
      }
    } else {
      // Show error for invalid fields
      this.snackBar.open('Please correct the errors in the form', 'Close', { duration: 3000 });
    }
  }

  onSubmitPassword(): void {
    this.passwordChangeSubmitted = true;
    
    if (this.passwordForm.valid) {
      this.loading = true;
      const passwordData = {
        currentPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value
      };

      this.profileService.changePassword(passwordData).subscribe({
        next: () => {
          this.snackBar.open('Password changed successfully', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Set success state and hide the form
          this.passwordChangeSuccess = true;
          this.loading = false;
          
          // After 5 seconds, show the form again with a fresh state
          setTimeout(() => {
            this.passwordChangeSuccess = false;
            // Create a new form with validators
            this.passwordForm = this.fb.group({
              currentPassword: ['', [Validators.required]],
              newPassword: ['', [Validators.required, Validators.minLength(8)]],
              confirmPassword: ['', [Validators.required]]
            }, {
              validators: this.passwordMatchValidator
            });
            // Reset submission state
            this.passwordChangeSubmitted = false;
          }, 5000);
        },
        error: (error) => {
          this.snackBar.open('Error changing password. Please check your current password.', 'Close', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.loading = false;
        }
      });
    }
  }

  cancelEdit(): void {
    this.showEditForm = false;
    this.selectedFile = undefined;
    this.previewUrl = undefined;
    this.profileForm.reset();
    this.passwordForm.reset();
    this.profileUpdateSubmitted = false;
    this.passwordChangeSubmitted = false;
    this.passwordChangeSuccess = false;
    if (this.userProfile) {
      this.profileForm.patchValue(this.userProfile);
    }
  }

  // Helper method to get the full profile image URL
  getProfileImageUrl(profilePicturePath?: string): string {
    if (profilePicturePath) {
      try {
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        // Ensure path is properly formatted with profile-pictures/ prefix if not already included
        const path = profilePicturePath.includes('/') ? 
          profilePicturePath : 
          `profile-pictures/${profilePicturePath}`;
        
        const url = `${environment.apiUrl}/api/v1/api/users/profile/picture/${path}?t=${timestamp}`;
        console.log('Profile picture URL:', url);
        return url;
      } catch (error) {
        console.error('Error generating profile picture URL:', error);
        return 'assets/images/default-avatar.png';
      }
    }
    console.log('Using default avatar');
    return 'assets/images/default-avatar.png';
  }

  testBackendConnection(): void {
    const url = `${environment.apiUrl}/api/v1/api/users/test`;
    console.log('Testing backend connection to:', url);
    
    this.http.get(url).subscribe({
      next: (response) => {
        console.log('Backend connection successful:', response);
      },
      error: (error) => {
        console.error('Backend connection failed:', error);
      }
    });
  }

  onCVFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedCVFile = file;
      this.cvFileName = file.name;
      
      // File validation
      if (file.size > 10000000) { // 10MB limit
        this.snackBar.open('Le fichier ne doit pas dépasser 10MB', 'Fermer', { duration: 3000 });
        this.selectedCVFile = undefined;
        this.cvFileName = undefined;
        return;
      }
      
      if (!file.type.match(/application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/)) {
        this.snackBar.open('Format de fichier invalide. Veuillez télécharger un fichier PDF ou DOC/DOCX.', 'Fermer', { duration: 3000 });
        this.selectedCVFile = undefined;
        this.cvFileName = undefined;
        return;
      }
    }
  }

  uploadCV(): void {
    if (!this.selectedCVFile) return;

    this.profileService.uploadCV(this.selectedCVFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.cvUploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.snackBar.open('CV mis à jour avec succès', 'Fermer', { duration: 3000 });
          this.cvUploadProgress = 0;
          
          // Update the user profile to get the new CV path
          this.loadProfile();
          
          // Clear the selected file
          this.selectedCVFile = undefined;
          this.cvFileName = undefined;
        }
      },
      error: (error) => {
        console.error('Error uploading CV:', error);
        this.snackBar.open('Une erreur est survenue lors du téléchargement du CV', 'Fermer', { duration: 3000 });
        this.cvUploadProgress = 0;
      }
    });
  }

  viewCV(): void {
    if (this.userProfile?.cvFilePath) {
      this.dialog.open(CvViewerDialogComponent, {
        width: '800px',
        height: '700px',
        data: {
          cvFilePath: this.userProfile.cvFilePath
        }
      });
    }
  }
}
