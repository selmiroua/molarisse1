import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { AppointmentService, AppointmentType, CaseType } from '../../core/services/appointment.service';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { trigger, transition, style, animate } from '@angular/animations';
import { FichePatientComponent } from '../../fiche-patient/fiche-patient.component';

// Define this inline instead of importing from a non-existent file
export interface User {
  id: number;
  nom: string;
  prenom: string;
  specialization: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

@Component({
  selector: 'app-appointment-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    FichePatientComponent
  ],
  template: `
    <div class="appointment-dialog">
      <div class="timeline-container">
        <div class="timeline">
          <div class="timeline-step" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
            <div class="step-icon">
              <mat-icon>person</mat-icon>
            </div>
            <div class="step-label">Infos Patient</div>
          </div>
          <div class="timeline-connector" [class.active]="currentStep > 1"></div>
          <div class="timeline-step" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
            <div class="step-icon">
              <mat-icon>event</mat-icon>
            </div>
            <div class="step-label">Détails RDV</div>
          </div>
          <div class="timeline-connector" [class.active]="currentStep > 2"></div>
          <div class="timeline-step" [class.active]="currentStep >= 3" [class.completed]="currentStep > 3">
            <div class="step-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="step-label">Validation</div>
          </div>
        </div>
      </div>

      <h2 mat-dialog-title>
        <div class="dialog-header">
          <div class="doctor-avatar">
            <div *ngIf="!doctor.profilePicture" class="avatar-initials">
              {{ doctor.prenom[0] }}{{ doctor.nom[0] }}
            </div>
            <img *ngIf="doctor.profilePicture" [src]="doctor.profilePicture" alt="Photo du médecin">
          </div>
          <div class="dialog-title-content">
            <span class="appointment-with">Rendez-vous avec</span>
            <span class="doctor-name">Dr. {{ doctor.prenom }} {{ doctor.nom }}</span>
            <span class="doctor-specialization" *ngIf="doctor.specialization">{{ doctor.specialization }}</span>
          </div>
        </div>
        <button mat-icon-button class="close-button" (click)="closeDialog()" [disabled]="submitting">
          <mat-icon>close</mat-icon>
        </button>
      </h2>

      <mat-dialog-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="!showSuccessPrompt">
          <div class="form-section">
            <h3 class="section-label">
              <mat-icon>event</mat-icon> Date et Heure
            </h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Date du rendez-vous</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="appointmentDate" placeholder="Choisir une date">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="form.get('appointmentDate')?.hasError('required')">
                  La date est obligatoire
                </mat-error>
              </mat-form-field>
            
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Heure</mat-label>
                <input matInput type="time" formControlName="appointmentTime">
                <mat-error *ngIf="form.get('appointmentTime')?.hasError('required')">
                  L'heure est obligatoire
                </mat-error>
              </mat-form-field>
            </div>
          </div>
          
          <div class="form-section">
            <h3 class="section-label">
              <mat-icon>medical_services</mat-icon> Détails médicaux
            </h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Type de cas</mat-label>
                <mat-select formControlName="caseType" required>
                  <mat-option [value]="CaseType.URGENT">Urgent</mat-option>
                  <mat-option [value]="CaseType.CONTROL">Contrôle</mat-option>
                  <mat-option [value]="CaseType.NORMAL">Normal</mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('caseType')?.hasError('required')">
                  Veuillez sélectionner le type de cas
                </mat-error>
              </mat-form-field>
            
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Type de rendez-vous</mat-label>
                <mat-select formControlName="appointmentType" required>
                  <mat-option [value]="AppointmentType.DETARTRAGE">Détartrage</mat-option>
                  <mat-option [value]="AppointmentType.SOIN">Soin</mat-option>
                  <mat-option [value]="AppointmentType.EXTRACTION">Extraction</mat-option>
                  <mat-option [value]="AppointmentType.BLANCHIMENT">Blanchiment</mat-option>
                  <mat-option [value]="AppointmentType.ORTHODONTIE">Orthodontie</mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('appointmentType')?.hasError('required')">
                  Veuillez sélectionner le type de rendez-vous
                </mat-error>
              </mat-form-field>
            </div>
          </div>
          
          <div class="form-section">
            <h3 class="section-label">
              <mat-icon>note</mat-icon> Informations complémentaires
            </h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes (optionnel)</mat-label>
              <textarea matInput rows="4" formControlName="notes" placeholder="Décrivez votre situation ou ajoutez des informations utiles pour le médecin"></textarea>
            </mat-form-field>
          </div>
          
          <div class="action-buttons">
            <button mat-button type="button" (click)="closeDialog()" [disabled]="submitting" class="cancel-button">
              Annuler
            </button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting" class="submit-button">
              <mat-icon>event_available</mat-icon>
              {{ submitting ? 'Réservation en cours...' : 'Confirmer le rendez-vous' }}
            </button>
          </div>
        </form>

        <div *ngIf="showSuccessPrompt" class="success-prompt">
          <div class="success-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <h2>Rendez-vous confirmé !</h2>
          <p>Souhaitez-vous remplir la fiche du patient maintenant ?</p>
          <div class="prompt-actions">
            <button mat-stroked-button (click)="closeDialog()">
              <mat-icon>close</mat-icon>
              Non merci
            </button>
            <button mat-raised-button (click)="openFichePatient()">
              <mat-icon>description</mat-icon>
              Remplir la fiche
            </button>
          </div>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .appointment-dialog {
      padding: 0;
      position: relative;
      max-width: 600px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      padding-right: 40px;
    }
    
    .close-button {
      position: absolute;
      top: 16px;
      right: 16px;
    }
    
    mat-dialog-title {
      padding: 24px 24px 0;
      margin: 0;
    }
    
    .dialog-title-content {
      display: flex;
      flex-direction: column;
    }
    
    .appointment-with {
      font-size: 14px;
      color: #757575;
      margin-bottom: 4px;
    }
    
    .doctor-name {
      font-size: 24px;
      font-weight: 500;
      color: #2196F3;
      margin-bottom: 4px;
    }
    
    .doctor-specialization {
      font-size: 14px;
      color: #424242;
    }
    
    .doctor-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 16px;
      background-color: #2196F3;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 5px rgba(0,0,0,0.2);
    }
    
    .avatar-initials {
      color: white;
      font-size: 24px;
      font-weight: 500;
    }
    
    .doctor-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    mat-dialog-content {
      padding: 24px;
      max-height: calc(100vh - 200px);
    }
    
    .form-section {
      margin-bottom: 24px;
    }
    
    .section-label {
      display: flex;
      align-items: center;
      color: #2196F3;
      font-size: 16px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .section-label mat-icon {
      margin-right: 8px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
    }
    
    .form-field {
      flex: 1;
    }
    
    .full-width {
      width: 100%;
    }
    
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    
    .cancel-button {
      color: #757575;
    }
    
    .submit-button {
      min-width: 200px;
    }
    
    .submit-button mat-icon {
      margin-right: 8px;
    }
    
    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .action-buttons {
        flex-direction: column-reverse;
      }
      
      .submit-button, .cancel-button {
        width: 100%;
      }
    }
    
    .success-prompt {
      text-align: center;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-radius: 12px;
      margin: 20px;
    }
    
    .success-icon {
      width: 80px;
      height: 80px;
      background: #4CAF50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      animation: scaleIn 0.5s ease-out;
    }
    
    .success-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: white;
    }
    
    .success-prompt h2 {
      font-size: 24px;
      margin-bottom: 16px;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .success-prompt p {
      font-size: 18px;
      color: #34495e;
      margin-bottom: 32px;
    }
    
    .prompt-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      width: 100%;
      max-width: 400px;
    }
    
    .prompt-actions button {
      flex: 1;
      padding: 12px 24px;
      border-radius: 30px;
      font-weight: 500;
      min-width: 150px;
      transition: all 0.3s ease;
    }
    
    .prompt-actions button:first-child {
      background-color: #f5f5f5;
      color: #757575;
    }
    
    .prompt-actions button:first-child:hover {
      background-color: #e0e0e0;
    }
    
    .prompt-actions button:last-child {
      background-color: #2196F3;
      color: white;
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
    }
    
    .prompt-actions button:last-child:hover {
      background-color: #1976D2;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
    }
    
    @keyframes scaleIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .timeline-container {
      padding: 24px 24px 0;
      background: linear-gradient(135deg, #f5f5f5, #ffffff);
      border-bottom: 1px solid #e0e0e0;
    }

    .timeline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 40px;
      position: relative;
    }

    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;
      transition: all 0.3s ease;
    }

    .step-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      transition: all 0.3s ease;
    }

    .step-icon mat-icon {
      color: #757575;
      transition: all 0.3s ease;
    }

    .step-label {
      font-size: 12px;
      color: #757575;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .timeline-connector {
      flex: 1;
      height: 2px;
      background-color: #e0e0e0;
      margin: 0 8px;
      position: relative;
      top: -20px;
      transition: all 0.3s ease;
    }

    .timeline-step.active .step-icon {
      background-color: #2196F3;
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
    }

    .timeline-step.active .step-icon mat-icon {
      color: white;
    }

    .timeline-step.active .step-label {
      color: #2196F3;
      font-weight: 600;
    }

    .timeline-step.completed .step-icon {
      background-color: #4CAF50;
    }

    .timeline-step.completed .step-icon mat-icon {
      color: white;
    }

    .timeline-connector.active {
      background-color: #2196F3;
    }

    @keyframes progressAnimation {
      from { width: 0; }
      to { width: 100%; }
    }

    .timeline-connector.active::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background-color: #4CAF50;
      animation: progressAnimation 0.5s ease forwards;
    }
  `]
})
export class AppointmentFormDialogComponent {
  form: FormGroup;
  submitting = false;
  showSuccessPrompt = false;
  createdAppointmentData: any = null;
  CaseType = CaseType;
  AppointmentType = AppointmentType;
  currentStep = 1;
  temporaryAppointmentData: any = null;
  fichePatientCompleted = false;
  
  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private dialogRef: MatDialogRef<AppointmentFormDialogComponent>,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public doctor: User,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      appointmentDate: ['', Validators.required],
      appointmentTime: ['', Validators.required],
      caseType: [CaseType.NORMAL, Validators.required],
      appointmentType: [AppointmentType.DETARTRAGE, Validators.required],
      notes: ['']
    });
  }
  
  onSubmit(): void {
    if (this.form.invalid || this.submitting) return;
    
    this.submitting = true;
    this.currentStep = 2;
    
    const formValues = this.form.value;
    const date = new Date(formValues.appointmentDate);
    const timeParts = formValues.appointmentTime.split(':');
    
    if (timeParts.length !== 2) {
      this.snackBar.open('Format d\'heure invalide.', 'Fermer', { duration: 3000 });
      this.submitting = false;
      return;
    }

    date.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10));

    // Get the patient ID from the appointment data
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.snackBar.open('Erreur: Token d\'authentification manquant', 'Fermer', { duration: 3000 });
      this.submitting = false;
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any>(`${environment.apiUrl}/api/v1/api/patients/me`, { headers }).subscribe({
      next: (response) => {
        // Store the appointment data with the correct patient ID
        this.temporaryAppointmentData = {
          patientId: response.id, // Use the actual patient ID from the response
          doctorId: this.doctor.id,
          appointmentDateTime: date.toISOString(),
          caseType: formValues.caseType,
          appointmentType: formValues.appointmentType,
          notes: formValues.notes
        };

        // Show success prompt to fill fiche patient first
        this.submitting = false;
        this.showSuccessPrompt = true;
        this.currentStep = 3;
      },
      error: (error) => {
        console.error('Error getting patient ID:', error);
        this.snackBar.open('Erreur lors de la récupération des informations du patient', 'Fermer', { duration: 3000 });
        this.submitting = false;
      }
    });
  }

  openFichePatient(): void {
    const dialogRef = this.dialog.open(FichePatientComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true, // Prevent closing by clicking outside
      data: { 
        patientId: this.temporaryAppointmentData?.patientId,
        doctorId: this.temporaryAppointmentData?.doctorId,
        isNewAppointment: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Fiche patient result:', result); // Debug log
      if (result && result.completed) {
        this.fichePatientCompleted = true;
        // Store the fiche patient data if needed
        const fichePatientData = result.data;
        console.log('Fiche patient completed with data:', fichePatientData); // Debug log
        // Now submit the appointment
        this.submitAppointment();
      } else {
        // If fiche patient wasn't completed
        this.snackBar.open('Veuillez compléter la fiche patient pour finaliser le rendez-vous.', 'Fermer', { duration: 5000 });
        // Keep the dialog open
        this.showSuccessPrompt = true;
        this.currentStep = 3;
      }
    });
  }

  private submitAppointment(): void {
    if (!this.temporaryAppointmentData || !this.fichePatientCompleted) {
      this.snackBar.open('Erreur: La fiche patient doit être complétée.', 'Fermer', { duration: 3000 });
      return;
    }

    this.submitting = true;
    console.log('Submitting appointment with data:', this.temporaryAppointmentData); // Debug log
    
    this.appointmentService.bookAppointment(this.temporaryAppointmentData).subscribe({
      next: (response) => {
        console.log('Appointment booked successfully:', response);
        this.snackBar.open('Rendez-vous confirmé avec succès!', 'Fermer', { duration: 3000 });
        this.createdAppointmentData = {
          patientId: this.temporaryAppointmentData.patientId,
          doctorId: this.temporaryAppointmentData.doctorId,
          appointmentId: response.id
        };
        this.submitting = false;
        this.currentStep = 4;
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Erreur lors de la réservation du rendez-vous:', err);
        this.snackBar.open('Échec de la réservation. Veuillez réessayer.', 'Fermer', { duration: 5000 });
        this.submitting = false;
        // Keep the dialog open in case of error
        this.showSuccessPrompt = true;
        this.currentStep = 3;
      }
    });
  }

  closeDialog(): void {
    if (this.submitting) {
      return; // Prevent closing while submitting
    }
    this.dialogRef.close(this.fichePatientCompleted);
  }
}

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatNativeDateModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule
  ],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('pulseAnimation', [
      transition('* => *', [
        animate('2s ease-in-out', style({ transform: 'scale(1.05)' })),
        animate('2s ease-in-out', style({ transform: 'scale(1)' }))
      ])
    ])
  ],
  template: `
    <div class="container">
      <mat-card class="header-card">
        <div class="header-content">
          <div class="title-section">
            <h1 class="main-title">Prendre un rendez-vous</h1>
            <p class="subtitle">Sélectionnez le médecin de votre choix pour prendre un rendez-vous</p>
          </div>
        </div>
      </mat-card>
      
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-text">Chargement des médecins...</p>
      </div>
      
      <div *ngIf="!loading && doctors.length === 0" class="no-doctors">
        <mat-icon color="warn" class="warning-icon">warning</mat-icon>
        <h2>Aucun médecin disponible</h2>
        <p>Veuillez réessayer plus tard ou contacter la clinique directement.</p>
      </div>
      
      <div *ngIf="!loading && doctors.length > 0" class="doctors-container" @cardAnimation>
        <div class="doctor-cards">
          <mat-card class="doctor-card" *ngFor="let doctor of doctors; let i = index" 
                    (click)="openAppointmentDialog(doctor)"
                    [class.featured]="i === 0"
                    [@pulseAnimation]="i === 0 ? 'pulse' : 'none'">
            <div class="card-content">
              <div class="doctor-avatar">
                <div *ngIf="!doctor.profilePicture" class="avatar-initials">
                  {{ doctor.prenom[0] }}{{ doctor.nom[0] }}
                </div>
                <img *ngIf="doctor.profilePicture" [src]="doctor.profilePicture" alt="Photo du médecin">
              </div>
              
              <div class="doctor-info">
                <h2>Dr. {{ doctor.prenom }} {{ doctor.nom }}</h2>
                <div class="specialization-badge" *ngIf="doctor.specialization">
                  {{ doctor.specialization }}
                </div>
                
                <div class="contact-info">
                  <div class="contact-item" *ngIf="doctor.email">
                    <mat-icon>email</mat-icon>
                    <span>{{ doctor.email }}</span>
                  </div>
                  <div class="contact-item" *ngIf="doctor.phoneNumber">
                    <mat-icon>phone</mat-icon>
                    <span>{{ doctor.phoneNumber }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card-actions">
              <button mat-raised-button color="primary" class="book-button">
                <mat-icon>event_available</mat-icon>
                Prendre un rendez-vous
              </button>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 30px auto;
      padding: 0 20px;
    }
    
    .header-card {
      margin-bottom: 30px;
      background: linear-gradient(135deg, #42a5f5, #1976d2);
      color: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(33, 150, 243, 0.3);
    }
    
    .header-content {
      padding: 40px 30px;
    }
    
    .title-section {
      text-align: center;
    }
    
    .main-title {
      font-size: 2.2rem;
      margin: 0 0 10px 0;
      font-weight: 300;
    }
    
    .subtitle {
      font-size: 1.1rem;
      margin: 0;
      opacity: 0.9;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 50px 0;
    }
    
    .loading-text {
      margin-top: 20px;
      font-size: 1.1rem;
      color: #546E7A;
    }
    
    .no-doctors {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 50px 0;
      text-align: center;
    }
    
    .warning-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #f44336;
      margin-bottom: 20px;
    }
    
    .doctors-container {
      padding: 20px 0;
    }
    
    .doctor-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 25px;
    }
    
    .doctor-card {
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      flex-direction: column;
      box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    }
    
    .doctor-card:hover {
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 12px 25px rgba(0,0,0,0.15);
    }
    
    .doctor-card.featured {
      border: 2px solid #2196F3;
      box-shadow: 0 8px 20px rgba(33, 150, 243, 0.25);
      position: relative;
    }
    
    .doctor-card.featured::before {
      content: "Recommandé";
      position: absolute;
      top: 15px;
      right: 15px;
      background-color: #2196F3;
      color: white;
      padding: 4px 12px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 500;
      z-index: 2;
    }
    
    .card-content {
      padding: 25px;
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }
    
    .doctor-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      margin-bottom: 20px;
      background-color: #2196F3;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 5px 15px rgba(33, 150, 243, 0.3);
      border: 4px solid white;
    }
    
    .avatar-initials {
      color: white;
      font-size: 3rem;
      font-weight: 500;
    }
    
    .doctor-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .doctor-info {
      text-align: center;
      width: 100%;
    }
    
    .doctor-info h2 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1.5rem;
      font-weight: 500;
    }
    
    .specialization-badge {
      display: inline-block;
      background-color: rgba(33, 150, 243, 0.1);
      color: #2196F3;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 15px;
    }
    
    .contact-info {
      margin-top: 15px;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 5px;
      color: #616161;
    }
    
    .contact-item mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 5px;
    }
    
    .contact-item span {
      font-size: 0.9rem;
    }
    
    .card-actions {
      padding: 15px 25px 25px;
      text-align: center;
    }
    
    .book-button {
      width: 100%;
      padding: 10px;
      font-weight: 500;
      border-radius: 30px;
      transition: all 0.3s ease;
    }
    
    .book-button mat-icon {
      margin-right: 8px;
    }
    
    .book-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 10px rgba(33, 150, 243, 0.3);
    }
    
    @media (max-width: 768px) {
      .doctor-cards {
        grid-template-columns: 1fr;
      }
      
      .main-title {
        font-size: 1.8rem;
      }
      
      .doctor-avatar {
        width: 100px;
        height: 100px;
      }
      
      .avatar-initials {
        font-size: 2.5rem;
      }
    }
  `]
})
export class BookAppointmentComponent implements OnInit {
  loading = false;
  doctors: User[] = [];
  
  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchDoctors();
  }

  fetchDoctors(): void {
    this.loading = true;
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.error('No authentication token found');
      this.snackBar.open('Erreur d\'authentification. Veuillez vous reconnecter.', 'Fermer', { duration: 5000 });
      this.loading = false;
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<User[]>(`${environment.apiUrl}/api/v1/api/users/doctors`, { headers }).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        console.log('Médecins disponibles:', doctors);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des médecins', error);
        this.snackBar.open('Impossible de charger la liste des médecins. Veuillez réessayer plus tard.', 'Fermer', { duration: 5000 });
        this.loading = false;
        
        // Données fictives pour tester l'interface
        this.doctors = [
          { id: 1, nom: 'Smith', prenom: 'John', specialization: 'Dentiste généraliste', email: 'smith@example.com', phoneNumber: '06 12 34 56 78' },
          { id: 2, nom: 'Johnson', prenom: 'Sarah', specialization: 'Orthodontiste', email: 'johnson@example.com', phoneNumber: '06 23 45 67 89' },
          { id: 3, nom: 'Williams', prenom: 'Robert', specialization: 'Chirurgien maxillo-facial', email: 'williams@example.com', phoneNumber: '06 34 56 78 90' },
          { id: 4, nom: 'Brown', prenom: 'Emma', specialization: 'Parodontiste', email: 'brown@example.com', phoneNumber: '06 45 67 89 01' }
        ];
      }
    });
  }

  openAppointmentDialog(doctor: User): void {
    this.dialog.open(AppointmentFormDialogComponent, {
      width: '600px',
      panelClass: 'appointment-dialog-container',
      data: doctor
    });
  }
} 