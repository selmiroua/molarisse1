import { Component, OnInit, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DoctorVerificationService } from '../../core/services/doctor-verification.service';
import { DoctorVerification } from '../../core/models/doctor-verification.model';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-doctor-verifications-admin',
  template: `
    <div class="doctor-verification-requests">
      <h2>Vérifications des Médecins</h2>
      
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Chargement des demandes...</p>
      </div>
      
      <div *ngIf="!loading" class="requests-container">
        <mat-card *ngFor="let request of pendingVerifications" class="request-card">
          <mat-card-header>
            <div class="header-content">
              <mat-card-title>Dr. ID: {{ request.doctorId }}</mat-card-title>
              <mat-card-subtitle>{{ request.email }}</mat-card-subtitle>
              <div class="status-badge" [class.pending]="true">En attente</div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <mat-icon>business</mat-icon>
                <div class="info-content">
                  <label>Cabinet</label>
                  <p>{{ request.cabinetName || 'Non spécifié' }}</p>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>phone</mat-icon>
                <div class="info-content">
                  <label>Téléphone</label>
                  <p>{{ request.phoneNumber || 'Non spécifié' }}</p>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>star</mat-icon>
                <div class="info-content">
                  <label>Années d'expérience</label>
                  <p>{{ request.yearsOfExperience || '0' }} ans</p>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>medical_services</mat-icon>
                <div class="info-content">
                  <label>Spécialité(s)</label>
                  <p>{{ request.specialties?.join(', ') || 'Non spécifié' }}</p>
                </div>
              </div>
              <div class="info-item">
                <mat-icon>calendar_today</mat-icon>
                <div class="info-content">
                  <label>Date de demande</label>
                  <p>{{ request.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
              </div>
              <div class="info-item" *ngIf="request.message">
                <mat-icon>message</mat-icon>
                <div class="info-content">
                  <label>Message</label>
                  <p>{{ request.message }}</p>
                </div>
              </div>
              <div class="info-item" *ngIf="request.cabinetPhotoPath">
                <mat-icon>business</mat-icon>
                <div class="info-content">
                  <label>Photo du cabinet</label>
                  <a (click)="viewDocument(request.cabinetPhotoPath)" class="doc-link">
                    <mat-icon>visibility</mat-icon>
                    Consulter la photo
                  </a>
                </div>
              </div>
              <div class="info-item" *ngIf="request.diplomaPhotoPath">
                <mat-icon>description</mat-icon>
                <div class="info-content">
                  <label>Diplôme</label>
                  <a (click)="viewDocument(request.diplomaPhotoPath)" class="doc-link">
                    <mat-icon>visibility</mat-icon>
                    Consulter le diplôme
                  </a>
                </div>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="approveVerification(request)" class="action-button">
              <mat-icon>check_circle</mat-icon>
              Approuver
            </button>
            <button mat-raised-button color="accent" (click)="directApproveVerification(request)" class="action-button" matTooltip="Méthode alternative">
              <mat-icon>security</mat-icon>
              Approuver (Alt)
            </button>
            <button mat-raised-button color="warn" (click)="rejectVerification(request)" class="action-button">
              <mat-icon>cancel</mat-icon>
              Rejeter
            </button>
          </mat-card-actions>
        </mat-card>

        <div *ngIf="pendingVerifications.length === 0" class="no-requests">
          <mat-icon>info</mat-icon>
          <p>Aucune demande en attente</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .doctor-verification-requests {
      padding: 1.5rem;
    }

    h2 {
      color: #2c3e50;
      margin-bottom: 2rem;
      font-size: 1.8rem;
      font-weight: 500;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      
      p {
        margin-top: 1rem;
        color: #546e7a;
      }
    }

    .requests-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .request-card {
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
      }

      .header-content {
        position: relative;
        padding: 1.5rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-bottom: 1px solid #dee2e6;
      }

      mat-card-title {
        font-size: 1.3rem;
        color: #2c3e50;
        margin-bottom: 0.5rem;
      }

      mat-card-subtitle {
        color: #546e7a;
        font-size: 1rem;
      }

      .status-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;

        &.pending {
          background-color: #fff3cd;
          color: #856404;
        }
      }
    }

    .info-grid {
      display: grid;
      gap: 1.2rem;
      padding: 1.5rem;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;

      mat-icon {
        color: #00acc1;
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
        margin-top: 0.2rem;
      }

      .info-content {
        flex: 1;

        label {
          display: block;
          font-size: 0.85rem;
          color: #6c757d;
          margin-bottom: 0.3rem;
        }

        p {
          margin: 0;
          color: #2c3e50;
          font-size: 1rem;
        }
      }
    }

    .doc-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #00acc1;
      text-decoration: none;
      cursor: pointer;
      padding: 0.3rem 0;

      &:hover {
        color: #007c91;
      }

      mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
        color: inherit;
      }
    }

    mat-card-actions {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
    }

    .action-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      font-weight: 500;

      mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
      }
    }

    .no-requests {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      background: #f8f9fa;
      border-radius: 12px;
      color: #546e7a;

      mat-icon {
        font-size: 3.5rem;
        width: 3.5rem;
        height: 3.5rem;
        margin-bottom: 1.5rem;
        color: #00acc1;
      }

      p {
        font-size: 1.2rem;
        margin: 0;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule
  ]
})
export class DoctorVerificationsAdminComponent implements OnInit {
  @Input() limit?: number;
  pendingVerifications: DoctorVerification[] = [];
  loading = true;

  constructor(
    private verificationService: DoctorVerificationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadPendingVerifications();
  }

  loadPendingVerifications(): void {
    this.loading = true;
    let url = `${environment.apiUrl}/admin/verifications`;
    if (this.limit) {
      url += `?limit=${this.limit}`;
    }
    
    this.http.get<DoctorVerification[]>(url).subscribe({
      next: (verifications) => {
        this.pendingVerifications = verifications;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pending verifications:', error);
        this.snackBar.open('Erreur lors du chargement des vérifications en attente', 'Fermer', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  viewDocument(filePath: string): void {
    const docUrl = `${environment.apiUrl}/api/users/documents/${filePath}`;
    window.open(docUrl, '_blank');
  }

  approveVerification(verification: DoctorVerification): void {
    if (!verification.id) {
      this.snackBar.open('ID de vérification manquant', 'Fermer', { duration: 3000 });
      return;
    }

    this.snackBar.open('Approbation en cours...', '', { duration: 2000 });
    console.log(`Approving verification ID: ${verification.id}`);
    
    this.verificationService.updateVerificationStatus(verification.id, 'approved')
      .subscribe({
        next: (response) => {
          console.log('Approval successful:', response);
          this.snackBar.open('Vérification approuvée avec succès', 'Fermer', {
            duration: 3000
          });
          this.loadPendingVerifications();
        },
        error: (error) => {
          console.error('Error approving verification:', error);
          let errorMsg = 'Erreur lors de l\'approbation de la vérification';
          
          if (error.status === 403) {
            errorMsg = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
          } else if (error.error && error.error.message) {
            errorMsg = `Erreur: ${error.error.message}`;
          }
          
          this.snackBar.open(errorMsg, 'Fermer', {
            duration: 5000
          });
        }
      });
  }

  rejectVerification(verification: DoctorVerification): void {
    if (!verification.id) {
      this.snackBar.open('ID de vérification manquant', 'Fermer', { duration: 3000 });
      return;
    }

    const reason = prompt('Veuillez entrer la raison du rejet:');
    if (reason !== null) {
      this.snackBar.open('Rejet en cours...', '', { duration: 2000 });
      console.log(`Rejecting verification ID: ${verification.id} with reason: ${reason}`);

      this.verificationService.updateVerificationStatus(verification.id, 'rejected', reason)
        .subscribe({
          next: (response) => {
            console.log('Rejection successful:', response);
            this.snackBar.open('Vérification rejetée avec succès', 'Fermer', {
              duration: 3000
            });
            this.loadPendingVerifications();
          },
          error: (error) => {
            console.error('Error rejecting verification:', error);
            let errorMsg = 'Erreur lors du rejet de la vérification';
            
            if (error.status === 403) {
              errorMsg = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
            } else if (error.error && error.error.message) {
              errorMsg = `Erreur: ${error.error.message}`;
            }
            
            this.snackBar.open(errorMsg, 'Fermer', {
              duration: 5000
            });
          }
        });
    }
  }

  // Add a method that attempts to use a different API path for approval
  directApproveVerification(verification: DoctorVerification): void {
    if (!verification.id) {
      this.snackBar.open('ID de vérification manquant', 'Fermer', { duration: 3000 });
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
    if (!token) {
      this.snackBar.open('Non authentifié', 'Fermer', { duration: 3000 });
      return;
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    const statusRequest = {
      status: 'APPROVED',
      message: null
    };

    this.snackBar.open('Tentative d\'approbation avec méthode alternative...', '', { duration: 2000 });
    console.log(`Trying alternative methods to approve verification ${verification.id}`);
    
    // Define several possible API endpoints to try
    const possibleEndpoints = [
      `${environment.apiUrl}/api/v1/doctor-verifications/${verification.id}/status`,
      `${environment.apiUrl}/api/v1/admin/doctor-verifications/${verification.id}/status`,
      `${environment.apiUrl}/api/doctor-verifications/${verification.id}/status`,
      `${environment.apiUrl}/api/v1/users/doctor-verifications/${verification.id}/status`,
      `${environment.apiUrl}/api/v1/doctor-verifications/status/${verification.id}`
    ];
    
    console.log('Will try these endpoints:', possibleEndpoints);
    
    // Try the first endpoint
    this.tryApprovalEndpoint(possibleEndpoints, 0, statusRequest, headers, verification.id);
  }
  
  // Helper method to try approval endpoints sequentially
  private tryApprovalEndpoint(endpoints: string[], index: number, data: any, headers: HttpHeaders, verificationId: number): void {
    if (index >= endpoints.length) {
      this.snackBar.open('Toutes les tentatives ont échoué', 'Fermer', { duration: 3000 });
      return;
    }
    
    const currentEndpoint = endpoints[index];
    console.log(`Trying endpoint (${index + 1}/${endpoints.length}): ${currentEndpoint}`);
    
    this.http.put(currentEndpoint, data, { headers }).subscribe({
      next: (response) => {
        console.log(`Endpoint ${index + 1} successful:`, response);
        this.snackBar.open('Vérification approuvée avec succès', 'Fermer', { duration: 3000 });
        this.loadPendingVerifications();
      },
      error: (error) => {
        console.error(`Endpoint ${index + 1} failed:`, error);
        // Try the next endpoint
        this.tryApprovalEndpoint(endpoints, index + 1, data, headers, verificationId);
      }
    });
  }
} 