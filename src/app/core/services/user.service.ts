import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

 /**
 * Generic API response structure matching backend.
 */
export interface ApiResponse<T> {
  code: number;
  status: string;
  result: T;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = environment.apiBaseUrl + '/api/User';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.get<any[]>(`${this.apiUrl}`, { headers });
  }

  getUserById(id: string): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers });
  }

  updateUser(id: string, user: any): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    // Ensure property names match backend ApplicationUser model (Id, UserName, Email)
    const payload = {
      Id: user.id || user.Id,
      UserName: user.userName || user.UserName,
      Email: user.email || user.Email
    };
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload, { headers });
  }

  deleteUser(id: string): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }

  // Get all roles in the system
  getAllRoles(): Observable<string[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.get<string[]>(`${this.apiUrl}/allroles`, { headers });
  }

  // Get all claims in the system (returns array of {type, value})
  getAllClaims(): Observable<string[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.get<any[]>(`${this.apiUrl}/allclaims`, { headers }).pipe(
      map((claims: any[]) => claims.map(c => c.type || c.value || (typeof c === 'string' ? c : JSON.stringify(c))))
    );
  }

  // Get user roles by user id
  getUserRoles(id: string): Observable<string[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.get<string[]>(`${this.apiUrl}/${id}/roles`, { headers });
  }

  // Update user roles by user id
  updateUserRoles(id: string, roles: string[]): Observable<string[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.post<string[]>(`${this.apiUrl}/${id}/roles`, roles, { headers });
  }

  // Get user claims by user id (returns array of claim types)
  getUserClaims(id: string): Observable<string[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.get<string[]>(`${this.apiUrl}/${id}/claims`, { headers });
  }

  // Update user claims by user id (send array of claim types)
  updateUserClaims(id: string, claims: string[]): Observable<string[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.post<string[]>(`${this.apiUrl}/${id}/claims`, claims, { headers });
  }

  /**
   * Create a new user by admin (calls /create-by-admin endpoint)
   * @param userData CreateUserByAdminDTO
   * @returns Observable<ApiResponse<any>>
   *   - Success: { code, status, result: { Message, UserId, EmailSent } }
   *   - Validation Error: { code, status, result: string[] }
   *   - Error: { code, status, result: { Message, Details } }
   */
  createUserByAdmin(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    roles: string[];
    redirectUrlAfterResetPassword: string;
  }): Observable<ApiResponse<any>> {
    const token = localStorage.getItem('jwt_token');
    console.log('JWT token used for createUserByAdmin:', token); // Debug: log token
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/create-by-admin`, userData, { headers });
  }

  // --- Profile-related methods moved to UsersProfilesService ---
  // completeBasicProfile(userId: string, dto: any): Observable<ApiResponse<string>> { ... }
  // getAllUserProfiles(): Observable<ApiResponse<any>> { ... }
  // getUserRequestStatus(userId: string): Observable<ApiResponse<any>> { ... }
  // profileReviewByAdmin(dto: any): Observable<ApiResponse<string>> { ... }
  // getUserProfileByUserId(userId: string): Observable<ApiResponse<any>> { ... }
}
