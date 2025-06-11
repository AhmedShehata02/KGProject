// #region Imports
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
// #endregion

// #region Helpers
function decodeJwt(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
// #endregion

// #region AuthService
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // #region Properties
  private apiUrl = environment.apiBaseUrl + '/api/Auth';
  private tokenExpirationTimer: any;
  // #endregion

  // #region Constructor
  constructor(private http: HttpClient, private router: Router) {
    this.startAutoLogout(); // Start auto logout timer on service load
  }
  // #endregion

  // #region Auth Methods
  /**
   * Login user and store JWT token
   */
  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((res: any) => {
        if (res && res.token) {
          localStorage.setItem('jwt_token', res.token);
          this.startAutoLogout(); // Start timer after login
          // Check IsFirstLogin claim in JWT
          const decoded = decodeJwt(res.token);
          console.log('IsFirstLogin claim:', decoded?.IsFirstLogin);
          if (decoded && (decoded.IsFirstLogin === true || decoded.IsFirstLogin === 'true' || decoded.IsFirstLogin === 1 || decoded.IsFirstLogin === '1')) {
            this.router.navigate(['/auth/change-password-first-time']);
            return;
          }
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  /**
   * Register a new user
   */
  register(data: {
    fullName: string;
    email: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  /**
   * Logout user and clear token
   */
  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('jwt_token');
    }
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    // Optionally redirect to login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Change user password
   */
  changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${this.apiUrl}/changePassword`, data, { headers });
  }

  /**
   * Change password for first login (calls /change-password-first-time endpoint)
   * @param data { oldPassword, newPassword, confirmPassword }
   * @returns Observable<{ token: string }>
   */
  changePasswordFirstTime(data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<{ token: string }> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<{ token: string }>(`${this.apiUrl}/change-password-first-time`, data, { headers });
  }

  /**
   * Forgot password - send reset to backend
   */
  forgotPassword(data: { email: string; loginUrl: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, data);
  }
  // #endregion

  // #region Token Methods
  /**
   * Get JWT token from localStorage
   */
  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('jwt_token');
    }
    return null;
  }

  /**
   * Check if JWT token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  }

  /**
   * Get token expiration date
   */
  private getTokenExpirationDate(token: string): Date | null {
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return null;
    const expiryDate = new Date(0);
    expiryDate.setUTCSeconds(decoded.exp);
    return expiryDate;
  }
  // #endregion

  // #region Auto Logout
  /**
   * Start auto logout timer based on token expiration
   */
  private startAutoLogout() {
    const token = this.getToken();
    if (!token) return;

    const expiryDate = this.getTokenExpirationDate(token);
    if (!expiryDate) return;

    const now = new Date();
    const timeout = expiryDate.getTime() - now.getTime();

    if (timeout <= 0) {
      this.logout();
    } else {
      this.tokenExpirationTimer = setTimeout(() => {
        this.logout();
        // Optionally redirect to login
        // this.router.navigate(['/auth/login']);
      }, timeout);
    }
  }
  // #endregion

  // --- JWT Role/Claim helpers ---
  getDecodedToken(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  getRoles(): string[] {
    const decoded = this.getDecodedToken();
    if (!decoded) return [];
    if (Array.isArray(decoded.roles)) return decoded.roles;
    if (typeof decoded.roles === 'string') return [decoded.roles];
    if (typeof decoded['role'] === 'string') return [decoded['role']];
    if (Array.isArray(decoded['role'])) return decoded['role'];
    return [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }
}
// #endregion
