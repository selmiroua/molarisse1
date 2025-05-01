import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { ProfileWrapperComponent } from '../profile-wrapper/profile-wrapper.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { AppointmentListComponent } from '../appointment-list/appointment-list.component';
import { ProfileComponent } from "../profile/profile.component";
import { ValidateAccountComponent } from "../validate-account/validate-account.component";
import { BookAppointmentComponent } from './appointment/book-appointment.component';
import { AppointmentService, Appointment, AppointmentType, CaseType, AppointmentStatus } from '../core/services/appointment.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WelcomeModalComponent } from '../shared/components/welcome-modal/welcome-modal.component';
import { PatientService } from '../core/services/patient.service';


@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatMenuModule, 
    MatIconModule, 
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    ProfileWrapperComponent, 
    NotificationBellComponent, 
    AppointmentListComponent, 
    ProfileComponent, 
    ValidateAccountComponent, 
    BookAppointmentComponent,
    WelcomeModalComponent
    
  ]
})
export class PatientDashboardComponent implements OnInit {
  isBaseRoute: boolean = true;
  isMenuOpen: boolean = false;
  activeSection: string = 'dashboard';
  appointments: Appointment[] = [];
  loading: boolean = false;
  patientName: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private patientService: PatientService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isBaseRoute = event.url === '/dashboard/patient';
    });
  }

  ngOnInit(): void {
    this.isBaseRoute = this.router.url === '/dashboard/patient';
    this.route.queryParams.subscribe(params => {
      if (params['section'] === 'profile') {
        this.activeSection = 'profile';
      }
    });
    this.loadAppointments();
    
    // First get the current user
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.patientName = user.prenom + ' ' + user.nom;
        
        // Then check if they have a fiche
        this.patientService.getCurrentPatientFiche().subscribe({
          next: (fiche) => {
            // If we get a 404 or no fiche exists, show the welcome modal
            if (!fiche || !fiche.id) {
              console.log('No fiche found, showing welcome modal');
              this.dialog.open(WelcomeModalComponent, {
                data: { userName: this.patientName },
                disableClose: true,
                width: '900px',
                maxWidth: '98vw',
              });
            } else {
              console.log('Fiche exists, skipping welcome modal');
            }
          },
          error: (err) => {
            // If we get a 404, show the welcome modal
            if (err.status === 404) {
              console.log('No fiche found (404), showing welcome modal');
              this.dialog.open(WelcomeModalComponent, {
                data: { userName: this.patientName },
                disableClose: true,
                width: '900px',
                maxWidth: '98vw',
              });
            } else {
              console.error('Error checking fiche:', err);
            }
          }
        });
      },
      error: (err) => {
        console.error('Failed to fetch user info', err);
      }
    });
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getPatientAppointments().subscribe({
      next: (appointments: Appointment[]) => {
        this.appointments = appointments;
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Error loading appointments:', error);
        this.loading = false;
      }
    });
  }

  getAppointmentTypeLabel(type: AppointmentType): string {
    switch (type) {
      case AppointmentType.DETARTRAGE:
        return 'Détartrage';
      case AppointmentType.SOIN:
        return 'Soin';
      case AppointmentType.EXTRACTION:
        return 'Extraction';
      case AppointmentType.BLANCHIMENT:
        return 'Blanchiment';
      case AppointmentType.ORTHODONTIE:
        return 'Orthodontie';
      default:
        return type;
    }
  }

  getCaseTypeLabel(type: CaseType): string {
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

  getStatusLabel(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'En attente';
      case AppointmentStatus.ACCEPTED:
        return 'Accepté';
      case AppointmentStatus.REJECTED:
        return 'Refusé';
      case AppointmentStatus.COMPLETED:
        return 'Terminé';
      case AppointmentStatus.CANCELED:
        return 'Annulé';
      default:
        return status;
    }
  }

  getStatusClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'status-pending';
      case AppointmentStatus.ACCEPTED:
        return 'status-accepted';
      case AppointmentStatus.COMPLETED:
        return 'status-completed';
      case AppointmentStatus.REJECTED:
      case AppointmentStatus.CANCELED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'schedule';
      case 'ACCEPTED':
        return 'check_circle';
      case 'REJECTED':
        return 'cancel';
      case 'COMPLETED':
        return 'task_alt';
      case 'CANCELED':
        return 'event_busy';
      default:
        return 'help';
    }
  }

  getCaseTypeIcon(type: string): string {
    switch (type) {
      case 'URGENT':
        return 'priority_high';
      case 'CONTROL':
        return 'event_repeat';
      case 'NORMAL':
        return 'check_circle_outline';
      default:
        return 'info';
    }
  }

  rescheduleAppointment(appointment: Appointment): void {
    const dialogRef = this.dialog.open(BookAppointmentComponent, {
      width: '600px',
      data: {
        isEdit: true,
        appointment: appointment
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAppointments();
        this.snackBar.open('Rendez-vous modifié avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  

  viewAppointmentDetails(appointment: Appointment): void {
    this.dialog.open(BookAppointmentComponent, {
      width: '600px',
      data: {
        isView: true,
        appointment: appointment
      }
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  showDashboard(): void {
    this.activeSection = 'dashboard';
  }

  showProfile(): void {
    this.activeSection = 'profile';
  }

  navigateToBookAppointment(): void {
    this.activeSection = 'book-appointment';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  cancelAppointment(appointment: Appointment): void {
    this.appointmentService.cancelAppointment(appointment.id).subscribe({
      next: () => {
        this.loadAppointments();
        this.snackBar.open('Rendez-vous annulé avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      error: (error: Error) => {
        console.error('Error canceling appointment:', error);
        this.snackBar.open('Erreur lors de l\'annulation du rendez-vous', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }
}
