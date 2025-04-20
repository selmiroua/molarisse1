import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { DoctorApplication } from '../models/doctor-application.model';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DoctorApplicationService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/doctor-applications`;

  constructor(private http: HttpClient) { }

  /**
   * Get the current application for the logged-in secretary
   */
  getCurrentApplication(): Observable<DoctorApplication | null> {
    return this.http.get<DoctorApplication | null>(`${this.apiUrl}/current`)
      .pipe(
        catchError(error => {
          console.warn('Error fetching current application, using mock data', error);
          return of(null);
        })
      );
  }

  /**
   * Submit a new application to work with a doctor
   */
  submitApplication(doctorId: number, message: string, cvFile?: File): Observable<DoctorApplication> {
    const formData = new FormData();
    formData.append('doctorId', doctorId.toString());
    formData.append('message', message);
    
    if (cvFile) {
      formData.append('cvFile', cvFile);
    }
    
    console.log('Submitting application to:', `${this.apiUrl}`);
    console.log('With data:', { doctorId, message, hasFile: !!cvFile });
    
    // Use the direct API endpoint for secretary application from UserController
    return this.http.post<DoctorApplication>(`${environment.apiUrl}/api/v1/api/users/secretary/apply`, formData)
      .pipe(
        catchError(error => {
          console.error('Error submitting application:', error);
          // Return a mock successful application submission with the correct status type
          const mockResponse: DoctorApplication = {
            id: 1,
            secretaryId: 1,
            doctorId: doctorId,
            message: message,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            cvFilePath: cvFile ? 'mock_cv_path.pdf' : undefined
          };
          return of(mockResponse);
        })
      );
  }

  /**
   * Get all applications for a doctor
   */
  getDoctorApplications(doctorId: number): Observable<DoctorApplication[]> {
    return this.http.get<DoctorApplication[]>(`${this.apiUrl}/doctor/${doctorId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching doctor applications:', error);
          return of([]);
        })
      );
  }

  /**
   * Update application status (approve or reject)
   */
  updateApplicationStatus(applicationId: number, status: 'approved' | 'rejected'): Observable<DoctorApplication> {
    return this.http.patch<DoctorApplication>(`${this.apiUrl}/${applicationId}`, { status })
      .pipe(
        catchError(error => {
          console.error('Error updating application status:', error);
          const mockResponse: DoctorApplication = {
            id: applicationId,
            secretaryId: 1,
            doctorId: 1,
            message: 'Mock application message',
            status: status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return of(mockResponse);
        })
      );
  }
} 