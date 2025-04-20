import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProfileService } from '../../profile/profile.service';
import { jwtDecode } from 'jwt-decode';

export enum AppointmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

export enum CaseType {
  URGENT = 'URGENT',
  CONTROL = 'CONTROL',
  NORMAL = 'NORMAL'
}

export enum AppointmentType {
  DETARTRAGE = 'DETARTRAGE',
  SOIN = 'SOIN',
  EXTRACTION = 'EXTRACTION',
  BLANCHIMENT = 'BLANCHIMENT',
  ORTHODONTIE = 'ORTHODONTIE'
}

export interface AppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentDateTime: string;
  caseType: CaseType;
  appointmentType: AppointmentType;
  notes?: string;
}

export interface StatusUpdateRequest {
  status: AppointmentStatus;
  secretaryId?: number;
}

export interface Appointment {
  id: number;
  appointmentDateTime: string;
  status: AppointmentStatus;
  caseType: CaseType;
  appointmentType: AppointmentType;
  notes?: string;
  patient?: any;
  doctor?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/appointments`;

  constructor(
    private http: HttpClient,
    private profileService: ProfileService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Book a new appointment
  bookAppointment(request: AppointmentRequest): Observable<Appointment> {
    // Get the current patient's ID from the profile service
    return this.profileService.getCurrentProfile().pipe(
      switchMap(profile => {
        if (!profile || !profile.id) {
          console.error('No profile or profile ID found');
          return throwError(() => new Error('Patient ID not found'));
        }

        console.log('Using patient ID from profile:', profile.id);

        // Override the patientId in the request with the authenticated user's ID
        const authenticatedRequest = {
          ...request,
          patientId: profile.id
        };

        console.log('Booking appointment with authenticated patient ID:', profile.id);
        
        return this.http.post<Appointment>(`${this.apiUrl}/book`, authenticatedRequest)
          .pipe(
            map(appointment => {
              console.log('Raw appointment response:', appointment);
              return this.normalizeAppointment(appointment);
            }),
            catchError(error => {
              console.error('Error booking appointment:', error);
              return throwError(() => new Error('Failed to book appointment'));
            })
          );
      })
    );
  }

  // Get appointments for the current patient
  getMyAppointments(): Observable<Appointment[]> {
    return this.profileService.getCurrentProfile().pipe(
      switchMap(profile => {
        if (!profile || !profile.id) {
          console.error('No profile or profile ID found');
          return throwError(() => new Error('Patient ID not found'));
        }

        console.log('Using patient ID from profile:', profile.id);
        return this.http.get<Appointment[]>(`${this.apiUrl}/my-appointments`).pipe(
          map(appointments => this.normalizeAppointments(appointments))
        );
      }),
      catchError(error => {
        console.error('Error getting patient appointments:', error);
        return throwError(() => new Error('Failed to get appointments'));
      })
    );
  }

  // Get appointments for the current doctor
  getMyDoctorAppointments(): Observable<Appointment[]> {
    console.log('Calling getMyDoctorAppointments API');
    return this.profileService.getCurrentProfile().pipe(
      switchMap(profile => {
        if (!profile || !profile.id) {
          console.error('No profile or profile ID found');
          return throwError(() => new Error('Doctor ID not found'));
        }

        console.log('Using doctor ID from profile:', profile.id);
        return this.http.get<Appointment[]>(`${this.apiUrl}/my-doctor-appointments`).pipe(
          map(appointments => {
            console.log('Raw API Response for appointments:', JSON.stringify(appointments, null, 2));
            const normalized = this.normalizeAppointments(appointments);
            console.log('After normalization:', JSON.stringify(normalized, null, 2));
            return normalized;
          })
        );
      }),
      catchError(error => {
        console.error('Error getting doctor appointments:', error);
        return throwError(() => new Error('Failed to get appointments'));
      })
    );
  }

  // Get appointments for the current secretary's assigned doctor
  getSecretaryAppointments(secretaryId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/secretary/${secretaryId}`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(appointments => this.normalizeAppointments(appointments)),
      catchError(error => {
        console.error('Error fetching secretary appointments:', error);
        return throwError(() => new Error('Failed to fetch appointments. Make sure you are assigned to a doctor.'));
      })
    );
  }

  // Get appointments for the current secretary's assigned doctor using ProfileService
  getMySecretaryAppointments(): Observable<Appointment[]> {
    // Use the profile service to get the current user's ID
    return this.profileService.getCurrentProfile().pipe(
      switchMap(profile => {
        if (!profile || !profile.id) {
          return throwError(() => new Error('User ID not found'));
        }
        console.log('Using secretary ID from profile:', profile.id);
        return this.getSecretaryAppointments(profile.id);
      }),
      catchError(error => {
        console.error('Error getting user profile:', error);
        return throwError(() => new Error('Failed to get user profile'));
      })
    );
  }

  // Update appointment status with secretary check
  updateAppointmentStatus(appointmentId: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.put<Appointment>(
      `${this.apiUrl}/status/${appointmentId}`, 
      { status }, 
      { headers: this.getHeaders() }
    ).pipe(
      map(appointment => this.normalizeAppointment(appointment)),
      catchError(error => {
        console.error('Error updating appointment status:', error);
        return throwError(() => new Error('Failed to update appointment status. You may not have permission.'));
      })
    );
  }

  // Update appointment status (for doctor)
  updateMyAppointmentStatus(appointmentId: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/update-my-appointment-status?appointmentId=${appointmentId}`, { status })
      .pipe(
        map(appointment => this.normalizeAppointment(appointment))
      );
  }

  // Méthode privée pour normaliser un tableau de rendez-vous
  private normalizeAppointments(appointments: any[]): Appointment[] {
    if (!appointments || !Array.isArray(appointments)) {
      console.warn('Invalid appointments data:', appointments);
      return [];
    }
    
    console.log('Starting normalization of appointments array. Count:', appointments.length);
    const normalized = appointments.map((appointment, index) => {
      console.log(`Normalizing appointment ${index + 1}/${appointments.length}`);
      return this.normalizeAppointment(appointment);
    });
    
    console.log('Completed normalizing all appointments');
    return normalized;
  }
  
  // Méthode privée pour normaliser un rendez-vous individuel
  private normalizeAppointment(appointment: any): Appointment {
    if (!appointment) {
      console.warn('Invalid appointment data:', appointment);
      return {} as Appointment;
    }

    console.log('Raw appointment data:', appointment);

    // Extract patient data - handle both nested and flat structures
    let patientData = appointment.patient || {};
    if (typeof patientData === 'number') {
      patientData = { id: patientData };
    }

    // Create normalized patient object with fallbacks
    const normalizedPatient = {
      id: patientData.id || appointment.patient_id || -1,
      nom: patientData.nom || appointment.patient_nom || '',
      prenom: patientData.prenom || appointment.patient_prenom || '',
      email: patientData.email || appointment.patient_email || '',
      phoneNumber: patientData.phoneNumber || appointment.patient_phone || ''
    };

    // Extract doctor data - handle both nested and flat structures
    let doctorData = appointment.doctor || {};
    if (typeof doctorData === 'number') {
      doctorData = { id: doctorData };
    }

    // Create normalized doctor object with fallbacks
    const normalizedDoctor = {
      id: doctorData.id || appointment.doctor_id || -1,
      nom: doctorData.nom || appointment.doctor_nom || '',
      prenom: doctorData.prenom || appointment.doctor_prenom || ''
    };

    console.log('Normalized patient:', normalizedPatient);
    console.log('Normalized doctor:', normalizedDoctor);

    // Create normalized appointment with all possible fallbacks
    const normalizedAppointment = {
      id: appointment.id || -1,
      appointmentDateTime: this.normalizeDate(appointment.appointmentDateTime || appointment.date || new Date()),
      status: appointment.status || AppointmentStatus.PENDING,
      caseType: appointment.caseType || appointment.case_type || CaseType.NORMAL,
      appointmentType: appointment.appointmentType || appointment.appointment_type || AppointmentType.SOIN,
      notes: appointment.notes || '',
      patient: normalizedPatient,
      doctor: normalizedDoctor
    };

    console.log('Normalized appointment:', normalizedAppointment);
    return normalizedAppointment;
  }
  
  // Normaliser différents formats de date vers ISO string
  private normalizeDate(dateStr: any): string {
    try {
      // Si c'est déjà un objet Date valide
      if (dateStr instanceof Date && !isNaN(dateStr.getTime())) {
        return dateStr.toISOString();
      }
      
      // Si c'est une chaîne
      if (typeof dateStr === 'string') {
        // Format "Invalid Date" ou chaîne vide
        if (dateStr === "Invalid Date" || dateStr.trim() === '') {
          console.warn('Date "Invalid Date" détectée, utilisation d\'une date par défaut');
          return new Date().toISOString();
        }
        
        // Format DD/MM/YYYY HH:MM
        if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/)) {
          const parts = dateStr.split(' ');
          const dateParts = parts[0].split('/');
          const timeParts = parts[1].split(':');
          
          // Format YYYY-MM-DDTHH:MM:SS
          const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timeParts[0]}:${timeParts[1]}:00`;
          console.log(`Date normalisée: ${dateStr} -> ${isoDate}`);
          return isoDate;
        }
        
        // Essayer de créer une date à partir de la chaîne
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      // Vérifier si c'est un tableau/objet qui pourrait contenir une date formatée
      if (typeof dateStr === 'object' && dateStr !== null) {
        console.log('Objet date détecté:', dateStr);
        
        // Cas du format [année, mois, jour, heure, minute]
        if (Array.isArray(dateStr) && dateStr.length >= 5) {
          const [year, month, day, hour, minute] = dateStr;
          // Attention: les mois dans Date() sont 0-indexés
          const date = new Date(year, month - 1, day, hour, minute);
          console.log(`Date reconstruite à partir du tableau: ${date.toISOString()}`);
          return date.toISOString();
        }
        
        // Essayer d'extraire des propriétés de date
        if (dateStr.year && dateStr.month && dateStr.day) {
          const date = new Date(
            dateStr.year, 
            dateStr.month - 1, 
            dateStr.day,
            dateStr.hour || 0,
            dateStr.minute || 0
          );
          console.log(`Date reconstruite à partir de l'objet: ${date.toISOString()}`);
          return date.toISOString();
        }
      }
      
      // Si aucun des formats ci-dessus ne fonctionne, utiliser la date actuelle
      console.warn(`Format de date non reconnu: ${JSON.stringify(dateStr)}, utilisation de la date actuelle`);
      return new Date().toISOString();
    } catch (error) {
      console.error('Erreur lors de la normalisation de la date:', error);
      return new Date().toISOString();
    }
  }

  // Add this to AppointmentService
  testAuth(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/test-auth`);
  }

  // Helper method to get the current doctor's ID
  private getCurrentDoctorId(): number | null {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const decodedToken = jwtDecode(token) as any;
        return decodedToken.id || null;
      }
    } catch (error) {
      console.error('Error getting current doctor ID:', error);
    }
    return null;
  }

  // Helper method to get the current patient's ID from token
  private getCurrentPatientId(): number | null {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No authentication token found');
        return null;
      }

      // Split the token and get the payload
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      // Decode the payload
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('Token payload:', payload);

      // Check if user has patient role
      const authorities = payload.authorities || [];
      if (!authorities.includes('patient')) {
        console.error('User is not a patient');
        return null;
      }

      // Get the sub (email) from the token
      const userEmail = payload.sub;
      if (!userEmail) {
        console.error('No email found in token');
        return null;
      }

      // Get the user ID from the token
      const userId = payload.id;
      if (!userId) {
        console.error('No user ID found in token');
        return null;
      }

      console.log('Found patient ID in token:', userId);
      return userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Helper method to get the correct ID
  private getCorrectId(data: any): number | null {
    console.log('Getting correct ID for data:', data);
    if (!data) {
      console.log('No data provided, returning null');
      return null;
    }
    // If it's a direct ID number
    if (typeof data === 'number') {
      console.log('Data is a number, returning:', data);
      return data;
    }
    // If it's an object with an ID
    if (typeof data === 'object' && 'id' in data) {
      console.log('Data is an object with ID, returning:', data.id);
      return data.id;
    }
    console.log('Could not extract ID, returning null');
    return null;
  }
} 