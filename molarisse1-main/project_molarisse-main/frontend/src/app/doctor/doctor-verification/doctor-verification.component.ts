import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DoctorService } from '../../core/services/doctor.service';
import { DoctorVerificationService } from '../../core/services/doctor-verification.service';
import { DoctorVerification } from '../../core/models/doctor-verification.model';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../core/services/user.service';

// Définir une interface simple pour le modèle de docteur
interface DoctorModel {
  verificationStatus?: string;
  rejectionReason?: string;
  cabinetName?: string;
  yearsOfExperience?: number;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  specialty?: string;
  description?: string;
}

// Interface pour le service d'authentification
interface AuthService {
  getCurrentUserId(): number | null;
}

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NONE = 'none'
}

// Add the interface for verification response that matches the doctor-verification model
interface VerificationResponse {
  id?: number;
  doctorId: number;
  specialtyId: number;
  licenseNumber: string;
  professionalSummary: string;
  cabinetAddress: string;
  status: string;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-doctor-verification',
  templateUrl: './doctor-verification.component.html',
  styleUrls: ['./doctor-verification.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatChipsModule
  ]
})
export class DoctorVerificationComponent implements OnInit {
  verificationForm: FormGroup;
  loading = true;
  submitting = false;
  verificationStatus: VerificationStatus = VerificationStatus.NONE;
  rejectionReason: string = '';
  
  // Expose the enum to the template
  VerificationStatus = VerificationStatus;
  
  cabinetPhotoFile: File | null = null;
  cabinetPhotoPreview: SafeUrl | null = null;
  
  diplomaFile: File | null = null;
  diplomaPreview: SafeUrl | null = null;
  
  // Properties for file preview functionality
  selectedFile: File | null = null;
  filePreviewUrl: SafeUrl | null = null;
  
  specialties: string[] = [
    'Dentisterie générale',
    'Orthodontie',
    'Chirurgie buccale et maxillo-faciale',
    'Parodontie',
    'Endodontie',
    'Prothèse dentaire',
    'Dentisterie pédiatrique',
    'Dentisterie esthétique',
    'Implantologie',
    'Radiologie buccale',
    'Médecine buccale',
    'Dentisterie gériatrique',
    'Dentisterie préventive'
  ];

