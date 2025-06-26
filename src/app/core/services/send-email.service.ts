import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmailDto } from '../interface/email.interfaces';
import { ApiResponse } from '../interface/api-response.interfaces';

@Injectable({
  providedIn: 'root'
})
export class SendEmailService {
  private apiUrl = environment.apiBaseUrl + '/email';

  constructor(private http: HttpClient) {}

  sendEmail(email: EmailDto): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/send`, email);
  }
}
