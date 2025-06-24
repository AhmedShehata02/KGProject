import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SidebarItemDTO, CreateSidebarItemDTO, UpdateSidebarItemDTO, PaginationFilter, PagedResult } from '../interface/sidebar.interfaces';  

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private apiUrl = environment.apiBaseUrl + '/api/Sidebar';

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('jwt_token');
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  getAllPaginated(filter: PaginationFilter): Observable<{ code: number; status: string; result: PagedResult<SidebarItemDTO> }> {
    let params = new HttpParams()
      .set('Page', filter.page)
      .set('PageSize', filter.pageSize);
    if (filter.searchText) params = params.set('SearchText', filter.searchText);
    if (filter.sortBy) params = params.set('SortBy', filter.sortBy);
    if (filter.sortDirection) params = params.set('SortDirection', filter.sortDirection);

    return this.http.get<{ code: number; status: string; result: PagedResult<SidebarItemDTO> }>(`${this.apiUrl}/GetAllPaginated`, {
      ...this.getHeaders(),
      params
    });
  }

  getById(id: number): Observable<{ code: number; status: string; result: SidebarItemDTO }> {
    return this.http.get<{ code: number; status: string; result: SidebarItemDTO }>(`${this.apiUrl}/GetById/${id}`, this.getHeaders());
  }

  create(dto: CreateSidebarItemDTO): Observable<{ code: number; status: string; result: number }> {
    return this.http.post<{ code: number; status: string; result: number }>(`${this.apiUrl}/Create`, dto, this.getHeaders());
  }

  update(dto: UpdateSidebarItemDTO): Observable<{ code: number; status: string; result: boolean }> {
    return this.http.put<{ code: number; status: string; result: boolean }>(`${this.apiUrl}/Update`, dto, this.getHeaders());
  }

  delete(id: number): Observable<{ code: number; status: string; result: boolean }> {
    return this.http.delete<{ code: number; status: string; result: boolean }>(`${this.apiUrl}/Delete/${id}`, this.getHeaders());
  }

  /**
   * Get all parent sidebar items (for dropdowns, etc.)
   */
  getParentItems(): Observable<{ code: number; status: string; result: SidebarItemDTO[] }> {
    return this.http.get<{ code: number; status: string; result: SidebarItemDTO[] }>(`${this.apiUrl}/parents`, this.getHeaders());
  }
}
