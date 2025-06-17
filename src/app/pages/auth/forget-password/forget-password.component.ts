import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.css'
})
export class ForgetPasswordComponent {
  email = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;
  emailInvalid = false;

  constructor(private authService: AuthService) {}

  getLoginUrl(): string {
    // You can customize this if you want a different redirect
    return window.location.origin + '/auth/login';
  }

  onEmailInput() {
    this.emailInvalid = !!this.email && !/^\S+@\S+\.\S+$/.test(this.email);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.error = null;
    this.success = null;
    this.emailInvalid = !!this.email && !/^\S+@\S+\.\S+$/.test(this.email);
    if (!this.email || this.emailInvalid) {
      this.error = 'Please enter a valid email address.';
      return;
    }
    this.loading = true;
    this.authService.forgotPassword({ email: this.email, loginUrl: this.getLoginUrl() }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.code === 200 && res.status === 'Success') {
          this.success = Array.isArray(res.result) ? res.result.join(' ') : (res.result || 'If the email is registered, a new password has been sent.');
        } else if (res && res.result) {
          this.error = Array.isArray(res.result) ? res.result.join(' ') : res.result;
        } else {
          this.error = 'An error occurred. Please try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        if (err?.error?.result) {
          this.error = Array.isArray(err.error.result) ? err.error.result.join(' ') : err.error.result;
        } else if (err?.error?.message) {
          this.error = err.error.message;
        } else {
          this.error = 'An error occurred. Please try again.';
        }
      }
    });
  }
}
