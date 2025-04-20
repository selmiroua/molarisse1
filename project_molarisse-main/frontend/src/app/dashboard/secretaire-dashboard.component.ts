import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentListComponent } from './appointment/appointment-list.component';
import { AppointmentCalendarComponent } from './appointment/appointment-calendar.component';
import { ProfileComponent } from '../profile/profile.component';
import { ValidateAccountComponent } from '../validate-account/validate-account.component';
import { NotificationBellComponent } from './shared/notification-bell/notification-bell.component';
import { DoctorApplicationComponent } from '../secretary/doctor-application/doctor-application.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserService } from '../core/services/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SecretaryService } from '../core/services/secretary.service';
import { RouterModule } from '@angular/router';
import { SecretaryAppointmentListComponent } from './appointment/secretary-appointment-list.component';
import { VerifiedDoctorsComponent } from '../secretary/verified-doctors/verified-doctors.component';

@Component({
  selector: 'app-secretaire-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTooltipModule,
    AppointmentListComponent,
    AppointmentCalendarComponent,
    SecretaryAppointmentListComponent,
    ProfileComponent,
    DoctorApplicationComponent,
    VerifiedDoctorsComponent,
    NotificationBellComponent,
    ValidateAccountComponent
  ],
  templateUrl: './secretaire-dashboard.component.html',
  styleUrls: ['./secretaire-dashboard.component.scss']
})
export class SecretaireDashboardComponent implements OnInit {
  isMenuOpen = false;
  activeSection = 'dashboard';
  unreadNotifications = 0;
  isAssignedToDoctor = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private userService: UserService,
    private secretaryService: SecretaryService,
    private snackBar: MatSnackBar
  ) {
    // No need to check assignment status since we're showing all items
  }

  ngOnInit(): void {
    // Vérifier s'il y a une section active dans l'URL
    const path = this.router.url.split('/').pop();
    if (path) {
      switch (path) {
        case 'profile':
          this.activeSection = 'profile';
          break;
        case 'validate':
          this.activeSection = 'validate';
          break;
        case 'appointments':
          this.activeSection = 'appointments';
          break;
        case 'calendar':
          this.activeSection = 'calendar';
          break;
        case 'doctor-application':
          this.activeSection = 'doctor-application';
          break;
        default:
          this.activeSection = 'dashboard';
      }
    }

    // Charger les notifications
    this.loadNotifications();
  }

  // Simplified method - we still call the API for data but don't restrict UI
  checkDoctorAssignment(): void {
    console.log('Starting doctor assignment check...');
    
    this.secretaryService.getSecretaryStatus().subscribe({
      next: (response) => {
        console.log('Secretary status response:', response);
        // We get the status but don't use it to restrict the UI
      },
      error: (error) => {
        console.error('Error checking secretary status:', error);
      }
    });
  }

  loadNotifications(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadNotifications = count;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications', error);
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

  showValidateAccount(): void {
    this.activeSection = 'validate';
  }

  showAppointments(): void {
    this.activeSection = 'appointments';
  }

  showCalendar(): void {
    this.activeSection = 'calendar';
  }

  showDoctorApplication(): void {
    this.activeSection = 'doctor-application';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
