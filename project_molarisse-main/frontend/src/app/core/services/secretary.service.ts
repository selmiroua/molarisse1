import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { catchError, tap, map } from 'rxjs/operators';

// Define the type for secretary status
type SecretaryStatusResponse = { 
  status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'; 
  doctorId?: number 
};

@Injectable({
  providedIn: 'root'
})
export class SecretaryService {
  private apiUrl = `${environment.apiUrl}/api/v1/users`;

  constructor(private http: HttpClient) { }

  /**
   * Get all secretary requests
   */
  getSecretaryRequests(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/doctor/secretary-applications`).pipe(
      tap(requests => console.log('Fetched secretary requests:', requests)),
      catchError(error => {
        console.error('Error fetching secretary requests:', error);
        return of([]);
      })
    );
  }

  /**
   * Get current secretary's status
   */
  getSecretaryStatus(): Observable<SecretaryStatusResponse> {
    console.log('Fetching secretary status from:', `${this.apiUrl}/secretary/status`);
    
    return this.http.get<SecretaryStatusResponse>(`${this.apiUrl}/secretary/status`)
      .pipe(
        tap(response => {
          console.log('Secretary status response:', response);
        }),
        catchError(error => {
          console.error('Error fetching secretary status:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Full error:', error);
          
          // Default to NONE status for testing UI
          const mockResponse: SecretaryStatusResponse = { status: 'NONE' };
          return of(mockResponse);
        })
      );
  }

  /**
   * Get all secretaries
   */
  getAllSecretaries(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/all`).pipe(
      catchError(error => {
        console.error('Error fetching all secretaries:', error);
        return of([]);
      })
    );
  }

  /**
   * Get secretary by ID
   */
  getSecretaryById(secretaryId: number): Observable<User> {
    return this.http.get<Partial<User>>(`${this.apiUrl}/${secretaryId}`).pipe(
      map(response => ({
        ...response,
        accountLocked: false,
        enabled: response.enabled ?? true,
        id: response.id!,
        nom: response.nom!,
        prenom: response.prenom!,
        email: response.email!,
        role: response.role!
      } as User))
    );
  }

  /**
   * Approve a secretary request
   */
  approveSecretaryRequest(secretaryId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/doctor/process-secretary`, {
      secretaryId: secretaryId,
      action: 'APPROVED'
    }).pipe(
      tap(response => console.log('Secretary request approved:', response)),
      catchError(error => {
        console.error('Error approving secretary request:', error);
        throw error;
      })
    );
  }

  /**
   * Reject a secretary request
   */
  rejectSecretaryRequest(secretaryId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/doctor/process-secretary`, {
      secretaryId: secretaryId,
      action: 'REJECTED'
    }).pipe(
      tap(response => console.log('Secretary request rejected:', response)),
      catchError(error => {
        console.error('Error rejecting secretary request:', error);
        throw error;
      })
    );
  }
} 