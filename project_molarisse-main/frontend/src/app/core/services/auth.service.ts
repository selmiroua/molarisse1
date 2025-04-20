import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly API_URL = 'http://localhost:8080/api/v1/auth';
  private tokenRefreshTimer: any;
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/authenticate`, { email, password })
      .pipe(
        tap((response: any) => {
          if (response.token) {
            this.setToken(response.token);
          }
        })
      );
  }

  logout(): void {
    // Clear the refresh timer if it exists
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    // Get the token before clearing storage
    const token = this.getToken();

    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Reset the refresh token subject
    this.refreshTokenSubject.next(null);
    this.isRefreshing = false;

    // If there was a token, send logout request to backend
    if (token) {
      this.http.post(`${this.API_URL}/logout`, { token })
        .subscribe({
          next: () => console.log('Logout successful'),
          error: (error) => console.error('Error during logout:', error),
          complete: () => console.log('Logout request completed')
        });
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decodedToken = jwtDecode(token) as any;
      if (!decodedToken.exp) return true;
      
      const expirationDate = new Date(0);
      expirationDate.setUTCSeconds(decodedToken.exp);
      return expirationDate.valueOf() <= new Date().valueOf();
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      this.setupTokenRefresh();
    }
  }

  private setupTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
    }

    const token = this.getToken();
    if (!token) return;

    try {
      const decodedToken = jwtDecode(token) as any;
      const expiresIn = decodedToken.exp * 1000 - Date.now();
      const refreshDelay = Math.max(0, expiresIn - 60000); // Refresh 1 minute before expiry

      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken().subscribe();
      }, refreshDelay);
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  }

  refreshToken(): Observable<any> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.asObservable();
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.http.post(`${this.API_URL}/refresh`, {
      token: this.getToken()
    }).pipe(
      tap((response: any) => {
        this.isRefreshing = false;
        if (response && response.token) {
          this.setToken(response.token);
          this.refreshTokenSubject.next(response.token);
        }
      })
    );
  }

  getCurrentUserEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decodedToken = jwtDecode(token) as any;
      console.log('Decoded token:', decodedToken);
      return decodedToken.sub || decodedToken.email || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  getCurrentUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decodedToken = jwtDecode(token) as any;
      return decodedToken.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
} 