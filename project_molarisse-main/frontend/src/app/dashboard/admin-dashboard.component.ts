import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';
import { ProfileComponent } from '../profile/profile.component';
import { DoctorVerificationsAdminComponent } from '../admin/doctor-verifications-admin/doctor-verifications-admin.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    ProfileComponent,
    DoctorVerificationsAdminComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  isMenuOpen = false;
  activeSection = 'dashboard'; // Default to dashboard view

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  showDashboard() {
    this.activeSection = 'dashboard';
  }

  showProfile() {
    this.activeSection = 'profile';
  }

  showDoctorVerifications() {
    this.activeSection = 'doctorVerifications';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
