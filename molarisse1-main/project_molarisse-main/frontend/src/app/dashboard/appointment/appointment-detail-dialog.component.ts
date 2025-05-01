import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppointmentService, Appointment, AppointmentStatus, AppointmentType, CaseType } from '../../core/services/appointment.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';


@Component({
  selector: 'app-appointment-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    HttpClientModule
  ],
  template: `
    <div class="appointment-detail-dialog">
      <h2 mat-dialog-title>
        <div class="dialog-header">
          <div class="appointment-icon">
            <mat-icon [ngClass]="{
              'pending-icon': appointment.status === 'PENDING',
              'accepted-icon': appointment.status === 'ACCEPTED',
              'completed-icon': appointment.status === 'COMPLETED',
              'canceled-icon': appointment.status === 'CANCELED'
            }">event</mat-icon>
          </div>
          <div class="title-content">
            <span class="dialog-title">Détails du rendez-vous</span>
            <span class="appointment-status">{{ getStatusLabel(appointment.status) }}</span>
          </div>
        </div>
        <button mat-icon-button class="close-button" (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </h2>

      <mat-dialog-content>
        <div *ngIf="isLoading" class="loading-spinner">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
        
        <div *ngIf="!isLoading">
          <div class="patient-info">
            <h3>
              <mat-icon>person</mat-icon>
              Informations du patient
            </h3>
            <div class="info-row">
              <span class="label">Nom:</span>
              <span class="value">{{ appointment.patient?.prenom }} {{ appointment.patient?.nom }}</span>
            </div>
            
          </div>
          
          <div class="appointment-info">
            <h3>
              <mat-icon>event_note</mat-icon>
              Informations du rendez-vous
            </h3>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">{{ formatDate(appointment.appointmentDateTime) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Heure:</span>
              <span class="value">{{ formatTime(appointment.appointmentDateTime) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Type:</span>
              <span class="value">{{ getAppointmentTypeLabel(appointment.appointmentType) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Cas:</span>
              <span class="value" [ngClass]="{
                'urgent-case': appointment.caseType === 'URGENT',
                'control-case': appointment.caseType === 'CONTROL',
                'normal-case': appointment.caseType === 'NORMAL'
              }">{{ getCaseTypeLabel(appointment.caseType) }}</span>
            </div>
            <div class="info-row" *ngIf="appointment.notes">
              <span class="label">Notes:</span>
              <span class="value notes">{{ appointment.notes }}</span>
            </div>
          </div>
          
          <form [formGroup]="statusForm" (ngSubmit)="updateStatus()" *ngIf="canUpdateStatus()">
            <h3>
              <mat-icon>update</mat-icon>
              Mettre à jour le statut
            </h3>
            <div class="form-content">
              <mat-form-field appearance="outline" class="status-field">
                <mat-label>Nouveau statut</mat-label>
                <mat-select formControlName="status">
                  <mat-option *ngFor="let status of availableStatuses" [value]="status.value">
                    {{ status.label }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              
              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                [disabled]="statusForm.invalid || statusForm.pristine || updating"
              >
                <mat-icon>save</mat-icon>
                {{ updating ? 'Mise à jour...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <div class="action-buttons">
          <button 
            mat-button 
            [mat-dialog-close]="false" 
            class="cancel-button"
          >
            Fermer
          </button>
          <button 
            mat-raised-button 
            color="warn" 
            *ngIf="canCancel()"
            [disabled]="updating"
            (click)="cancelAppointment()"
          >
            <mat-icon>cancel</mat-icon>
            Annuler le rendez-vous
          </button>
        </div>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .appointment-detail-dialog {
      max-width: 600px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
    }
    
    .appointment-icon {
      margin-right: 16px;
      background-color: #f5f5f5;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .appointment-icon .mat-icon {
      font-size: 24px;
    }
    
    .pending-icon {
      color: #ff9800;
    }
    
    .accepted-icon {
      color: #2196f3;
    }
    
    .completed-icon {
      color: #4caf50;
    }
    
    .canceled-icon {
      color: #f44336;
    }
    
    .title-content {
      display: flex;
      flex-direction: column;
    }
    
    .dialog-title {
      font-size: 20px;
      font-weight: 500;
    }
    
    .appointment-status {
      font-size: 14px;
      color: #757575;
    }
    
    .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
    }
    
    mat-dialog-content {
      margin-top: 20px;
      min-height: 300px;
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }
    
    h3 {
      display: flex;
      align-items: center;
      color: #2196f3;
      margin-top: 24px;
      margin-bottom: 16px;
      font-size: 16px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
    }
    
    h3 mat-icon {
      margin-right: 8px;
    }
    
    .patient-info, .appointment-info {
      margin-bottom: 24px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 12px;
    }
    
    .label {
      width: 100px;
      color: #757575;
      font-weight: 500;
    }
    
    .value {
      flex: 1;
    }
    
    .notes {
      white-space: pre-line;
    }
    
    .urgent-case {
      color: #f44336;
      font-weight: 500;
    }
    
    .control-case {
      color: #2196f3;
      font-weight: 500;
    }
    
    .normal-case {
      color: #4caf50;
      font-weight: 500;
    }
    
    .form-content {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    
    .status-field {
      flex: 1;
    }
    
    .action-buttons {
      display: flex;
      gap: 12px;
    }
    
    .view-fiche-btn {
      margin-top: 16px;
      width: 100%;
    }
    
    .view-fiche-btn .mat-icon {
      margin-right: 8px;
    }
  `]
})
export class AppointmentDetailDialogComponent {
  statusForm: FormGroup;
  isLoading = false;
  updating = false;
  
