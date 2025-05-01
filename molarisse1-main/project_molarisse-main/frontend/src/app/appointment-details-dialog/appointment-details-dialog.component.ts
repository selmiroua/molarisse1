import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Appointment, AppointmentService, AppointmentStatus } from '../core/services/appointment.service';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfileService } from '../profile/profile.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-appointment-details-dialog',
  template: `
    <div class="appointment-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>event</mat-icon> Appointment Details
      </h2>
      
      <mat-divider></mat-divider>
      
      <mat-dialog-content class="dialog-content">
        <div class="patient-profile-section">
          <div class="profile-picture" [matTooltip]="data.patient.prenom + ' ' + data.patient.nom">
            <div *ngIf="!profileImageUrl" class="profile-initial">
              {{ data.patient.prenom[0] }}{{ data.patient.nom[0] }}
            </div>
            <img *ngIf="profileImageUrl" [src]="profileImageUrl" alt="Patient Profile">
          </div>
          <div class="patient-info">
            <h3>{{ data.patient.prenom }} {{ data.patient.nom }}</h3>
            <p *ngIf="data.patient.email">{{ data.patient.email }}</p>
            <p *ngIf="data.patient.phoneNumber">{{ data.patient.phoneNumber }}</p>
          </div>
        </div>

        <mat-divider class="section-divider"></mat-divider>
        
        <div class="info-section">
          <div class="info-row">
            <div class="info-label"><mat-icon>today</mat-icon> Date & Time:</div>
            <div class="info-value">{{ formatDate(data.appointmentDateTime) }}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label"><mat-icon>flag</mat-icon> Status:</div>
            <div class="info-value status-section">
              <mat-chip [ngClass]="getStatusClass(data.status)">{{ data.status }}</mat-chip>
              
              <button 
                mat-icon-button 
                color="primary" 
                *ngIf="!changingStatus" 
                (click)="toggleStatusChange()"
                matTooltip="Change status"
              >
                <mat-icon>edit</mat-icon>
              </button>
            </div>
          </div>
          
          <div class="info-row status-change-section" *ngIf="changingStatus">
            <div class="status-change-container">
              <mat-form-field appearance="outline">
                <mat-label>Change Status</mat-label>
                <mat-select [(ngModel)]="selectedStatus">
                  <mat-option *ngFor="let status of availableStatuses" [value]="status">
                    {{ status }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              
              <div class="status-actions">
                <button mat-button color="warn" (click)="toggleStatusChange()">Cancel</button>
                <button 
                  mat-raised-button 
                  color="primary" 
                  (click)="updateStatus()" 
                  [disabled]="updating"
                >
                  <mat-spinner *ngIf="updating" diameter="20" class="status-spinner"></mat-spinner>
                  <span *ngIf="!updating">Update</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-label"><mat-icon>medical_services</mat-icon> Type:</div>
            <div class="info-value">{{ data.appointmentType }}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label"><mat-icon>priority_high</mat-icon> Case:</div>
            <div class="info-value">{{ data.caseType }}</div>
          </div>
          
          <mat-divider class="section-divider"></mat-divider>
          
          <div class="notes-section">
            <div class="notes-header">
              <mat-icon>notes</mat-icon> Notes:
            </div>
            <div class="notes-content">
              {{ data.notes || 'No notes available' }}
            </div>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-raised-button color="primary" mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .appointment-dialog {
      padding: 0;
      max-width: 550px;
    }
    
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2196F3;
      margin-bottom: 0;
      padding: 16px 24px;
      font-size: 22px;
    }
    
    .dialog-content {
      padding: 24px;
      margin: 0;
    }
    
    .patient-profile-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .profile-picture {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      background-color: #2196F3;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 5px rgba(0,0,0,0.2);
    }
    
    .profile-initial {
      color: white;
      font-size: 28px;
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .profile-picture img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .patient-info {
      display: flex;
      flex-direction: column;
    }
    
    .patient-info h3 {
      margin: 0;
      color: #2196F3;
      font-size: 18px;
    }
    
    .patient-info p {
      margin: 2px 0;
      color: #757575;
      font-size: 14px;
    }
    
    .info-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .info-row {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    
    .info-label {
      min-width: 140px;
      font-weight: 500;
      color: #546E7A;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .info-value {
      flex: 1;
    }
    
    .status-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-change-section {
      padding-left: 140px;
      margin-top: -8px;
    }
    
    .status-change-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background-color: #F5F5F5;
      padding: 12px;
      border-radius: 4px;
      width: 100%;
    }
    
    .status-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    
    .status-spinner {
      margin: 0 8px;
    }
    
    .section-divider {
      margin: 16px 0;
    }
    
    .notes-section {
      margin-top: 8px;
    }
    
    .notes-header {
      font-weight: 500;
      color: #546E7A;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .notes-content {
      background-color: #F5F5F5;
      padding: 12px;
      border-radius: 4px;
      min-height: 60px;
    }
    
    mat-dialog-actions {
      padding: 12px 24px 24px;
      margin: 0;
    }
    
    mat-form-field {
      width: 100%;
    }
    
    .ACCEPTED {
      background-color: #4CAF50 !important;
      color: white;
    }
    
    .PENDING {
      background-color: #FFC107 !important;
      color: #333;
    }
    
    .REJECTED {
      background-color: #F44336 !important;
      color: white;
    }
    
    .COMPLETED {
      background-color: #3F51B5 !important;
      color: white;
    }
    
    .CANCELED {
      background-color: #9E9E9E !important;
      color: white;
    }
  `],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    CommonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatSelectModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule
  ],
  providers: [DatePipe, ProfileService, AuthService]
})
export class AppointmentDetailsDialogComponent {
  profileImageUrl: string | null = null;
  changingStatus = false;
  updating = false;
  selectedStatus: string = '';
  availableStatuses = Object.values(AppointmentStatus);
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Appointment,
    private dialogRef: MatDialogRef<AppointmentDetailsDialogComponent>,
    private datePipe: DatePipe,
    private appointmentService: AppointmentService,
    private snackBar: MatSnackBar,
    private profileService: ProfileService,
    private authService: AuthService
  ) {
    this.selectedStatus = this.data.status;
    // Use initials display by default - don't try to load profile images
    // This is intentional based on the observed 404 errors
    this.useGeneratedAvatar();
  }
  
  formatDate(dateArray: any): string {
    if (Array.isArray(dateArray) && dateArray.length >= 5) {
      const [year, month, day, hour, minute] = dateArray;
      const date = new Date(year, month - 1, day, hour, minute);
      return this.datePipe.transform(date, 'EEEE, MMMM d, y • h:mm a') || 'Invalid Date';
    }
    return this.datePipe.transform(dateArray, 'EEEE, MMMM d, y • h:mm a') || 'Invalid Date';
  }
  
  getStatusClass(status: string): string {
    return status;
  }
  
  toggleStatusChange(): void {
    this.changingStatus = !this.changingStatus;
    if (this.changingStatus) {
      this.selectedStatus = this.data.status;
    }
  }
  
  updateStatus(): void {
    if (this.selectedStatus === this.data.status) {
      this.changingStatus = false;
      return;
    }
    
    this.updating = true;
    const userRole = this.authService.getUserRole();
    
    if (userRole === 'doctor') {
      this.updateStatusAsDoctor();
    } else if (userRole === 'secretaire') {
      this.updateStatusAsSecretary();
    } else {
      this.updating = false;
      this.snackBar.open('You do not have permission to update appointment status', 'Close', {
        duration: 3000
      });
    }
  }
  
  private updateStatusAsDoctor(): void {
    this.appointmentService.updateMyAppointmentStatus(
      this.data.id, 
      this.selectedStatus as AppointmentStatus
    ).subscribe({
      next: (updatedAppointment) => {
        this.updating = false;
        this.changingStatus = false;
        this.data.status = updatedAppointment.status;
        this.snackBar.open('Appointment status updated successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        this.updating = false;
        console.error('Error updating appointment status', error);
        this.snackBar.open('Failed to update appointment status', 'Close', {
          duration: 3000
        });
      }
    });
  }
  
  private updateStatusAsSecretary(): void {
    // Get the current user profile to obtain the secretary ID
    this.profileService.getCurrentProfile().subscribe({
      next: (profile) => {
        console.log('Current user profile:', profile);
        if (profile && profile.id) {
          console.log('Using secretary ID:', profile.id);
          
          this.appointmentService.updateAppointmentStatus(
            this.data.id, 
            this.selectedStatus as AppointmentStatus
          ).subscribe({
            next: (updatedAppointment) => {
              this.updating = false;
              this.changingStatus = false;
              this.data.status = updatedAppointment.status;
              this.snackBar.open('Appointment status updated successfully', 'Close', {
                duration: 3000
              });
            },
            error: (error) => {
              this.updating = false;
              console.error('Error updating appointment status', error);
              this.snackBar.open('Failed to update appointment status. You may not have permission.', 'Close', {
                duration: 3000
              });
            }
          });
        } else {
          this.updating = false;
          console.error('Could not determine secretary ID from profile', profile);
          this.snackBar.open('Could not determine your user ID. Please try again later.', 'Close', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        this.updating = false;
        console.error('Error getting user profile', error);
        this.snackBar.open('Failed to get your user profile. Please try again later.', 'Close', {
          duration: 3000
        });
      }
    });
  }
  
  tryLoadProfileImage(): void {
    // Check if we have a patient ID
    if (this.data.patient && this.data.patient.id) {
      const backendUrl = 'http://localhost:8080';
      const userId = this.data.patient.id;
      
      // Try different URL patterns to find the correct endpoint
      // The controller mapping suggests profile/picture/{fileName} where fileName is the parameter
      const possibleUrls = [
        // Option 1: Using a dedicated endpoint for user profile pictures by ID
        `${backendUrl}/api/v1/api/users/${userId}/profile-picture`,
        
        // Option 2: The user ID as the filename
        `${backendUrl}/api/v1/api/users/profile/picture/${userId}`,
        
        // Option 3: Simple name pattern (userId.jpg)
        `${backendUrl}/api/v1/api/users/profile/picture/${userId}.jpg`,
        
        // Option 4: The most likely pattern based on your controller
        `${backendUrl}/api/v1/api/users/profile/picture/user_${userId}`,
        
        // Option 5: Direct access to static resources
        `${backendUrl}/static/profile-pictures/${userId}.jpg`,
        
        // Option 6: Alternative context path
        `${backendUrl}/api/users/profile/picture/${userId}`
      ];
      
      console.log("Attempting to load patient profile picture...");
      this.testProfilePictureUrls(possibleUrls, 0);
    } else {
      console.warn("Patient data is incomplete, using generated avatar");
      this.useGeneratedAvatar();
    }
  }

  testProfilePictureUrls(urls: string[], index: number): void {
    if (index >= urls.length) {
      console.warn("All profile picture URLs failed, using generated avatar");
      this.useGeneratedAvatar();
      return;
    }
    
    const url = urls[index];
    console.log(`Testing URL ${index + 1}/${urls.length}: ${url}`);
    
    // Use fetch instead of Image for better error reporting
    fetch(url, { 
      method: 'GET',
      mode: 'cors',
      credentials: 'include', // Include credentials if authentication is needed
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, URL: ${url}`);
      }
      return response.blob();
    })
    .then(blob => {
      // Successfully loaded the image
      const objectUrl = URL.createObjectURL(blob);
      console.log(`✅ Success! Profile picture loaded from: ${url}`);
      this.profileImageUrl = objectUrl;
    })
    .catch(error => {
      console.log(`❌ Failed: ${error.message}`);
      // Try the next URL
      this.testProfilePictureUrls(urls, index + 1);
    });
  }

  useGeneratedAvatar(): void {
    // Use UI Avatars service to generate an avatar based on the patient's name
    if (this.data.patient && this.data.patient.prenom && this.data.patient.nom) {
      const firstName = encodeURIComponent(this.data.patient.prenom);
      const lastName = encodeURIComponent(this.data.patient.nom);
      this.profileImageUrl = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=2196F3&color=fff&size=128`;
    } else {
      // If patient name not available, use default
      this.profileImageUrl = `https://ui-avatars.com/api/?name=P&background=2196F3&color=fff&size=128`;
    }
  }
}
