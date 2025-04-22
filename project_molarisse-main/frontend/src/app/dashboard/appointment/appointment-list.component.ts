import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AppointmentService, Appointment, AppointmentStatus } from '../../core/services/appointment.service';
import { Observable } from 'rxjs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AppointmentDetailsDialogComponent } from '../../appointment-details-dialog/appointment-details-dialog.component';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ProfileService } from '../../profile/profile.service';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="appointment-container">
      <div class="header">
        <h2>{{ title }}</h2>
        <button *ngIf="userRole === 'patient'" mat-raised-button color="primary" (click)="navigateToBooking()">
          Nouveau Rendez-vous
        </button>
      </div>

      <div *ngIf="loading" class="loading">
        Chargement des rendez-vous...
      </div>

      <div *ngIf="!loading && appointments.length === 0" class="no-data">
        Aucun rendez-vous trouvé.
      </div>

      <table *ngIf="!loading && appointments.length > 0" mat-table [dataSource]="appointments" class="appointment-table">
        <!-- Date Column -->
        <ng-container matColumnDef="appointmentDateTime">
          <th mat-header-cell *matHeaderCellDef>Date & Heure</th>
          <td mat-cell *matCellDef="let appointment">
            {{ getDateDisplay(appointment.appointmentDateTime) }}
          </td>
        </ng-container>

        <!-- Status Column -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Statut</th>
          <td mat-cell *matCellDef="let appointment">
            <span class="status-badge" [ngClass]="getStatusClass(appointment.status)">
              {{ getStatusLabel(appointment.status) }}
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
          <th mat-header-cell *matHeaderCellDef>Cas</th>
          <td mat-cell *matCellDef="let appointment">
            {{ appointment.caseType }}
          </td>
        </ng-container>

        <!-- Doctor/Patient Column -->
        <ng-container matColumnDef="person">
          <th mat-header-cell *matHeaderCellDef>{{ userRole === 'patient' ? 'Médecin' : 'Patient' }}</th>
          <td mat-cell *matCellDef="let appointment">
            <ng-container *ngIf="userRole === 'patient' && appointment.doctor">
              Dr. {{ appointment.doctor.prenom }} {{ appointment.doctor.nom }}
            </ng-container>
            <ng-container *ngIf="userRole !== 'patient' && appointment.patient">
              {{ appointment.patient.prenom }} {{ appointment.patient.nom }}
            </ng-container>
          </td>
        </ng-container>

        <!-- Notes Column -->
        <ng-container matColumnDef="notes">
          <th mat-header-cell *matHeaderCellDef>Notes</th>
          <td mat-cell *matCellDef="let appointment">
            {{ appointment.notes }}
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
              <button mat-menu-item (click)="viewDetails(appointment)">
                <mat-icon>visibility</mat-icon>
                <span>Voir les détails</span>
              </button>
              
              <!-- Status update options for doctor/secretary -->
              <ng-container *ngIf="userRole === 'doctor' || userRole === 'secretaire'">
                <button mat-menu-item 
                        *ngIf="appointment.status === 'PENDING'"
                        (click)="updateStatus(appointment, AppointmentStatus.ACCEPTED)">
                  <mat-icon>check_circle</mat-icon>
                  <span>Accepter</span>
                </button>
                
                <button mat-menu-item 
                        *ngIf="appointment.status === 'PENDING'"
                        (click)="updateStatus(appointment, AppointmentStatus.REJECTED)">
                  <mat-icon>cancel</mat-icon>
                  <span>Refuser</span>
                </button>
                
                <button mat-menu-item 
                        *ngIf="appointment.status === 'ACCEPTED'"
                        (click)="updateStatus(appointment, AppointmentStatus.COMPLETED)">
                  <mat-icon>task_alt</mat-icon>
                  <span>Marquer comme terminé</span>
                </button>
              </ng-container>
              
              <!-- Cancel option for patients -->
              <button mat-menu-item 
                      *ngIf="userRole === 'patient' && (appointment.status === 'PENDING' || appointment.status === 'ACCEPTED')"
                      (click)="cancelAppointment(appointment)">
                <mat-icon>event_busy</mat-icon>
                <span>Annuler le rendez-vous</span>
              </button>
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .appointment-container {
      margin: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .appointment-table {
      width: 100%;
    }
    
    .loading, .no-data {
      padding: 20px;
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.3px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      transition: all 0.2s ease;
    }
    
    .pending {
      background-color: #FFF8E1;
      color: #FFA000;
      border: 1px solid rgba(255, 160, 0, 0.2);
    }
    
    .accepted {
      background-color: #E8F5E9;
      color: #2E7D32;
      border: 1px solid rgba(46, 125, 50, 0.2);
    }
    
    .rejected {
      background-color: #FFEBEE;
      color: #C62828;
      border: 1px solid rgba(198, 40, 40, 0.2);
    }
    
    .completed {
      background-color: #E3F2FD;
      color: #1565C0;
      border: 1px solid rgba(21, 101, 192, 0.2);
    }
    
    .canceled {
      background-color: #FAFAFA;
      color: #616161;
      border: 1px solid rgba(97, 97, 97, 0.2);
    }

    .status-badge::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
    }

    .pending::before {
      background-color: #FFA000;
    }

    .accepted::before {
      background-color: #2E7D32;
    }

    .rejected::before {
      background-color: #C62828;
    }

    .completed::before {
      background-color: #1565C0;
    }

    .canceled::before {
      background-color: #616161;
    }
  `],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [DatePipe]
})
export class AppointmentListComponent implements OnInit {
  @Input() userRole!: 'patient' | 'doctor' | 'secretaire';
  @Input() limit?: number; // Limite optionnelle pour le nombre de rendez-vous à afficher
  appointments: Appointment[] = [];
  loading = true;
  displayedColumns: string[] = ['appointmentDateTime', 'status', 'type', 'case', 'person', 'notes', 'actions'];
  title = 'Appointments';
  AppointmentStatus = AppointmentStatus;

  constructor(
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    
    // Set title based on user role
    if (this.userRole === 'patient') {
      this.title = 'Mes rendez-vous';
    } else if (this.userRole === 'doctor') {
      this.title = 'Rendez-vous médecin';
    } else if (this.userRole === 'secretaire') {
      this.title = 'Gestion des rendez-vous';
    }
  }

  loadAppointments(): void {
    this.loading = true;
    
    // Debug logging
    console.log('Loading appointments for role:', this.userRole);
    console.log('JWT token available:', !!localStorage.getItem('access_token'));
    console.log('JWT token:', localStorage.getItem('access_token'));
    
    if (this.userRole === 'patient') {
      this.appointmentService.getMyAppointments().subscribe({
        next: (data) => {
          this.appointments = this.limitAppointments(data);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading appointments', error);
          this.loading = false;
        }
      });
    } else if (this.userRole === 'doctor') {
      console.log('Making request to:', `${this.appointmentService['apiUrl']}/my-doctor-appointments`);
      this.appointmentService.getMyDoctorAppointments().subscribe({
        next: (data) => {
          this.appointments = this.limitAppointments(data);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading appointments', error);
          this.loading = false;
        }
      });
    } else if (this.userRole === 'secretaire') {
      this.appointmentService.getMySecretaryAppointments().subscribe({
        next: (data) => {
          this.appointments = this.limitAppointments(data);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading appointments', error);
          this.loading = false;
        }
      });
    }
  }
  
  // Méthode pour limiter le nombre de rendez-vous si une limite est définie
  private limitAppointments(data: Appointment[]): Appointment[] {
    if (this.limit && data.length > this.limit) {
      return data.slice(0, this.limit);
    }
    return data;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Date non spécifiée';
    
    try {
      // Essayer de créer une date à partir de la chaîne
      const date = new Date(dateStr);
      
      // Vérifier si la date est valide
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
      
      // Si le format est "DD/MM/YYYY HH:MM" directement
      if (typeof dateStr === 'string' && dateStr.match(/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/)) {
        return dateStr; // Retourner tel quel si déjà formaté
      }
      
      // Retourner la chaîne originale si ce n'est pas un format reconnu
      return dateStr;
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Invalid Date';
    }
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Accepté';
      case 'REJECTED':
        return 'Refusé';
      case 'COMPLETED':
        return 'Terminé';
      case 'CANCELED':
        return 'Annulé';
      default:
        return status;
    }
  }

  navigateToBooking(): void {
    this.router.navigate(['/dashboard/patient/book-appointment']);
  }

  viewDetails(appointment: Appointment): void {
    this.dialog.open(AppointmentDetailsDialogComponent, {
      data: appointment
    });
  }

  updateStatus(appointment: Appointment, status: AppointmentStatus): void {
    if (this.userRole === 'doctor') {
      this.appointmentService.updateMyAppointmentStatus(appointment.id, status).subscribe({
        next: () => {
          this.snackBar.open(`Appointment status updated to ${status}`, 'Close', { duration: 3000 });
          this.loadAppointments(); // Reload the list
        },
        error: (error) => {
          console.error('Error updating appointment status', error);
          this.snackBar.open('Failed to update appointment status', 'Close', { duration: 3000 });
        }
      });
    } else if (this.userRole === 'secretaire') {
      // Get the current user profile to obtain the secretary ID
      this.profileService.getCurrentProfile().subscribe({
        next: (profile) => {
          console.log('Current user profile:', profile);
          if (profile && profile.id) {
            console.log('Using secretary ID:', profile.id);
            
            this.appointmentService.updateAppointmentStatus(
              appointment.id, 
              status
            ).subscribe({
              next: () => {
                this.snackBar.open(`Appointment status updated to ${status}`, 'Close', { duration: 3000 });
                this.loadAppointments(); // Reload the list
              },
              error: (error) => {
                console.error('Error updating appointment status', error);
                this.snackBar.open('Failed to update appointment status. You may not have permission.', 'Close', { duration: 3000 });
              }
            });
          } else {
            console.error('Could not determine secretary ID from profile', profile);
            this.snackBar.open('Could not determine your user ID. Please try again later.', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error getting user profile', error);
          this.snackBar.open('Failed to get your user profile. Please try again later.', 'Close', { duration: 3000 });
        }
      });
    }
  }

  cancelAppointment(appointment: Appointment): void {
    // This would be implemented with a confirmation dialog
    this.snackBar.open('Appointment cancellation not implemented yet', 'Close', { duration: 3000 });
  }

  getDateDisplay(dateStr: any): string {
    // Appeler la méthode formatDate pour obtenir le texte formaté
    const formattedDate = this.formatDate(dateStr);
    
    // Si le résultat est "Invalid Date" (soit en tant que chaîne, soit comme résultat de formatage)
    if (formattedDate === 'Invalid Date' || dateStr === 'Invalid Date') {
      return 'Date non disponible';
    }
    
    return formattedDate;
  }
} 