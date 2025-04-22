import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NotificationBellComponent } from './shared/notification-bell/notification-bell.component';
import { AppointmentListComponent } from './appointment/appointment-list.component';
import { AuthService } from '../core/services/auth.service';
import { ProfileComponent } from '../profile/profile.component';
import { ValidateAccountComponent } from '../validate-account/validate-account.component';
import { AppointmentCalendarComponent } from './appointment/appointment-calendar.component';
import { SecretaryApplicationsComponent } from '../doctor/secretary-applications/secretary-applications.component';
import { DoctorVerificationComponent } from '../doctor/doctor-verification/doctor-verification.component';
import { UserService } from '../core/services/user.service';
import { DoctorVerificationService } from '../core/services/doctor-verification.service';
import { jwtDecode } from 'jwt-decode';
import { NotificationService } from '../core/services/notification.service';
import { SecretaryRequestsComponent } from '../doctor/secretary-requests/secretary-requests.component';
import { AppointmentService } from '../core/services/appointment.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DoctorVerification } from '../core/models/doctor-verification.model';
import { ProfileService } from '../profile/profile.service';
import { environment } from '../../environments/environment';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

interface User {
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

interface AppointmentStats {
  today: number;
  pending: number;
  total: number;
}

interface DecodedToken {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  profilePicturePath?: string;
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    NotificationBellComponent,
    AppointmentListComponent,
    ProfileComponent,
    ValidateAccountComponent,
    AppointmentCalendarComponent,
    SecretaryApplicationsComponent,
    DoctorVerificationComponent,
    SecretaryRequestsComponent
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.scss']
})
export class DoctorDashboardComponent implements OnInit {
  isMenuOpen = true;
  activeSection = 'dashboard';
  isBaseRoute = true;
  hasAssignedSecretary = false;
  isVerified = false;
  userProfileImage: string | null = null;
  userName: string = '';
  isProfileDropdownOpen: boolean = false;
  doctorName: string = '';
  doctorRole: string = '';
  profilePicture: string | null = null;
  todayAppointments: number = 0;
  pendingAppointments: number = 0;
  totalAppointments: number = 0;
  isFullscreen: boolean = false;
  environment = environment;

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private doctorVerificationService: DoctorVerificationService,
    private notificationService: NotificationService,
    private appointmentService: AppointmentService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isBaseRoute = event.url === '/dashboard/doctor';
    });
  }

  ngOnInit(): void {
    this.loadDoctorProfile();
    this.checkDoctorVerification();
    this.loadAppointmentStats();
  }

  checkDoctorVerification() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('No token found in localStorage');
      this.isVerified = false;
      return;
    }

    try {
      const decodedToken = jwtDecode(token) as any;
      console.log('Decoded token:', decodedToken);
      
      const userId = decodedToken.id || decodedToken.userId || decodedToken.user_id;
      console.log('Token decoded, userId:', userId);
      
      if (!userId) {
        console.log('No user ID found in token. Token payload:', decodedToken);
        this.isVerified = false;
        return;
      }

      this.doctorVerificationService.getApprovedVerifications().subscribe({
        next: (approvedDoctors) => {
          console.log('Approved doctors:', approvedDoctors);
          const userIdNum = Number(userId);
          const isApproved = approvedDoctors.some(doc => doc.doctorId === userIdNum);
          console.log('Doctor approval status for ID', userIdNum, ':', isApproved);
          this.isVerified = isApproved;
          
          if (isApproved) {
            this.checkSecretaryAssignment();
          } else {
            this.hasAssignedSecretary = false;
            if (this.activeSection !== 'home' && this.activeSection !== 'profile' && this.activeSection !== 'verification') {
              this.router.navigate(['/dashboard/doctor']);
            }
          }
        },
        error: (error) => {
          console.error('Error checking verification:', error);
          this.isVerified = false;
        }
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      this.isVerified = false;
    }
  }

  checkSecretaryAssignment(): void {
    if (!this.isVerified) {
      this.hasAssignedSecretary = false;
      return;
    }

    this.userService.getAssignedSecretaries().subscribe({
      next: (secretaries) => {
        this.hasAssignedSecretary = secretaries && secretaries.length > 0;
        console.log('Has assigned secretary:', this.hasAssignedSecretary);
        
        if (this.hasAssignedSecretary && this.activeSection === 'secretary-applications') {
          this.showDashboard();
        }
      },
      error: (error) => {
        console.error('Error checking secretary assignment:', error);
        this.hasAssignedSecretary = false;
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  showDashboard() {
    this.activeSection = 'dashboard';
  }

  showProfile() {
    this.activeSection = 'profile';
  }

  showValidateAccount() {
    this.activeSection = 'validate';
  }

  showAppointments() {
    this.activeSection = 'appointments';
  }

  showCalendar() {
    this.activeSection = 'calendar';
  }

  showSecretaryApplications() {
    this.activeSection = 'secretary-applications';
  }

  showVerification() {
    this.activeSection = 'verification';
  }

  logout() {
    console.log('Logging out...');
    // First clear any component state
    this.activeSection = 'dashboard';
    this.isProfileDropdownOpen = false;
    this.isMenuOpen = true;
    this.isVerified = false;
    this.hasAssignedSecretary = false;
    
    // Call auth service logout
    this.authService.logout();
    
    // Use router for navigation to ensure proper cleanup
    this.router.navigate(['/login']).then(() => {
      // Force page refresh to clear any remaining state
      window.location.reload();
    });
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const profileElement = (event.target as HTMLElement).closest('.user-profile');
    if (!profileElement) {
      this.isProfileDropdownOpen = false;
    }
  }

  private loadDoctorProfile(): void {
    this.profileService.getCurrentProfile().subscribe({
      next: (profile) => {
        console.log('Profile loaded:', profile);
        // Capitalize first letters
        const capitalizedNom = profile.nom.charAt(0).toUpperCase() + profile.nom.slice(1);
        const capitalizedPrenom = profile.prenom.charAt(0).toUpperCase() + profile.prenom.slice(1);
        this.doctorName = `Dr. ${capitalizedNom} ${capitalizedPrenom}`;
        this.doctorRole = 'Médecin';
        this.profilePicture = this.getProfileImageUrl(profile.profilePicturePath);
        
        // Store in localStorage
        localStorage.setItem('user_name', JSON.stringify({
          nom: capitalizedNom,
          prenom: capitalizedPrenom
        }));
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.loadNameFromLocalStorage();
      }
    });
  }

  private loadNameFromLocalStorage(): void {
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      try {
        const { prenom, nom } = JSON.parse(storedName);
        this.doctorName = `Dr. ${nom} ${prenom}`;
      } catch (e) {
        this.setDefaultValues();
      }
    } else {
      this.setDefaultValues();
    }
  }

  private setDefaultValues(): void {
    this.doctorName = '';
    this.doctorRole = 'Médecin';
    this.profilePicture = null;
  }

  private loadAppointmentStats(): void {
    this.appointmentService.getMyDoctorAppointments().subscribe({
      next: (appointments: any[]) => {
        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Count today's appointments (all appointments for today regardless of status)
        this.todayAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDateTime);
          aptDate.setHours(0, 0, 0, 0);
          return aptDate.getTime() === today.getTime();
        }).length;
        
        // Count pending appointments (appointments with PENDING status)
        this.pendingAppointments = appointments.filter(apt => 
          apt.status === 'PENDING'
        ).length;
        
        // Total appointments (all appointments regardless of status)
        this.totalAppointments = appointments.length;
        
        // Log the counts for debugging
        console.log('Appointment Stats:', {
          today: this.todayAppointments,
          pending: this.pendingAppointments,
          total: this.totalAppointments,
          appointments: appointments
        });
      },
      error: (error: Error) => {
        console.error('Error loading appointment stats:', error);
        this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
      }
    });
  }

  getHeaderTitle(): string {
    switch (this.activeSection) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'profile':
        return 'Mon Profile';
      case 'verification':
        return 'Vérification Professionnelle';
      case 'appointments':
        return 'Liste des RDV';
      case 'calendar':
        return 'Calendrier';
      case 'secretary-requests':
        return 'Vérifications des médecins';
      default:
        return 'Tableau de bord';
    }
  }

  showSecretaryRequests(): void {
    this.activeSection = 'secretary-requests';
  }

  showSettings(): void {
    this.activeSection = 'settings';
    this.isProfileDropdownOpen = false;
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        this.isFullscreen = false;
      }
    }
  }

  @HostListener('document:fullscreenchange', [])
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
  }

  getProfileImageUrl(profilePicturePath?: string): string {
    if (profilePicturePath) {
      try {
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `${environment.apiUrl}/api/v1/api/users/profile/picture/${profilePicturePath}?t=${timestamp}`;
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

  get profileImage(): string {
    return this.profilePicture || 'assets/images/default-avatar.png';
  }

  handleImageError(event: any): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-avatar.png';
  }

  showNotifications(): void {
    console.log('Showing notifications...');
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
    if (section === 'dashboard') {
      this.router.navigate(['/dashboard/doctor']);
    } else {
      this.router.navigate([`/dashboard/doctor/${section}`]);
    }
  }
}
