import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  address: string;
  phoneNumber: string;
  profilePicturePath: string;
  cvFilePath?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/users`;

  constructor(private http: HttpClient) {
    console.log('ProfileService initialized with API URL:', this.apiUrl);
    console.log('Environment API URL:', environment.apiUrl);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token'); 
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getMultipartHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getCurrentProfile(): Observable<UserProfile> {
    const headers = this.getHeaders();
    const url = `${this.apiUrl}/profile`;
    console.log('Getting current profile from:', url);
    console.log('With headers:', headers);
    return this.http.get<UserProfile>(url, { headers });
  }

  updateProfile(profileData: Partial<UserProfile>): Observable<UserProfile> {
    const headers = this.getHeaders();
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profileData, { headers });
  }

  uploadProfilePicture(file: File): Observable<HttpEvent<any>> {
    const headers = this.getMultipartHeaders();
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/profile/picture`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    });
  }

  changePassword(passwordData: PasswordChangeRequest): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/password`, passwordData, { headers });
  }

  uploadCV(file: File): Observable<HttpEvent<any>> {
    const headers = this.getMultipartHeaders();
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload-cv`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    });
  }
}
