import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiBaseUrl + '/api/Auth';

  constructor(private http: HttpClient) {}

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((res: any) => {
        if (res && res.token) {
          localStorage.setItem('jwt_token', res.token);
        }
      })
    );
  }

  register(data: { fullName: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  logout() {
    localStorage.removeItem('jwt_token');
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }
}
