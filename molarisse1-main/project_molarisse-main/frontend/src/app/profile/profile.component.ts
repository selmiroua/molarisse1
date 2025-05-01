import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
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
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PatientService, FichePatient, PatientDocument } from '../core/services/patient.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
    MatExpansionModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatListModule
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
  fichePatient?: FichePatient;
  uploadedFiles: File[] = [];
  maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
  documents: PatientDocument[] = [];

  commonAllergies = [
    'Pénicilline',
    'Latex',
    'Anesthésiques',
    'Iode',
    'Métaux',
    'Pollen',
    'Acariens',
    'Aspirine',
    'Fruits de mer',
    'Arachides'
  ];

  etatGeneralOptions = [
    'excellent',
    'good',
    'fair',
    'poor'
  ];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private patientService: PatientService,
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
    this.userRole = this.authService.getUserRole() || '';
    this.initializeForms();
    this.loadProfile();
    if (this.userRole === 'PATIENT') {
      this.loadPatientFiche();
      this.loadDocuments();
    }
    this.testBackendConnection();
    
    // Reset success state when user starts typing in password form
    this.passwordForm.valueChanges.subscribe(() => {
      if (this.passwordChangeSuccess) {
        this.passwordChangeSuccess = false;
      }
    });
  }

  private initializeForms(): void {
    console.log('Initializing forms');
    const baseFormControls = {
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.pattern('^[0-9+]{8,}$')]],
      adresse: [''],
      age: ['', [Validators.min(0), Validators.max(120)]],
      genre: ['', Validators.required]
    };

    // Add role-specific form controls
    if (this.userRole === 'DOCTOR') {
      this.profileForm = this.fb.group({
        ...baseFormControls,
        ville: ['', Validators.required]
      });
    } else {
      this.profileForm = this.fb.group({
        ...baseFormControls,
        profession: [''],
        etatGeneral: [''],
        antecedentsChirurgicaux: [''],
        priseMedicamenteuse: ['non'],
        medicationDetails: ['']
      });
    }

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

    // Add conditional validation for medication details
    if (this.userRole === 'PATIENT') {
      this.profileForm.get('priseMedicamenteuse')?.valueChanges.subscribe(value => {
        const medicationDetailsControl = this.profileForm.get('medicationDetails');
        if (value === 'oui') {
          medicationDetailsControl?.setValidators([Validators.required]);
        } else {
          medicationDetailsControl?.clearValidators();
        }
        medicationDetailsControl?.updateValueAndValidity();
      });
    }
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

  loadPatientFiche(): void {
    this.loading = true;
    this.patientService.getCurrentPatientFiche().subscribe({
      next: (fiche) => {
        console.log('Patient fiche loaded:', fiche);
        this.fichePatient = fiche;
        
        if (this.profileForm) {
          // Map the etatGeneral value directly from the database
          const etatGeneral = fiche.etatGeneral || '';
          console.log('Loading état général:', etatGeneral); // Debug log
          
          this.profileForm.patchValue({
            prenom: fiche.prenom,
            nom: fiche.nom,
            age: fiche.age,
            genre: fiche.sexe,
            profession: fiche.profession,
            telephone: fiche.telephone,
            adresse: fiche.adresse,
            etatGeneral: etatGeneral,
            antecedentsChirurgicaux: fiche.antecedentsChirurgicaux,
            priseMedicamenteuse: fiche.priseMedicaments ? 'oui' : 'non',
            medicationDetails: fiche.priseMedicaments
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading patient fiche:', error);
        this.snackBar.open('Error loading medical information', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  getAllergies(): string[] {
    if (!this.fichePatient?.allergies) return [];
    try {
      return JSON.parse(this.fichePatient.allergies);
    } catch {
      return [];
    }
  }

  toggleEditForm(): void {
    this.showEditForm = !this.showEditForm;
    if (this.showEditForm && this.userProfile) {
      this.profileForm.patchValue(this.userProfile);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  handleFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > this.maxFileSize) {
        this.snackBar.open(`Le fichier ${file.name} dépasse la limite de 10MB`, 'Fermer', { duration: 3000 });
        continue;
      }
      
      if (!this.isValidFileType(file)) {
        this.snackBar.open(`Le type de fichier de ${file.name} n'est pas supporté`, 'Fermer', { duration: 3000 });
        continue;
      }

      this.uploadedFiles.push(file);
    }
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  isValidFileType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    return validTypes.includes(file.type);
  }

  uploadFiles(): void {
    if (this.uploadedFiles.length === 0) return;

    const formData = new FormData();
    this.uploadedFiles.forEach((file, index) => {
      formData.append('file', file);
    });

    this.patientService.uploadDocuments(formData).subscribe({
      next: (response) => {
        this.snackBar.open('Documents téléchargés avec succès', 'Fermer', { duration: 3000 });
        this.uploadedFiles = [];
        this.loadDocuments();
      },
      error: (error) => {
        console.error('Error uploading documents:', error);
        this.snackBar.open('Erreur lors du téléchargement des documents', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadDocuments(): void {
    this.patientService.getDocuments().subscribe({
      next: (documents) => {
        this.documents = documents;
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.snackBar.open('Erreur lors du chargement des documents', 'Fermer', { duration: 3000 });
      }
    });
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

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      const formData = this.profileForm.value;
      
      if (this.userRole === 'PATIENT') {
        const fichePatient: FichePatient = {
          id: this.fichePatient?.id,
          patientId: this.fichePatient?.patientId,
          nom: formData.nom,
          prenom: formData.prenom,
          age: formData.age,
          sexe: formData.genre,
          profession: formData.profession,
          telephone: formData.telephone,
          adresse: formData.adresse,
          etatGeneral: formData.etatGeneral,
          antecedentsChirurgicaux: formData.antecedentsChirurgicaux,
          priseMedicaments: formData.priseMedicamenteuse === 'oui' ? formData.medicationDetails : null,
          allergies: this.fichePatient?.allergies
        };

        this.patientService.updatePatientFiche(fichePatient).subscribe({
          next: (response) => {
            console.log('Profile updated successfully:', response);
            this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
            this.loading = false;
            this.fichePatient = response;
          },
          error: (error) => {
            console.error('Error updating profile:', error);
            this.snackBar.open('Error updating profile', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      } else {
        // Update regular user profile
        this.profileService.updateProfile(formData).subscribe({
          next: (response) => {
            console.log('Profile updated successfully:', response);
            this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating profile:', error);
            this.snackBar.open('Error updating profile', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      }
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

  addAllergy(allergie: string) {
    if (!allergie.trim()) return;
    
    // Convert to title case
    allergie = allergie.trim().split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    if (this.isAllergyPresent(allergie)) {
      this.snackBar.open('Cette allergie est déjà dans la liste', 'Fermer', { duration: 3000 });
      return;
    }
    
    const currentAllergies = this.getAllergies();
    currentAllergies.push(allergie);
    
    // Update the fiche patient with new allergies
    if (this.fichePatient) {
      this.fichePatient.allergies = JSON.stringify(currentAllergies);
      
      // Update on the server
      this.patientService.updatePatientFiche(this.fichePatient).subscribe({
        next: (response) => {
          this.fichePatient = response;
          this.snackBar.open('Allergie ajoutée avec succès', 'Fermer', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error updating allergies:', error);
          this.snackBar.open('Erreur lors de l\'ajout de l\'allergie', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  removeAllergy(allergie: string) {
    const currentAllergies = this.getAllergies().filter(a => a !== allergie);
    
    // Update the fiche patient with new allergies
    if (this.fichePatient) {
      this.fichePatient.allergies = JSON.stringify(currentAllergies);
      
      // Update on the server
      this.patientService.updatePatientFiche(this.fichePatient).subscribe({
        next: (response) => {
          this.fichePatient = response;
          this.snackBar.open('Allergie supprimée avec succès', 'Fermer', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error updating allergies:', error);
          this.snackBar.open('Erreur lors de la suppression de l\'allergie', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  isAllergyPresent(allergie: string): boolean {
    return this.getAllergies().includes(allergie);
  }

  viewDocument(fiche: FichePatient): void {
    if (!fiche.documentPath) {
      this.snackBar.open('Aucun document à afficher', 'Fermer', { duration: 3000 });
      return;
    }

    // Construct the document URL
    const documentUrl = `${this.apiUrl}/patients/me/fiche/document`;
    
    // Open the document in a new window/tab
    window.open(documentUrl, '_blank');
  }

  deleteDocument(fiche: FichePatient): void {
    // First, confirm with the user
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    // Clear the document fields in the fiche
    fiche.documentPath = null;
    fiche.documentName = null;
    fiche.documentType = null;
    fiche.documentSize = null;
    fiche.documentUploadDate = null;

    // Update the fiche patient
    this.patientService.updateFichePatient(fiche).subscribe({
      next: (updatedFiche) => {
        this.fichePatient = updatedFiche;
        this.snackBar.open('Document supprimé avec succès', 'Fermer', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error deleting document:', error);
        this.snackBar.open('Erreur lors de la suppression du document', 'Fermer', { duration: 3000 });
      }
    });
  }
}
