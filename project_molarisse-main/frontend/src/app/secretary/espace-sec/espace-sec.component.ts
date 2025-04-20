import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { VerifiedDoctorsComponent } from '../verified-doctors/verified-doctors.component';

@Component({
  selector: 'app-espace-sec',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    VerifiedDoctorsComponent
  ],
  template: `
    <div class="espace-sec-container">
      <header class="page-header">
        <h1>Espace Secrétaire</h1>
        <p>Liste des médecins vérifiés</p>
      </header>
      
      <main class="main-content">
        <app-verified-doctors></app-verified-doctors>
      </main>
    </div>
  `,
  styles: [`
    .espace-sec-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 30px;
      text-align: center;
    }

    .page-header h1 {
      color: #333;
      font-size: 2rem;
      margin: 0 0 10px;
    }

    .page-header p {
      color: #666;
      font-size: 1.1rem;
      margin: 0;
    }

    .main-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class EspaceSecComponent {} 