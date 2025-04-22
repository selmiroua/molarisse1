import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
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
import { ProfileService } from '../profile/profile.service';
import { environment } from '../../environments/environment';

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
    MatDividerModule,
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
  isMenuOpen = true;
  activeSection = 'dashboard';
  unreadNotifications = 0;
  isAssignedToDoctor = true;
  profileImageUrl: string | null = null;
  secretaryName = '';
  isProfileDropdownOpen = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private userService: UserService,
    private secretaryService: SecretaryService,
    private snackBar: MatSnackBar,
    private profileService: ProfileService
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
    this.loadSecretaryProfile();
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

  loadSecretaryProfile() {
    this.profileService.getCurrentProfile().subscribe({
      next: (profile) => {
        console.log('Profile loaded:', profile);
        const capitalizedNom = profile.nom.charAt(0).toUpperCase() + profile.nom.slice(1);
        const capitalizedPrenom = profile.prenom.charAt(0).toUpperCase() + profile.prenom.slice(1);
        this.secretaryName = `${capitalizedNom} ${capitalizedPrenom}`;
        this.profileImageUrl = this.getProfileImageUrl(profile.profilePicturePath);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.setDefaultValues();
      }
    });
  }

  private setDefaultValues(): void {
    this.secretaryName = '';
    this.profileImageUrl = null;
  }

  getProfileImageUrl(profilePicturePath?: string): string {
    if (profilePicturePath) {
      try {
        const timestamp = new Date().getTime();
        return `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
      } catch (error) {
        console.error('Error generating profile picture URL:', error);
        return 'assets/images/default-avatar.png';
      }
    }
    return 'assets/images/default-avatar.png';
  }

  handleImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-avatar.png';
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  showDashboard(): void {
    this.activeSection = 'dashboard';
  }

  showProfile(): void {
    this.activeSection = 'profile';
    this.isProfileDropdownOpen = false;
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

  showSettings(): void {
    this.activeSection = 'settings';
    this.isProfileDropdownOpen = false;
  }

  showNotifications() {
    this.activeSection = 'notifications';
    this.isProfileDropdownOpen = false;
  }

  logout(): void {
    // Clear all storage first
    localStorage.clear();
    sessionStorage.clear();
    
    // Call auth service to notify server (non-blocking)
    this.authService.logout();
    
    // Force a complete page reload and redirect
    window.location.replace('/login');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const profileElement = (event.target as HTMLElement).closest('.user-profile');
    if (!profileElement) {
      this.isProfileDropdownOpen = false;
    }
  }
}
