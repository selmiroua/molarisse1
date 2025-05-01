import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AppointmentService, Appointment, AppointmentStatus } from '../../core/services/appointment.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppointmentDetailDialogComponent } from './appointment-detail-dialog.component';

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule,
    HttpClientModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    AppointmentDetailDialogComponent
  ],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <mat-card>
          <div class="header-content">
            <div class="title">
              <h1>Calendrier des rendez-vous</h1>
              <p>Visualisez et gérez votre emploi du temps</p>
            </div>
            <div class="view-controls">
              <mat-tab-group (selectedTabChange)="changeView($event)">
                <mat-tab label="Jour">
                  <ng-template matTabContent></ng-template>
                </mat-tab>
                <mat-tab label="Semaine">
                  <ng-template matTabContent></ng-template>
                </mat-tab>
                <mat-tab label="Mois">
                  <ng-template matTabContent></ng-template>
                </mat-tab>
              </mat-tab-group>
            </div>
          </div>
          
          <div class="navigation-controls">
            <button mat-icon-button (click)="previousPeriod()">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <h2>{{ currentPeriodLabel }}</h2>
            <button mat-icon-button (click)="nextPeriod()">
              <mat-icon>chevron_right</mat-icon>
            </button>
            <button mat-button color="primary" (click)="today()">
              <mat-icon>today</mat-icon> Aujourd'hui
            </button>
          </div>
        </mat-card>
      </div>
      
      <div class="calendar-body">
        <mat-card class="calendar-card">
          <div class="calendar-grid">
            <div class="time-column">
              <div class="time-slot" *ngFor="let time of timeSlots">{{ time }}</div>
            </div>
            <div class="day-column" *ngFor="let day of visibleDays">
              <div class="day-header">
                <div class="day-name">{{ day.dayName }}</div>
                <div class="day-date">{{ day.date }}</div>
              </div>
              <div class="day-content">
                <div class="time-slot" *ngFor="let time of timeSlots">
                  <!-- Espace pour les rendez-vous -->
                </div>
                <div 
                  *ngFor="let appt of getAppointmentsForDay(day.fullDate)" 
                  class="appointment-card"
                  [class.status-pending]="appt.status === 'PENDING'"
                  [class.status-accepted]="appt.status === 'ACCEPTED'"
                  [class.status-completed]="appt.status === 'COMPLETED'"
                  [class.status-canceled]="appt.status === 'CANCELED'"
                  [style.top.px]="calculateAppointmentPosition(appt)"
                  [style.height.px]="calculateAppointmentHeight(appt)"
                  (click)="openAppointmentDetails(appt)"
                >
                  <div class="appointment-time">
                    {{ formatTime(appt.appointmentDateTime) }}
                  </div>
                  <div class="appointment-title">
                    {{ appt.patient?.nom }} {{ appt.patient?.prenom }}
                  </div>
                  <div class="appointment-type">
                    {{ appt.appointmentType }} ({{ appt.caseType }})
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .calendar-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin: 20px;
    }
    
    .calendar-header {
      margin-bottom: 20px;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
    }
    
    .title h1 {
      margin-bottom: 5px;
      color: #1976d2;
      font-size: 24px;
    }
    
    .title p {
      margin: 0;
      color: #757575;
    }
    
    .navigation-controls {
      display: flex;
      align-items: center;
      padding: 10px 20px;
      border-top: 1px solid #e0e0e0;
      margin-top: 15px;
    }
    
    .navigation-controls h2 {
      margin: 0 15px;
      font-size: 18px;
    }
    
    .calendar-card {
      padding: 0;
      overflow: hidden;
    }
    
    .calendar-grid {
      display: flex;
      height: 600px;
      overflow-y: auto;
    }
    
    .time-column {
      width: 80px;
      border-right: 1px solid #e0e0e0;
      position: relative;
    }
    
    .time-column .time-slot {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #757575;
      font-size: 12px;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .day-column {
      flex: 1;
      border-right: 1px solid #e0e0e0;
      position: relative;
    }
    
    .day-column:last-child {
      border-right: none;
    }
    
    .day-header {
      padding: 10px;
      text-align: center;
      border-bottom: 1px solid #e0e0e0;
      background-color: #f5f5f5;
    }
    
    .day-name {
      font-weight: bold;
      font-size: 14px;
    }
    
    .day-date {
      font-size: 12px;
      color: #757575;
    }
    
    .day-content {
      position: relative;
      height: calc(100% - 61px);
    }
    
    .day-content .time-slot {
      height: 60px;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .appointment-card {
      position: absolute;
      left: 2px;
      right: 2px;
      padding: 5px;
      border-radius: 4px;
      background-color: #bbdefb;
      border-left: 4px solid #1976d2;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
      z-index: 1;
    }
    
    .appointment-card:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    .appointment-time {
      font-weight: bold;
      margin-bottom: 3px;
    }
    
    .appointment-title {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .appointment-type {
      font-size: 11px;
      color: #616161;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .status-pending {
      background-color: #fff8e1;
      border-left-color: #ffc107;
    }
    
    .status-accepted {
      background-color: #e1f5fe;
      border-left-color: #03a9f4;
    }
    
    .status-completed {
      background-color: #e8f5e9;
      border-left-color: #4caf50;
    }
    
    .status-canceled {
      background-color: #ffebee;
      border-left-color: #f44336;
      text-decoration: line-through;
    }
    
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .calendar-grid {
        overflow-x: auto;
      }
    }
  `]
})
export class AppointmentCalendarComponent implements OnInit {
  @Input() userRole: 'patient' | 'doctor' | 'secretaire' = 'doctor'; // Default to doctor
  appointments: Appointment[] = [];
  currentView = 'week'; // 'day', 'week', 'month'
  currentDate = new Date();
  currentPeriodLabel = '';
  visibleDays: { dayName: string; date: string; fullDate: Date }[] = [];
  timeSlots: string[] = [];
  isLoading = false;
  statusForm: FormGroup;
  
  constructor(
    private appointmentService: AppointmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.statusForm = this.fb.group({
      status: ['']
    });
    this.generateTimeSlots();
  }

  ngOnInit(): void {
    this.loadAppointments();
    this.updateVisibleDays();
    this.updatePeriodLabel();
  }
  
  loadAppointments(): void {
    this.isLoading = true;
    console.log(`Chargement des rendez-vous pour le rôle: ${this.userRole}`);
    
    // Use the appropriate endpoint based on user role
    let appointmentObservable;
    
    switch(this.userRole) {
      case 'secretaire':
        console.log('Utilisation de l\'endpoint secrétaire');
        appointmentObservable = this.appointmentService.getMySecretaryAppointments();
        break;
      case 'patient':
        console.log('Utilisation de l\'endpoint patient');
        appointmentObservable = this.appointmentService.getMyAppointments();
        break;
      case 'doctor':
      default:
        console.log('Utilisation de l\'endpoint médecin');
        appointmentObservable = this.appointmentService.getMyDoctorAppointments();
        break;
    }
    
    appointmentObservable.subscribe({
      next: (data) => {
        console.log('Rendez-vous reçus du backend (déjà normalisés):', data);
        this.appointments = data;
        console.log('Nombre de rendez-vous chargés:', this.appointments.length);
        this.isLoading = false;
        
        // Pour chaque rendez-vous, afficher la date parsée pour débogage
        if (this.appointments.length > 0) {
          this.appointments.forEach(appt => {
            const date = new Date(appt.appointmentDateTime);
            console.log(`Rendez-vous ID ${appt.id}: Date = ${date.toLocaleString()}`);
          });
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rendez-vous:', error);
        this.snackBar.open('Impossible de charger les rendez-vous. Veuillez réessayer plus tard.', 'Fermer', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }
  
  // Méthode pour normaliser les rendez-vous de la réponse API au format attendu par le composant
  normalizeAppointments(appointments: any[]): Appointment[] {
    // Cette méthode n'est plus nécessaire car la normalisation est faite dans le service
    return appointments;
  }
  
  changeView(event: any): void {
    const views = ['day', 'week', 'month'];
    this.currentView = views[event.index];
    this.updateVisibleDays();
    this.updatePeriodLabel();
  }
  
  previousPeriod(): void {
    switch (this.currentView) {
      case 'day':
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        break;
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        break;
    }
    this.updateVisibleDays();
    this.updatePeriodLabel();
  }
  
  nextPeriod(): void {
    switch (this.currentView) {
      case 'day':
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        break;
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        break;
    }
    this.updateVisibleDays();
    this.updatePeriodLabel();
  }
  
  today(): void {
    this.currentDate = new Date();
    this.updateVisibleDays();
    this.updatePeriodLabel();
  }
  
  updateVisibleDays(): void {
    this.visibleDays = [];
    
    // Cloner la date actuelle pour ne pas la modifier
    const date = new Date(this.currentDate);
    
    if (this.currentView === 'day') {
      this.addDay(date);
    } else if (this.currentView === 'week') {
      // Aller au début de la semaine (lundi)
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // ajustement pour dimanche
      date.setDate(diff);
      
      // Ajouter les 7 jours de la semaine
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(date);
        currentDate.setDate(date.getDate() + i);
        this.addDay(currentDate);
      }
    } else if (this.currentView === 'month') {
      // Logique pour l'affichage du mois
      // (Simplifié pour l'exemple, montrant la première semaine du mois)
      date.setDate(1); // Premier jour du mois
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(date);
        currentDate.setDate(date.getDate() + i);
        this.addDay(currentDate);
      }
    }
  }
  
  addDay(date: Date): void {
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[date.getDay()];
    const dateStr = date.getDate().toString().padStart(2, '0') + '/' + (date.getMonth() + 1).toString().padStart(2, '0');
    
    this.visibleDays.push({
      dayName: dayName,
      date: dateStr,
      fullDate: new Date(date)
    });
  }
  
  updatePeriodLabel(): void {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    if (this.currentView === 'day') {
      this.currentPeriodLabel = `${this.currentDate.getDate()} ${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    } else if (this.currentView === 'week') {
      const startDate = this.visibleDays[0]?.fullDate;
      const endDate = this.visibleDays[this.visibleDays.length - 1]?.fullDate;
      
      if (startDate && endDate) {
        this.currentPeriodLabel = `${startDate.getDate()} - ${endDate.getDate()} ${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
      }
    } else if (this.currentView === 'month') {
      this.currentPeriodLabel = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }
  }
  
  generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = 8; hour < 19; hour++) {
      this.timeSlots.push(`${hour}:00`);
      this.timeSlots.push(`${hour}:30`);
    }
  }
  
  getAppointmentsForDay(date: Date): Appointment[] {
    if (!this.appointments || this.appointments.length === 0) {
      return [];
    }
    
    // Créer une chaîne de date au format 'YYYY-MM-DD' pour faciliter la comparaison
    const targetDateStr = date.getFullYear() + '-' + 
                        (date.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                        date.getDate().toString().padStart(2, '0');
    
    console.log(`Recherche des rendez-vous pour la date: ${targetDateStr}`);
    
    // Filtrer les rendez-vous par date
    const filteredAppointments = this.appointments.filter(appt => {
      if (!appt.appointmentDateTime) {
        return false;
      }
      
      try {
        // Convertir la date du rendez-vous et la transformer en chaîne YYYY-MM-DD
        const apptDate = new Date(appt.appointmentDateTime);
        const apptDateStr = apptDate.getFullYear() + '-' + 
                            (apptDate.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                            apptDate.getDate().toString().padStart(2, '0');
        
        console.log(`Comparaison - RDV ${appt.id} - Date rendez-vous: ${apptDateStr}, Date cible: ${targetDateStr}`);
        
        // Comparer les chaînes de date sans l'heure
        const match = apptDateStr === targetDateStr;
        
        if (match) {
          console.log(`✅ Match trouvé pour le rendez-vous ${appt.id} à la date ${apptDateStr}`);
        }
        
        return match;
      } catch (error) {
        console.error(`❌ Erreur lors de la comparaison de la date pour le rendez-vous ${appt.id}:`, error);
        return false;
      }
    });
    
    console.log(`Nombre de rendez-vous trouvés pour ${targetDateStr}: ${filteredAppointments.length}`);
    return filteredAppointments;
  }
  
  calculateAppointmentPosition(appt: Appointment): number {
    try {
      const date = new Date(appt.appointmentDateTime);
      
      if (isNaN(date.getTime())) {
        console.error('Date invalide pour le positionnement du rendez-vous:', appt.appointmentDateTime);
        return 0;
      }
      
      // Get hours and minutes in local time
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      console.log(`Position du rendez-vous ${appt.id}: ${hours}h${minutes} -> y=${(hours - 8) * 60 + (minutes / 60) * 60}px`);
      
      // Calculate position based on local time
      return (hours - 8) * 60 + (minutes / 60) * 60;
    } catch (error) {
      console.error('Erreur lors du calcul de la position du rendez-vous:', error);
      return 0;
    }
  }
  
  calculateAppointmentHeight(appt: Appointment): number {
    // Chaque rendez-vous dure 30 minutes par défaut
    // On pourrait ajuster cette logique si la durée est connue
    return 30;
  }
  
  formatTime(dateTime: string): string {
    try {
      // If the date is in ISO format (from the backend)
      const date = new Date(dateTime);
      if (!isNaN(date.getTime())) {
        // Format the time in local timezone
        return date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      // Fallback for invalid dates
      console.error('Date invalide pour le formatage:', dateTime);
      return '--:--';
    } catch (error) {
      console.error('Erreur lors du formatage de l\'heure:', error);
      return '--:--';
    }
  }
  
  openAppointmentDetails(appointment: Appointment): void {
    const dialogRef = this.dialog.open(AppointmentDetailDialogComponent, {
      width: '500px',
      data: appointment
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Mettre à jour la liste des rendez-vous si le statut a été modifié
        const index = this.appointments.findIndex(a => a.id === result.id);
        if (index !== -1) {
          this.appointments[index] = result;
        }
      }
    });
  }
  
  addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }
} 