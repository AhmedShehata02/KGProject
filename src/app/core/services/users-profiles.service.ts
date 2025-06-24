import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interface/api-response.interfaces';

@Injectable({ providedIn: 'root' })
export class UsersProfilesService {
  private apiUrl = environment.apiBaseUrl + '/api/PersonalProfiles';

  constructor(private http: HttpClient) {}

  /**
   * Complete a user's basic profile (self, Admin, or SuperAdmin)
   */
  completeBasicProfile(userId: string, dto: any): Observable<ApiResponse<string>> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/${userId}/complete-profile`, dto, { headers });
  }

  /**
   * Get all user profiles (Admin, Super Admin only)
   */
  getAllUserProfiles(filter: any): Observable<ApiResponse<any>> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/profiles/pending`, { headers, params: filter });
  }

  /**
   * Get a user's profile status (self, Admin, or SuperAdmin)
   */
  getUserRequestStatus(userId: string): Observable<ApiResponse<any>> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${userId}/status`, { headers });
  }

  /**
   * Admin reviews a user profile
   */
  profileReviewByAdmin(dto: any): Observable<ApiResponse<string>> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/ProfileReviewByAdmin`, dto, { headers });
  }

  /**
   * Get a user's full profile by userId (self, Admin, or SuperAdmin)
   */
  getUserProfileByUserId(userId: string): Observable<ApiResponse<any>> {
    const token = localStorage.getItem('jwt_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/profiles/${userId}`, { headers });
  }
}
