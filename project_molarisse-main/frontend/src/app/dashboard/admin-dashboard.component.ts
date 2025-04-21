import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../services/auth.service';
import { ProfileComponent } from '../profile/profile.component';
import { DoctorVerificationsAdminComponent } from '../admin/doctor-verifications-admin/doctor-verifications-admin.component';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    ProfileComponent,
    DoctorVerificationsAdminComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  @ViewChild('profileDropdown') profileDropdown!: ElementRef;

  isMenuOpen = true;
  activeSection = 'dashboard';
  searchQuery = '';
  isProfileDropdownOpen = false;
  currentUser: User | null = null;
  notificationCount = 0;
  stats = {
    pendingVerifications: 0,
    totalDoctors: 0,
    totalPatients: 0
  };

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {
    // Load initial user data
    this.loadAdminProfile();
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadNotifications();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.profileDropdown && !this.profileDropdown.nativeElement.contains(event.target)) {
      this.isProfileDropdownOpen = false;
    }
  }

  loadAdminProfile(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Loaded user profile:', user);
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error loading admin profile:', error);
      }
    });
  }

  showDashboard(): void {
    this.activeSection = 'dashboard';
  }

  showDoctorVerifications(): void {
    this.activeSection = 'verifications';
  }

  showProfile(): void {
    this.activeSection = 'profile';
    this.isProfileDropdownOpen = false;
  }

  showSettings(): void {
    this.activeSection = 'settings';
    this.isProfileDropdownOpen = false;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  toggleNotifications(): void {
    // Toggle notifications panel
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    // Implement search functionality
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/default-avatar.png';
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  loadNotifications(): void {
    this.adminService.getNotifications().subscribe({
      next: (notifications) => {
        this.notificationCount = notifications.filter(n => !n.read).length;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Still navigate to login even if server request fails
        this.router.navigate(['/login']);
      }
    });
  }
}
