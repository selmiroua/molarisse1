import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { AppointmentService, Appointment, AppointmentStatus } from '../../core/services/appointment.service';
import { DatePipe } from '@angular/common';

interface Secretary {
  id: number;
  nom: string;
  prenom: string;
}

interface Doctor {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  phoneNumber: string;
}

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  phoneNumber: string;
}

@Component({
  selector: 'app-secretary-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatMenuModule,
    MatCardModule,
    MatProgressSpinnerModule,
    HttpClientModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Manage Appointments</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="loading-container" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <div *ngIf="!loading && appointments.length === 0" class="no-data">
            <p>No appointments found.</p>
          </div>
          
          <div *ngIf="!loading && appointments.length > 0" class="table-container">
            <table mat-table [dataSource]="appointments" class="mat-elevation-z2">
              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date & Time</th>
                <td mat-cell *matCellDef="let appointment">
                  {{ appointment.appointmentDateTime | date:'medium' }}
                </td>
              </ng-container>
              
              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let appointment">
                  <span [ngClass]="'status-' + appointment.status.toLowerCase()">
                    {{ appointment.status }}
                  </span>
                </td>
              </ng-container>
              
              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let appointment">
                  {{ appointment.appointmentType }}
                </td>
              </ng-container>
              
              <!-- Case Column -->
              <ng-container matColumnDef="case">
                <th mat-header-cell *matHeaderCellDef>Case</th>
                <td mat-cell *matCellDef="let appointment">
                  {{ appointment.caseType }}
                </td>
              </ng-container>
              
              <!-- Patient Column -->
              <ng-container matColumnDef="patient">
                <th mat-header-cell *matHeaderCellDef>Patient</th>
                <td mat-cell *matCellDef="let appointment">
                  {{ appointment.patient?.prenom }} {{ appointment.patient?.nom }}
                </td>
              </ng-container>

              <!-- Doctor Column -->
              <ng-container matColumnDef="doctor">
                <th mat-header-cell *matHeaderCellDef>Doctor</th>
                <td mat-cell *matCellDef="let appointment">
                  Dr. {{ appointment.doctor?.prenom }} {{ appointment.doctor?.nom }}
                </td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let appointment">
                  <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item (click)="updateStatus(appointment.id, AppointmentStatus.ACCEPTED)">
                      <mat-icon>check_circle</mat-icon>
                      <span>Accept</span>
                    </button>
                    <button mat-menu-item (click)="updateStatus(appointment.id, AppointmentStatus.REJECTED)">
                      <mat-icon>cancel</mat-icon>
                      <span>Reject</span>
                    </button>
                    <button mat-menu-item (click)="updateStatus(appointment.id, AppointmentStatus.COMPLETED)">
                      <mat-icon>done_all</mat-icon>
                      <span>Mark as Completed</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 30px;
    }
    
    .no-data {
      text-align: center;
      padding: 30px;
      color: #666;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    table {
      width: 100%;
    }
    
    .mat-column-actions {
      width: 80px;
      text-align: center;
    }
    
    .status-pending {
      color: #ff9800;
      font-weight: 500;
    }
    
    .status-accepted {
      color: #4caf50;
      font-weight: 500;
    }
    
    .status-rejected {
      color: #f44336;
      font-weight: 500;
    }
    
    .status-completed {
      color: #2196f3;
      font-weight: 500;
    }
  `],
  providers: [DatePipe]
})
export class SecretaryAppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  displayedColumns: string[] = ['date', 'status', 'type', 'case', 'patient', 'doctor', 'actions'];
  loading = true;
  AppointmentStatus = AppointmentStatus; // Make enum available in template

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadAppointments();
  }
  
  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getMySecretaryAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.snackBar.open(error.message || 'Failed to load appointments', 'Close', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }
  
  updateStatus(appointmentId: number, status: AppointmentStatus): void {
    this.appointmentService.updateAppointmentStatus(appointmentId, status).subscribe({
      next: (updatedAppointment) => {
        const index = this.appointments.findIndex(a => a.id === appointmentId);
        if (index !== -1) {
          this.appointments[index] = updatedAppointment;
        }
        this.snackBar.open('Appointment status updated successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error updating appointment status:', error);
        this.snackBar.open(error.message || 'Failed to update appointment status', 'Close', {
          duration: 3000
        });
      }
    });
  }
} 