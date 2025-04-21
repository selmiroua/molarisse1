import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminStats {
  pendingVerifications: number;
  totalDoctors: number;
  totalPatients: number;
}

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/admin/statistics`);
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/admin/notifications`);
  }

  getVerifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/verifications`);
  }

  getRecentVerifications(limit: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/verifications/recent?limit=${limit}`);
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/profile`, profileData);
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/settings`, settings);
  }
} 