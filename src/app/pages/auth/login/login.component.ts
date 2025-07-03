import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule , ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  showOtp = false;
  otpUserId: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(6), Validators.maxLength(50)],
      ],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.authService.login(this.loginForm.value).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res && res.status === 'OtpRequired') {
            // Show OTP required message from backend if available
            let backendMsg = undefined;
            if (res.result && typeof res.result === 'object' && res.result.message) {
              backendMsg = res.result.message;
            }
            this.toast.showSuccess(backendMsg || 'Please enter the OTP sent to your registered contact.');
            this.showOtp = true;
            // Use email as userId for OTP, or backend can return userId
            this.otpUserId = this.loginForm.value.email;
            // Navigate to OTP page and pass userId (email)
            this.router.navigate(['/auth/login-otp'], { queryParams: { userId: this.otpUserId } });
          }
          // Do not navigate here for success; AuthService handles navigation based on IsFirstLogin
        },
        error: (err: any) => {
          this.loading = false;
          this.toast.showError(err?.error?.message || 'Login failed');
        }
      });
    }
  }
}
