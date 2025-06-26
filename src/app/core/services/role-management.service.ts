import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class RoleManagementService extends BaseService {
  private baseUrl = environment.apiBaseUrl + '/api/RoleManagement';

  constructor(private http: HttpClient) { super(); }

  getRoleById(id: string): Observable<ApiResponse<ApplicationRoleDTO>> {
    return this.http.get<ApiResponse<ApplicationRoleDTO>>(`${this.baseUrl}/getById/${id}`, this.getAuthHeaders());
  }

  createRole(dto: CreateRoleDTO): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/create`, dto, this.getAuthHeaders());
  }

  updateRole(dto: UpdateRoleDTO): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/update`, dto, this.getAuthHeaders());
  }

  toggleRoleStatus(dto: ToggleRoleStatusDTO): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}/toggle-status`, dto, this.getAuthHeaders());
  }

  getRolesWithRoutes(): Observable<ApiResponse<RoleWithRoutesDTO[]>> {
    return this.http.get<ApiResponse<RoleWithRoutesDTO[]>>(`${this.baseUrl}/roles-with-routes`, this.getAuthHeaders());
  }

  deleteRole(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/delete/${id}`, this.getAuthHeaders());
  }

  getAllRolesPaginated(page: number, pageSize: number, searchText?: string, sortBy?: string, sortDirection: 'asc' | 'desc' = 'asc'): Observable<ApiResponse<PagedResult<ApplicationRoleDTO>>> {
    const params: any = {
      Page: page,
      PageSize: pageSize,
      SearchText: searchText || '',
      SortBy: sortBy || '',
      SortDirection: sortDirection || 'asc'
    };
    return this.http.get<ApiResponse<PagedResult<ApplicationRoleDTO>>>(`${this.baseUrl}/getAllPaginated`, { ...this.getAuthHeaders(), params });
  }
}