  availableStatuses = [
    { value: AppointmentStatus.ACCEPTED, label: 'Accepté' },
    { value: AppointmentStatus.COMPLETED, label: 'Terminé' },
    { value: AppointmentStatus.CANCELED, label: 'Annulé' }
  ];
  
  constructor(
    public dialogRef: MatDialogRef<AppointmentDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public appointment: Appointment,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    console.log('Appointment data received:', appointment);
    console.log('Patient data:', appointment.patient);
    this.statusForm = this.fb.group({
      status: [this.appointment.status, Validators.required]
    });
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'En attente';
      case AppointmentStatus.ACCEPTED:
        return 'Accepté';
      case AppointmentStatus.COMPLETED:
        return 'Terminé';
      case AppointmentStatus.CANCELED:
        return 'Annulé';
      case AppointmentStatus.REJECTED:
        return 'Rejeté';
      default:
        return status;
    }
  }
  
  getAppointmentTypeLabel(type: string): string {
    switch (type) {
      case AppointmentType.DETARTRAGE:
        return 'Détartrage';
      case AppointmentType.EXTRACTION:
        return 'Extraction';
      case AppointmentType.SOIN:
        return 'Soin';
      case AppointmentType.BLANCHIMENT:
        return 'Blanchiment';
      case AppointmentType.ORTHODONTIE:
        return 'Orthodontie';
      default:
        return type;
    }
  }
  
  getCaseTypeLabel(type: string): string {
    switch (type) {
      case CaseType.URGENT:
        return 'Urgent';
      case CaseType.CONTROL:
        return 'Contrôle';
      case CaseType.NORMAL:
        return 'Normal';
      default:
        return type;
    }
  }
  
  formatDate(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  formatTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  canUpdateStatus(): boolean {
    return this.appointment.status === AppointmentStatus.PENDING || 
           this.appointment.status === AppointmentStatus.ACCEPTED;
  }
  
  canCancel(): boolean {
    return this.appointment.status === AppointmentStatus.PENDING || 
           this.appointment.status === AppointmentStatus.ACCEPTED;
  }
  
  updateStatus(): void {
    if (this.statusForm.invalid) return;
    
    this.updating = true;
    const newStatus = this.statusForm.value.status;
    
    this.appointmentService.updateMyAppointmentStatus(this.appointment.id, newStatus).subscribe({
      next: (updatedAppointment) => {
        this.appointment = updatedAppointment;
        this.updating = false;
        this.snackBar.open('Statut mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(updatedAppointment);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        this.updating = false;
        this.snackBar.open('Erreur lors de la mise à jour du statut', 'Fermer', { duration: 5000 });
      }
    });
  }
  
  cancelAppointment(): void {
    this.updating = true;
    
    this.appointmentService.updateMyAppointmentStatus(this.appointment.id, AppointmentStatus.CANCELED).subscribe({
      next: (updatedAppointment) => {
        this.appointment = updatedAppointment;
        this.updating = false;
        this.snackBar.open('Rendez-vous annulé avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(updatedAppointment);
      },
      error: (error) => {
        console.error('Erreur lors de l\'annulation du rendez-vous:', error);
        this.updating = false;
        this.snackBar.open('Erreur lors de l\'annulation du rendez-vous', 'Fermer', { duration: 5000 });
      }
    });
  }

  
} 