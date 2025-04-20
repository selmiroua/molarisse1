import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProfileWrapperComponent } from '../profile-wrapper/profile-wrapper.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { AppointmentListComponent } from '../appointment-list/appointment-list.component';
import { ProfileComponent } from "../profile/profile.component";
import { ValidateAccountComponent } from "../validate-account/validate-account.component";
import { BookAppointmentComponent } from './appointment/book-appointment.component';

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
    ProfileWrapperComponent, 
    NotificationBellComponent, 
    AppointmentListComponent, 
    ProfileComponent, 
    ValidateAccountComponent, 
    BookAppointmentComponent
  ]
})
export class PatientDashboardComponent implements OnInit {

  isBaseRoute: boolean = true;
  isMenuOpen: boolean = false;
  activeSection: string = 'dashboard';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isBaseRoute = event.url === '/dashboard/patient';
    });
  }

  ngOnInit(): void {
    this.isBaseRoute = this.router.url === '/dashboard/patient';
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
}
