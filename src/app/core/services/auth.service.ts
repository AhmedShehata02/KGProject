// #region Imports
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { ApiResponse } from '../interface/api-response.interfaces';
import { BaseService } from './base.service';
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
export class AuthService extends BaseService {
  // #region Properties
  private apiUrl = environment.apiBaseUrl + '/api/Auth';
  private tokenExpirationTimer: any;
  private rolesSubject = new BehaviorSubject<string[]>(this.getRoles());
  private securedRoutesSubject = new BehaviorSubject<string[]>(this.getSecuredRoutes());
  // #endregion

  // #region Observables
  roles$ = this.rolesSubject.asObservable();
  securedRoutes$ = this.securedRoutesSubject.asObservable();
  // #endregion

  // #region Constructor
  constructor(private http: HttpClient, private router: Router) {
    super();
    this.startAutoLogout(); // Start auto logout timer on service load
  }
  // #endregion

  // #region Auth Methods
  /**
   * Login user and store JWT token
   */
  login(data: { email: string; password: string }): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/login`, data).pipe(
      tap((res: ApiResponse<string>) => {
        // Handle ApiResponse structure
        if (res && res.code === 200 && res.status === 'Success' && res.result) {
          localStorage.setItem('jwt_token', res.result);
          this.startAutoLogout(); // Start timer after login
          this.updateAuthSubjects();
          // Check IsFirstLogin claim in JWT
          const decoded = decodeJwt(res.result);
          console.log('IsFirstLogin claim:', decoded?.IsFirstLogin);
          // --- Log roles and secured routes ---
          console.log('Roles:', this.getRoles());
          console.log('SecuredRoutes:', this.getSecuredRoutes());
          // ---
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
  }): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/register`, data);
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
    this.updateAuthSubjects();
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
  }): Observable<ApiResponse<string | string[]>> {
    return this.http.post<ApiResponse<string | string[]>>(
      `${this.apiUrl}/changePassword`,
      data,
      this.getAuthHeaders()
    );
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
  }): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.apiUrl}/change-password-first-time`,
      data,
      this.getAuthHeaders()
    );
  }

  /**
   * Forgot password - send reset to backend
   */
  forgotPassword(data: { email: string; loginUrl: string }): Observable<ApiResponse<string | string[]>> {
    return this.http.post<ApiResponse<string | string[]>>(`${this.apiUrl}/forgot-password`, data);
  }
  // #endregion

  // #region Token Methods
  /**
   * Get JWT token from localStorage
   */
  override getToken(): string | null {
    return super.getToken();
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

  /**
   * Get secured routes from JWT token claims
   */
  getSecuredRoutes(): string[] {
    const decoded = this.getDecodedToken();
    if (!decoded) return [];
    // Handle both single and multiple claims
    if (Array.isArray(decoded.SecuredRoute)) return decoded.SecuredRoute;
    if (typeof decoded.SecuredRoute === 'string') return [decoded.SecuredRoute];
    // Fallback: check for multiple claims with different casing
    if (Array.isArray(decoded.securedRoute)) return decoded.securedRoute;
    if (typeof decoded.securedRoute === 'string') return [decoded.securedRoute];
    return [];
  }

  /**
   * Check if user has access to a specific secured route
   */
  hasSecuredRoute(route: string): boolean {
    return this.getSecuredRoutes().includes(route);
  }

  private updateAuthSubjects() {
    this.rolesSubject.next(this.getRoles());
    this.securedRoutesSubject.next(this.getSecuredRoutes());
  }
}
// #endregion
