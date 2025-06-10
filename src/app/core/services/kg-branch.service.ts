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

export interface KGBranchCreateDTO {
  kg: Omit<KindergartenDTO, 'id'>;
  branches: Omit<BranchDTO, 'id' | 'branchCode'>[];
}

export interface KGBranchUpdateDTO {
  kg: KindergartenDTO;
  branches: BranchDTO[];
}

@Injectable({ providedIn: 'root' })
export class KGBranchService {
  private apiUrl = environment.apiBaseUrl + '/api/KGBranch';

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('jwt_token');
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  getAll(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetAll`, this.getHeaders());
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetById/${id}`, this.getHeaders());
  }

  create(dto: KGBranchCreateDTO): Observable<any> {
    // No createdBy param, backend will extract from JWT
    return this.http.post<any>(`${this.apiUrl}/Create`, dto, this.getHeaders());
  }

  update(dto: KGBranchUpdateDTO): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/Update`, dto, this.getHeaders());
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/Delete/${id}`, this.getHeaders());
  }

  softDelete(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/SoftDelete/${id}`, {}, this.getHeaders());
  }
}
