import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DoctorService } from '../core/services/doctor.service';
import { ProfileService, UserProfile } from '../profile/profile.service';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of, EMPTY } from 'rxjs';
import { environment } from '../environments/environment';
// Import necessary services (e.g., PatientService, DoctorService)
 //import { PatientService } from '../core/services/patient.service'; 
// import { DoctorService } from '../core/services/doctor.service';

interface DialogData {
  patientId: number;
  doctorId: number;
  appointmentId?: number; // Optional appointment ID if needed
  viewOnly?: boolean; // Add this flag
}

interface DoctorInfo {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    dateNaissance?: string | null;
    phoneNumber?: string;
    speciality?: string;
}

interface DocumentInfo {
  id: number;
  name: string;
  url: string;
  type: string;
}

@Component({
  selector: 'app-fiche-patient',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './fiche-patient.component.html',
  styleUrls: ['./fiche-patient.component.scss']
})
export class FichePatientComponent implements OnInit {
  fichePatientForm: FormGroup;
  saving = false;
  loading = true;
  doctorInfo: DoctorInfo | null = null;
  selectedFiles: File[] = [];
  dentalChartImageUrl: string = 'assets/images/shemadentaire.png';
  isViewOnly = false;
  attachedDocuments: DocumentInfo[] = [];
  private currentPatientId: number | null = null;
  private currentDoctorId: number | null = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FichePatientComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private doctorService: DoctorService,
    private profileService: ProfileService
  ) {
    console.log('Dialog Data:', data);
    this.isViewOnly = data.viewOnly || false;
    
    // Get the exact IDs from the appointment data
    this.currentPatientId = data.patientId;
    this.currentDoctorId = data.doctorId;
    
    console.log('Setting patient ID:', this.currentPatientId);
    console.log('Setting doctor ID:', this.currentDoctorId);
    
    this.fichePatientForm = this.fb.group({
      // Basic Info
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      dateNaissance: [null],
      profession: [''],
      telephone: [''],
      adresse: [''],
      adressePar: [''],
      sexe: [''],
      medecinTraitant: [''],
      
      // Dental Observations
      observationsDentaires: [''],

      // Medical History
      etatGeneral: [''],
      antecedentsChirurgicaux: [''],
      priseMedicaments: [''],
      allergies: [''],

      // Interventions
      interventions: this.fb.array([])
    });

    if (this.isViewOnly) {
      this.fichePatientForm.disable();
    }
  }

  ngOnInit(): void {
    console.log('FichePatient initialized with data:', this.data);

    if (!this.data.patientId) {
      console.error('No patient ID provided');
      this.snackBar.open('Erreur: ID du patient manquant', 'Fermer', { duration: 3000 });
      this.loading = false;
      return;
    }

    // Load both patient and doctor data using the IDs from data directly
    this.loadPatientData(this.data.patientId);
    if (this.data.doctorId) {
      this.loadDoctorData(this.data.doctorId);
    }
  }

  loadPatientData(patientId: number): void {
    console.log('Loading patient fiche data for ID:', patientId);
    this.loading = true;

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
      this.snackBar.open('Erreur: Token d\'authentification manquant', 'Fermer', { duration: 3000 });
      this.loading = false;
      return;
    }

    // Always use the patient ID from the data
    const url = `${environment.apiUrl}/api/patients/${patientId}/fiche`;
    console.log('Requesting patient fiche at URL:', url);

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(url, { headers }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          console.log('No existing fiche found');
          if (!this.isViewOnly) {
            // Only show empty form for new fiche if not in view-only mode
            this.fichePatientForm.patchValue({
              nom: '',
              prenom: '',
              dateNaissance: '',
              telephone: '',
              email: '',
              adresse: '',
              ville: '',
              codePostal: '',
              numeroSecuriteSociale: '',
              medecinTraitant: '',
              antecedents: '',
              allergies: '',
              traitementEnCours: ''
            });
          } else {
            this.snackBar.open('Aucune fiche patient trouvée', 'Fermer', { duration: 3000 });
          }
          this.loading = false;
          return EMPTY;
        }
        console.error('Error loading patient fiche:', error);
        this.snackBar.open('Erreur lors du chargement de la fiche patient', 'Fermer', { duration: 3000 });
        this.loading = false;
        return EMPTY;
      })
    ).subscribe(response => {
      console.log('Received patient fiche:', response);
      if (response) {
        // Update form with patient data
        this.updateFormWithPatientData(response);
        
        // If in view-only mode, disable the form
        if (this.isViewOnly) {
          this.fichePatientForm.disable();
        }
      }
      this.loading = false;
    });
  }

  private getCorrectId(id: any): number {
    // Always return the patient ID from the appointment data
    return this.data.patientId;
  }

  private updateFormWithPatientData(data: any): void {
    console.log('Raw patient data received:', data);
    
    // Get the correct patient ID
    const patientId = data.patient_id || (data.patient && data.patient.id) || data.id || -1;
    console.log('Using patient ID:', patientId);

    // Get patient data from the correct location
    const patientData = data.patient || data;
    console.log('Using patient data:', patientData);

    this.fichePatientForm.patchValue({
      nom: patientData.nom || '',
      prenom: patientData.prenom || '',
      dateNaissance: patientData.dateNaissance ? new Date(patientData.dateNaissance) : null,
      profession: patientData.profession || '',
      telephone: patientData.telephone || '',
      adresse: patientData.adresse || '',
      adressePar: patientData.adressePar || '',
      sexe: patientData.sexe || '',
      observationsDentaires: data.observationsDentaires || '',
      etatGeneral: data.etatGeneral || '',
      antecedentsChirurgicaux: data.antecedentsChirurgicaux || '',
      priseMedicaments: data.priseMedicaments || '',
      allergies: data.allergies || ''
    });

    console.log('Form updated with values:', this.fichePatientForm.value);
    
    // Handle interventions if they exist
    if (data.interventions && Array.isArray(data.interventions)) {
      console.log('Processing interventions:', data.interventions);
      this.interventions.clear();
      data.interventions.forEach((intervention: any) => {
        const interventionGroup = this.fb.group({
          date: [intervention.date ? new Date(intervention.date) : null],
          nature: [intervention.nature || ''],
          doit: [intervention.doit || null],
          recu: [intervention.recu || null]
        });
        this.interventions.push(interventionGroup);
      });
    }
    
    // Handle documents if they exist
    if (data.documents && Array.isArray(data.documents)) {
      console.log('Processing documents:', data.documents);
      this.attachedDocuments = data.documents.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        url: doc.url,
        type: doc.type
      }));
    }
  }

  loadDoctorData(doctorId: number): void {
    console.log('Loading doctor data for ID:', doctorId);
    
    if (!doctorId || doctorId <= 0) {
      console.error('Invalid doctor ID:', doctorId);
      this.snackBar.open('Erreur: ID du médecin invalide', 'Fermer', { duration: 3000 });
      return;
    }
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
      this.snackBar.open('Erreur: Token d\'authentification manquant', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.doctorService.getDoctorById(doctorId).pipe(
      catchError(error => {
        console.error('Error loading doctor data:', error);
        this.snackBar.open('Erreur lors du chargement des données du médecin', 'Fermer', { duration: 3000 });
        return EMPTY;
      })
    ).subscribe(doctor => {
      if (doctor) {
        console.log('Doctor data received:', doctor);
        this.doctorInfo = {
          id: doctor.id,
          nom: doctor.nom || 'N/A',
          prenom: doctor.prenom || 'N/A',
          email: doctor.email || 'N/A',
          phoneNumber: doctor.phoneNumber || 'N/A',
          speciality: doctor.specialities?.[0] || 'N/A'
        };
        
        this.fichePatientForm.patchValue({
          medecinTraitant: `${this.doctorInfo.nom} ${this.doctorInfo.prenom}`
        });
      }
    });
  }

  get interventions(): FormArray {
    return this.fichePatientForm.get('interventions') as FormArray;
  }

  createInterventionGroup(): FormGroup {
    return this.fb.group({
      date: [null],
      nature: [''],
      doit: [null], // Amount due
      recu: [null]  // Amount received
    });
  }

  addIntervention(): void {
    this.interventions.push(this.createInterventionGroup());
  }

  removeIntervention(index: number): void {
    this.interventions.removeAt(index);
  }

  // --- File Upload Handlers --- 
  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;

    if (fileList) {
      // Add newly selected files to the array
      for (let i = 0; i < fileList.length; i++) {
        this.selectedFiles.push(fileList[i]);
      }
      // Optionally clear the input for the next selection
      element.value = ''; 
    }
  }

  removeSelectedFile(index: number): void {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
    }
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  // --- End File Upload Handlers ---

  onSubmit(): void {
    if (this.isViewOnly) {
      this.dialogRef.close();
      return;
    }

    if (this.fichePatientForm.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires.', 'Fermer', { duration: 3000 });
      return;
    }

    this.saving = true;
    const formData = this.fichePatientForm.value;
    console.log('Submitting Fiche Patient:', formData);

    // Create the fiche patient object with the exact IDs from data
    const fichePatient = {
      ...formData,
      patientId: this.data.patientId,
      doctorId: this.data.doctorId
    };

    const token = localStorage.getItem('access_token');
    if (!token) {
      this.snackBar.open('Erreur d\'authentification', 'Fermer', { duration: 3000 });
      this.saving = false;
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Submit using the exact patient ID from data
    this.http.post(`${environment.apiUrl}/api/patients/${this.data.patientId}/fiche`, fichePatient, { headers })
      .pipe(
        catchError(error => {
          console.error('Error saving patient data:', error);
          this.snackBar.open(`Erreur: ${error.error?.message || 'Erreur lors de l\'enregistrement'}`, 'Fermer', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            console.log('Fiche patient saved:', response);
            this.snackBar.open('Fiche patient enregistrée avec succès', 'Fermer', { duration: 3000 });
            this.dialogRef.close({
              completed: true,
              data: response
            });
          }
        },
        error: (error) => {
          console.error('Error in subscribe:', error);
        },
        complete: () => {
          this.saving = false;
        }
      });
  }

  handleImageError(event: any) {
    const defaultImage = 'assets/images/shemadentaire.png';
    if (event.target.src !== defaultImage) {
      event.target.src = defaultImage;
    }
  }

  viewDocument(doc: DocumentInfo): void {
    // If the document is an image or PDF, open in a new tab
    if (doc.url) {
      window.open(doc.url, '_blank');
    } else {
      this.snackBar.open('Document non disponible', 'Fermer', { duration: 3000 });
    }
  }
} 