  private formBuilder = inject(FormBuilder);
  private doctorService = inject(DoctorService);
  private verificationService = inject(DoctorVerificationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  private userService = inject(UserService);

  constructor() {
    this.verificationForm = this.formBuilder.group({
      cabinetName: ['', Validators.required],
      yearsOfExperience: ['', [Validators.required, Validators.min(0)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.minLength(4)]],
      phone: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.required, Validators.email]],
      specialty: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      cabinetPhoto: [''],
      diploma: ['']
    });
  }

  ngOnInit(): void {
    this.loadDoctorVerificationStatus();
  }

  loadDoctorVerificationStatus(): void {
    this.loading = true;
    const doctorId = this.getCurrentDoctorId();
    
    if (!doctorId) {
      this.snackBar.open('Erreur d\'authentification. Veuillez vous reconnecter.', 'Fermer', {
        duration: 5000
      });
      this.loading = false;
      return;
    }

    // Simuler le chargement car la méthode n'existe pas encore
    setTimeout(() => {
      this.loading = false;
      // Mockup data
      const mockDoctor: DoctorModel = {
        verificationStatus: 'none',
        rejectionReason: '',
      };
      
      this.verificationStatus = this.mapStatusStringToEnum(mockDoctor.verificationStatus || '');
      this.rejectionReason = mockDoctor.rejectionReason || '';
    }, 1000);

    // Lorsque l'API sera prête, décommenter ce code:
    /*
    this.doctorService.getDoctorVerification(doctorId).pipe(
      finalize(() => this.loading = false)
    ).subscribe(
      (doctor: DoctorModel) => {
        if (doctor) {
          this.verificationStatus = this.mapStatusStringToEnum(doctor.verificationStatus || '');
          this.rejectionReason = doctor.rejectionReason || '';
          
          // Populate form with existing data if available
          if (doctor.cabinetName) {
            this.verificationForm.patchValue({
              cabinetName: doctor.cabinetName,
              yearsOfExperience: doctor.yearsOfExperience,
              address: doctor.address,
              city: doctor.city,
              postalCode: doctor.postalCode,
              phone: doctor.phone,
              email: doctor.email,
              specialty: doctor.specialty,
              description: doctor.description
            });
          }
        }
      },
      (error: any) => {
        console.error('Error loading doctor verification status', error);
        this.snackBar.open('Erreur lors du chargement des données de vérification.', 'Fermer', {
          duration: 5000
        });
      }
    );
    */
  }

  onCabinetPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.cabinetPhotoFile = input.files[0];
      this.cabinetPhotoPreview = this.sanitizer.bypassSecurityTrustUrl(
        URL.createObjectURL(this.cabinetPhotoFile)
      );
      this.verificationForm.get('cabinetPhoto')?.setValue(this.cabinetPhotoFile.name);
      this.verificationForm.get('cabinetPhoto')?.markAsDirty();
    }
  }

  onDiplomaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.diplomaFile = input.files[0];
      this.diplomaPreview = this.sanitizer.bypassSecurityTrustUrl(
        URL.createObjectURL(this.diplomaFile)
      );
      this.verificationForm.get('diploma')?.setValue(this.diplomaFile.name);
      this.verificationForm.get('diploma')?.markAsDirty();
    }
  }

  removeCabinetPhoto(): void {
    this.cabinetPhotoFile = null;
    this.cabinetPhotoPreview = null;
    this.verificationForm.get('cabinetPhoto')?.setValue('');
    this.verificationForm.get('cabinetPhoto')?.markAsDirty();
  }

  removeDiploma(): void {
    this.diplomaFile = null;
    this.diplomaPreview = null;
    this.verificationForm.get('diploma')?.setValue('');
    this.verificationForm.get('diploma')?.markAsDirty();
  }

  triggerCabinetPhotoInput(): void {
    document.getElementById('cabinetPhotoInput')?.click();
  }

  triggerDiplomaInput(): void {
    document.getElementById('diplomaInput')?.click();
  }

  onSubmit(): void {
    if (this.verificationForm.valid) {
      this.submitting = true;
      
      const verificationData = {
        doctorId: this.getCurrentDoctorId(),
        address: this.verificationForm.get('address')?.value,
        cabinetAddress: this.verificationForm.get('address')?.value, // Using same address for now
        yearsOfExperience: parseInt(this.verificationForm.get('yearsOfExperience')?.value) || 0,
        specialties: [this.verificationForm.get('specialty')?.value],
        postalCode: this.verificationForm.get('postalCode')?.value,
        email: this.verificationForm.get('email')?.value,
        cabinetName: this.verificationForm.get('cabinetName')?.value,
        phoneNumber: this.verificationForm.get('phone')?.value,
        message: this.verificationForm.get('description')?.value
      };

      console.log('Submitting verification data:', verificationData);
      
      this.verificationService.submitVerification(verificationData)
        .pipe(finalize(() => this.submitting = false))
        .subscribe({
          next: (response) => {
            console.log('Verification submitted successfully:', response);
            
            // Now upload files if they exist
            const uploadPromises: Promise<any>[] = [];
            
            if (this.cabinetPhotoFile && response.id) {
              uploadPromises.push(
                this.verificationService.uploadCabinetPhoto(response.id, this.cabinetPhotoFile)
                  .toPromise()
                  .catch(error => {
                    console.error('Error uploading cabinet photo:', error);
                    this.snackBar.open('Erreur lors du téléchargement de la photo du cabinet', 'Fermer', {
                      duration: 5000
                    });
                  })
              );
            }
            
            if (this.diplomaFile && response.id) {
              uploadPromises.push(
                this.verificationService.uploadDiplomaPhoto(response.id, this.diplomaFile)
                  .toPromise()
                  .catch(error => {
                    console.error('Error uploading diploma:', error);
                    this.snackBar.open('Erreur lors du téléchargement du diplôme', 'Fermer', {
                      duration: 5000
                    });
                  })
              );
            }

            // Wait for all uploads to complete
            Promise.all(uploadPromises)
              .then(() => {
                this.snackBar.open('Votre demande de vérification a été soumise avec succès!', 'Fermer', {
                  duration: 5000
                });
                this.verificationStatus = VerificationStatus.PENDING;
              })
              .catch(error => {
                console.error('Error during file uploads:', error);
              });
          },
          error: (error) => {
            console.error('Error submitting verification:', error);
            let errorMessage = 'Erreur lors de la soumission de la vérification.';
            if (error.error && error.error.message) {
              errorMessage += ` ${error.error.message}`;
            }
            this.snackBar.open(errorMessage, 'Fermer', {
              duration: 5000
            });
          }
        });
    } else {
      this.markFormGroupTouched(this.verificationForm);
      this.logFormErrors();
    }
  }

  // Helper method to log form errors for debugging
  logFormErrors(): void {
    console.log('Form valid:', this.verificationForm.valid);
    console.log('Form values:', this.verificationForm.value);
    console.log('Form errors:');
    
    Object.keys(this.verificationForm.controls).forEach(key => {
      const control = this.verificationForm.get(key);
      if (control?.errors) {
        console.log(`${key} errors:`, control.errors);
      }
    });
    
    // Check specific fields
    console.log('Cabinet photo:', this.cabinetPhotoFile);
    console.log('Diploma:', this.diplomaFile);
  }

  // Helper method to mark all form controls as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  canSubmitVerification(): boolean {
    return this.verificationStatus === VerificationStatus.NONE || 
           this.verificationStatus === VerificationStatus.REJECTED;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.filePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(
        URL.createObjectURL(this.selectedFile)
      );
    }
  }

  // When a specific file is selected, update the selectedFile for preview
  viewFile(file: File): void {
    this.selectedFile = file;
    this.filePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(
      URL.createObjectURL(file)
    );
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isPdfFile(file: File): boolean {
    return file.type === 'application/pdf';
  }

  loadVerificationStatus(): void {
    this.loading = true;
    const doctorId = this.getCurrentDoctorId();
    
    if (!doctorId) {
      this.loading = false;
      this.snackBar.open('Erreur: Impossible de récupérer l\'ID du médecin', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    // Essayer de charger les données avec la première URL
    this.verificationService.getVerificationByDoctorId(doctorId).subscribe({
      next: this.handleVerificationStatusSuccess.bind(this),
      error: (error) => {
        console.error('Erreur lors du chargement avec URL principale:', error);
        
        // Si erreur 404, essayer avec URL alternative #1
        if (error.status === 404) {
          this.verificationService.getVerificationByDoctorIdAlt(doctorId, 1).subscribe({
            next: this.handleVerificationStatusSuccess.bind(this),
            error: (error2) => {
              console.error('Erreur lors du chargement avec URL alt #1:', error2);
              
              // Si toujours erreur, essayer avec URL alternative #2
              if (error2.status === 404) {
                this.verificationService.getVerificationByDoctorIdAlt(doctorId, 2).subscribe({
                  next: this.handleVerificationStatusSuccess.bind(this),
                  error: (error3) => {
                    console.error('Erreur lors du chargement avec URL alt #2:', error3);
                    this.handleVerificationStatusError(error3);
                  }
                });
              } else {
                this.handleVerificationStatusError(error2);
              }
            }
          });
        } else {
          this.handleVerificationStatusError(error);
        }
      }
    });
  }
  
  // Gérer le succès du chargement du statut
  private handleVerificationStatusSuccess(response: any): void {
    console.log('Données de vérification chargées:', response);
    if (response) {
      // Map the status string to our enum
      this.verificationStatus = this.mapStatusStringToEnum(response.status);
      if (response.rejectionReason) {
        this.rejectionReason = response.rejectionReason;
      }
    } else {
      // Si pas de réponse, considérer comme non vérifié
      this.verificationStatus = VerificationStatus.NONE;
    }
    this.loading = false;
  }
  
  // Gérer l'erreur du chargement du statut
  private handleVerificationStatusError(error: any): void {
    console.error('Erreur finale lors du chargement du statut:', error);
    this.loading = false;
    // En cas d'erreur, on suppose que le médecin n'est pas vérifié
    this.verificationStatus = VerificationStatus.NONE;
    
    if (error.status !== 404) {
      // Afficher un message d'erreur seulement si ce n'est pas une erreur 404
      // (404 est attendu pour un nouveau médecin)
      this.snackBar.open('Échec du chargement du statut de vérification', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Map string status from API to our enum
  private mapStatusStringToEnum(status: string): VerificationStatus {
    switch (status) {
      case 'pending': return VerificationStatus.PENDING;
      case 'approved': return VerificationStatus.APPROVED;
      case 'rejected': return VerificationStatus.REJECTED;
      default: return VerificationStatus.NONE;
    }
  }

  // Obtenir l'ID du docteur connecté
  private getCurrentDoctorId(): number {
    // Pour test, si on a un user service avec un utilisateur connecté
    if (this.userService && this.userService.currentUser) {
      return this.userService.currentUser.id;
    }
    // Fallback pour le test, un ID fictif
    return 1; // ID par défaut pour les tests
  }
} 