import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from 'src/app/shared/services/toast.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-otp.component.html',
  styleUrl: './login-otp.component.css'
})
export class LoginOtpComponent {
  otpForm: FormGroup;
  loading = false;
  error: string | null = null;
  email: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
    private authService: AuthService
  ) {
    this.otpForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(8)]]
    });
    this.route.queryParams.subscribe(params => {
      this.email = params['userId'] || params['email'] || '';
    });
  }

  onSubmit() {
    if (this.otpForm.valid && this.email) {
      this.loading = true;
      this.authService.verifyOtp({ email: this.email, code: this.otpForm.value.code }).subscribe({
        next: (res) => {
          this.loading = false;
          let backendMsg = undefined;
          if (res && res.result) {
            // Only use message property for feedback, never show JWT
            if (typeof res.result === 'object' && (res.result as any).message) {
              backendMsg = (res.result as any).message;
            }
          }
          if (res && res.status === 'Success') {
            this.toast.showSuccess(backendMsg || 'Login successful!');
            if (res.result && typeof res.result === 'string') {
              localStorage.setItem('jwt_token', res.result);
              this.router.navigate(['/dashboard']);
              return;
            } else if (res.result && typeof res.result === 'object' && (res.result as any).token) {
              localStorage.setItem('jwt_token', (res.result as any).token);
              this.router.navigate(['/dashboard']);
              return;
            }
          } else {
            // Show backend error message if available, else fallback
            const errorMsg = backendMsg || (typeof res?.result === 'string' ? undefined : undefined);
            this.toast.showError(errorMsg || 'Invalid OTP or server error.');
          }
        },
        error: (err) => {
          this.loading = false;
          const backendMsg = err?.error?.result || err?.error?.message || err?.message;
          this.toast.showError(backendMsg || 'OTP verification failed');
        }
      });
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
