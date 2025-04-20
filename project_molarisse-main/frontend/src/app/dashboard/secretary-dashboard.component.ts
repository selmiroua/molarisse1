import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SecretaryAppointmentListComponent } from './appointment/secretary-appointment-list.component';
import { AuthService } from '../auth/auth.service';
import { ProfileComponent } from '../profile/profile.component';
import { DoctorApplicationComponent } from '../secretary/doctor-application/doctor-application.component';
import { UserService } from '../core/services/user.service';
import { VerifiedDoctorsComponent } from '../secretary/verified-doctors/verified-doctors.component';
import { NotificationBellComponent } from './shared/notification-bell/notification-bell.component';

@Component({
  selector: 'app-secretary-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatSnackBarModule,
    SecretaryAppointmentListComponent,
    ProfileComponent,
    DoctorApplicationComponent,
    VerifiedDoctorsComponent,
    NotificationBellComponent
  ],
  templateUrl: './secretary-dashboard.component.html',
  styleUrls: ['./secretary-dashboard.component.scss']
})
export class SecretaryDashboardComponent implements OnInit {
  isMenuOpen = true;
  activeSection = 'dashboard';
  isBaseRoute = true;
  isAssignedToDoctor = false;
  userProfileImage: string | null = null;
  userName: string = 'Secretary';
  isProfileDropdownOpen: boolean = false;
  
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isBaseRoute = event.url === '/dashboard/secretary';
    });
  }
  
  ngOnInit(): void {
    this.checkDoctorAssignment();
  }
  
  checkDoctorAssignment(): void {
    this.userService.getAssignedDoctor().subscribe({
      next: (doctor) => {
        this.isAssignedToDoctor = !!doctor;
        if (this.isAssignedToDoctor) {
          this.userName = `Secretary of Dr. ${doctor.nom} ${doctor.prenom}`;
        }
      },
      error: (error) => {
        console.error('Error checking doctor assignment:', error);
        this.isAssignedToDoctor = false;
      }
    });
  }
  
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  showDashboard() {
    this.activeSection = 'dashboard';
  }
  
  showVerifiedDoctors() {
    this.activeSection = 'verified-doctors';
  }
  
  showAppointments() {
    if (!this.isAssignedToDoctor) {
      this.snackBar.open('You need to be assigned to a doctor first', 'Close', {
        duration: 3000
      });
      return;
    }
    this.activeSection = 'appointments';
  }
  
  showDoctorAssignment() {
    if (this.isAssignedToDoctor) {
      this.snackBar.open('You are already assigned to a doctor', 'Close', {
        duration: 3000
      });
      return;
    }
    this.activeSection = 'doctor-assignment';
  }
  
  showProfile() {
    this.activeSection = 'profile';
  }
  
  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }
  
  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const profileElement = (event.target as HTMLElement).closest('.user-profile');
    if (!profileElement) {
      this.isProfileDropdownOpen = false;
    }
  }
} 