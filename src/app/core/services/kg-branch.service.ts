import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface KindergartenDTO {
  id: number;
  nameAr: string;
  nameEn: string;
  kgCode?: string;
  address: string;
  branches?: BranchDTO[]; // Add branches for mapping
}

export interface BranchDTO {
  id: number;
  nameAr: string;
  nameEn: string;
  address: string;
  phone: string;
  email: string;
  branchCode?: string;
  kindergartenId: number;
}

export interface KGBranchDTO {
  kg: KindergartenDTO;
  branches: BranchDTO[];
}

export interface ApiResponse<T = any> {
  code: number;
  status: string;
  result: T;
}

export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class KGBranchService {
  private kgApiUrl = environment.apiBaseUrl + '/api/Kindergarten';

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('jwt_token');
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  getAllPaginated(page = 1, pageSize = 10, searchText = '', sortBy = '', sortDirection = 'asc'): Observable<ApiResponse<PagedResult<KindergartenDTO>>> {
    let params = new HttpParams()
      .set('Page', page)
      .set('PageSize', pageSize);
    if (searchText) params = params.set('SearchText', searchText);
    if (sortBy) params = params.set('SortBy', sortBy);
    if (sortDirection) params = params.set('SortDirection', sortDirection);
    return this.http.get<ApiResponse<PagedResult<KindergartenDTO>>>(`${this.kgApiUrl}/GetAllPaginated`, {
      ...this.getHeaders(),
      params
    });
  }

  getById(id: number): Observable<ApiResponse<KindergartenDTO>> {
    return this.http.get<ApiResponse<KindergartenDTO>>(`${this.kgApiUrl}/GetById/${id}`, this.getHeaders());
  }

  create(dto: any): Observable<ApiResponse<KindergartenDTO>> {
    return this.http.post<ApiResponse<KindergartenDTO>>(`${this.kgApiUrl}/Create`, dto, this.getHeaders());
  }

  update(dto: any): Observable<ApiResponse<KindergartenDTO>> {
    return this.http.put<ApiResponse<KindergartenDTO>>(`${this.kgApiUrl}/Update`, dto, this.getHeaders());
  }

  delete(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.kgApiUrl}/Delete/${id}`, this.getHeaders());
  }

  softDelete(id: number): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.kgApiUrl}/SoftDelete/${id}`, {}, this.getHeaders());
  }
}
