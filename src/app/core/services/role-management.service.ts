import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApplicationRoleDTO,
  CreateRoleDTO,
  UpdateRoleDTO,
  ToggleRoleStatusDTO,
  RoleWithRoutesDTO,
  ApiResponse,
  PagedResult
} from '../interface/role-management.interfaces';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleManagementService {
  private baseUrl = environment.apiBaseUrl + '/api/RoleManagement'; // عدل المسار حسب إعداداتك

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('jwt_token');
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  getRoleById(id: string): Observable<ApiResponse<ApplicationRoleDTO>> {
    return this.http.get<ApiResponse<ApplicationRoleDTO>>(`${this.baseUrl}/getById/${id}`, this.getHeaders());
  }

  createRole(dto: CreateRoleDTO): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/create`, dto, this.getHeaders());
  }

  updateRole(dto: UpdateRoleDTO): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/update`, dto, this.getHeaders());
  }

  toggleRoleStatus(dto: ToggleRoleStatusDTO): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/toggle-status`, dto, this.getHeaders());
  }

  getRolesWithRoutes(): Observable<ApiResponse<RoleWithRoutesDTO[]>> {
    return this.http.get<ApiResponse<RoleWithRoutesDTO[]>>(`${this.baseUrl}/roles-with-routes`, this.getHeaders());
  }

  deleteRole(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/delete/${id}`, this.getHeaders());
  }

  getAllRolesPaginated(page: number, pageSize: number, searchText?: string, sortBy?: string, sortDirection: 'asc' | 'desc' = 'asc'): Observable<ApiResponse<PagedResult<ApplicationRoleDTO>>> {
    const params: any = {
      Page: page,
      PageSize: pageSize,
      SearchText: searchText || '',
      SortBy: sortBy || '',
      SortDirection: sortDirection || 'asc'
    };
    return this.http.get<ApiResponse<PagedResult<ApplicationRoleDTO>>>(`${this.baseUrl}/getAllPaginated`, { ...this.getHeaders(), params });
  }
}
