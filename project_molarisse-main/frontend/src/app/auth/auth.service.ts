import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/v1/auth`;
  private userRole: string | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only access localStorage in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.userRole = localStorage.getItem('userRole');
      console.log('AuthService initialized with API URL:', this.apiUrl);
      console.log('Current token:', localStorage.getItem('access_token'));
    }
  }

  register(userData: any): Observable<any> {
    console.log('Registering user with data:', userData);
    return this.http.post(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => console.log('Registration response:', response)),
        catchError(error => {
          console.error('Registration error:', error);
          throw error;
        })
      );
  }

  authenticate(credentials: any): Observable<any> {
    console.log('Authenticating with credentials:', credentials);
    return this.http.post(`${this.apiUrl}/authenticate`, credentials).pipe(
      tap((response: any) => {
        console.log('Auth response:', response);
        if (response?.token) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('access_token', response.token);
          }
        }
        if (response?.role) {
          const role = response.role.toLowerCase();
          console.log('Setting role:', role);
          this.userRole = role;
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('userRole', role);
          }
        } else {
          console.error('No role in response');
          throw new Error('No role received from server');
        }
      }),
      catchError(error => {
        console.error('Authentication error:', error);
        throw error;
      })
    );
  }

  logout(): void {
    // Clear client-side storage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
      sessionStorage.clear();
      this.userRole = null;
    }

    // Notify server in the background with correct API path
    this.http.post<void>(`${this.apiUrl}/api/v1/auth/logout`, {}).subscribe({
      error: (error) => console.error('Error notifying server of logout:', error)
    });
  }

  getUserRole(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return this.userRole || localStorage.getItem('userRole');
    } else {
      return this.userRole;
    }
  }

  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('access_token');
    }
    return false;
  }

  activateAccount(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/activate-account`, { params: { token } })
      .pipe(
        tap(response => console.log('Account activation response:', response)),
        catchError(error => {
          console.error('Account activation error:', error);
          throw error;
        })
      );
  }

  getRoles(): Observable<string[]> {
    console.log('Getting roles from:', `${this.apiUrl}/roles`);
    return this.http.get<string[]>(`${this.apiUrl}/roles`)
      .pipe(
        tap(roles => console.log('Received roles:', roles)),
        catchError(error => {
          console.error('Error getting roles:', error);
          throw error;
        })
      );
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        console.log('Login response:', response);
        if (response && response.token) {
          console.log('Storing token in localStorage');
          localStorage.setItem('access_token', response.token);
        } else {
          console.warn('No token found in response');
        }
      })
    );
  }

  getCurrentUserId(): number | null {
    console.log('Getting current user ID...');
    const token = localStorage.getItem('access_token');
    console.log('Token from localStorage:', token ? 'Present' : 'Not found');
    
    if (!token) {
      console.log('No token found in localStorage');
      return null;
    }
    
    try {
      console.log('Attempting to decode token...');
      const parts = token.split('.');
      console.log('Token parts:', parts.length);
      
      if (parts.length !== 3) {
        console.error('Invalid token format - expected 3 parts but got:', parts.length);
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('Decoded payload:', payload);
      
      if (!payload.id) {
        console.error('No user ID found in token payload');
        return null;
      }
      
      console.log('Successfully extracted user ID:', payload.id);
      return payload.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  getUserEmail(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email || payload.sub || null;
      } catch (error) {
        console.error('Error getting user email from token:', error);
        return null;
      }
    }
    return null;
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/current-user`);
  }
}
