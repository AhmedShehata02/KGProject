import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interface/api-response.interfaces';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class UserService extends BaseService {
  private apiUrl = environment.apiBaseUrl + '/api/User';

  constructor(private http: HttpClient) { super(); }

  getUserById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  updateUser(id: string, user: any): Observable<any> {
    // Ensure property names match backend ApplicationUser model (Id, UserName, Email)
    const payload = {
      Id: user.id || user.Id,
      UserName: user.userName || user.UserName,
      Email: user.email || user.Email
    };
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload, this.getAuthHeaders());
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  // Get all roles in the system
  getAllRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/allroles`, this.getAuthHeaders());
  }

  // Get all claims in the system (returns array of {type, value})
  getAllClaims(): Observable<string[]> {
    return this.http.get<any[]>(`${this.apiUrl}/allclaims`, this.getAuthHeaders()).pipe(
      map((claims: any[]) => claims.map(c => c.type || c.value || (typeof c === 'string' ? c : JSON.stringify(c))))
    );
  }

  // Get user roles by user id
  getUserRoles(id: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${id}/roles`, this.getAuthHeaders());
  }

  // Update user roles by user id
  updateUserRoles(id: string, roles: string[]): Observable<string[]> {
    return this.http.post<string[]>(`${this.apiUrl}/${id}/roles`, roles, this.getAuthHeaders());
  }

  // Get user claims by user id (returns array of claim types)
  getUserClaims(id: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${id}/claims`, this.getAuthHeaders());
  }

  // Update user claims by user id (send array of claim types)
  updateUserClaims(id: string, claims: string[]): Observable<string[]> {
    return this.http.post<string[]>(`${this.apiUrl}/${id}/claims`, claims, this.getAuthHeaders());
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
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/create-by-admin`, userData, this.getAuthHeaders());
  }

  /**
   * Get all users (paginated, filtered, sorted)
   * Calls /api/User/GetAllPaginated
   * @param filter { page, pageSize, searchText?, sortBy?, sortDirection? }
   * @returns Observable<ApiResponse<PagedResult<UserListDTO>>> (see backend)
   */
  getAllUsersPaginated(filter: {
    page: number;
    pageSize: number;
    searchText?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetAllPaginated`, { params: filter as any, ...this.getAuthHeaders() });
  }

  // --- Profile-related methods moved to UsersProfilesService ---
  // completeBasicProfile(userId: string, dto: any): Observable<ApiResponse<string>> { ... }
  // getAllUserProfiles(): Observable<ApiResponse<any>> { ... }
  // getUserRequestStatus(userId: string): Observable<ApiResponse<any>> { ... }
  // profileReviewByAdmin(dto: any): Observable<ApiResponse<string>> { ... }
  // getUserProfileByUserId(userId: string): Observable<ApiResponse<any>> { ... }
}
