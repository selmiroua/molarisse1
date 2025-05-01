import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../../core/models/user.model';
import { DoctorApplication } from '../../core/models/doctor-application.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface SecretaryProfileData {
  application: DoctorApplication;
  secretary: User;
  secretaryName: string;
  secretaryEmail: string;
  secretaryPhone: string;
  hasCV: boolean;
  statusLabel: string;
  statusColor: string;
  statusIcon: string;
  applicationDate: string;
  cvFilePath: string;
}

@Component({
  selector: 'app-secretary-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './secretary-profile-dialog.component.html',
  styleUrl: './secretary-profile-dialog.component.scss'
})
export class SecretaryProfileDialogComponent {
  pdfSrc: SafeResourceUrl | null = null;
  isLoading = false;
  cvUrl: SafeResourceUrl | null = null;

  constructor(
    public dialogRef: MatDialogRef<SecretaryProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SecretaryProfileData,
    private sanitizer: DomSanitizer
  ) {
    this.loadCV();
  }

  loadCV(): void {
    if (this.data.cvFilePath) {
      const cvUrl = `/api/v1/users/cv/${this.data.cvFilePath}`;
      this.cvUrl = this.sanitizer.bypassSecurityTrustResourceUrl(cvUrl);
    }
  }

  viewCV(): void {
    if (this.data.hasCV && this.data.application.cvFilePath) {
      const cvUrl = `/api/v1/users/cv/${this.data.application.cvFilePath}`;
      window.open(cvUrl, '_blank');
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  approve(): void {
    this.dialogRef.close({ action: 'approve', secretaryId: this.data.secretary.id });
  }

  reject(): void {
    this.dialogRef.close({ action: 'reject', secretaryId: this.data.secretary.id });
  }
}
