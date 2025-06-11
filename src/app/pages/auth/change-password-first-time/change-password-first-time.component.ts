import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password-first-time',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password-first-time.component.html',
  styleUrl: './change-password-first-time.component.css'
})
export class ChangePasswordFirstTimeComponent {
  changePasswordForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(form: FormGroup) {
    return form.get('newPassword')!.value === form.get('confirmPassword')!.value ? null : { mismatch: true };
  }

  onSubmit() {
    this.error = null;
    this.success = null;
    if (this.changePasswordForm.invalid) return;
    this.loading = true;
    const { oldPassword, newPassword, confirmPassword } = this.changePasswordForm.value;
    this.authService.changePasswordFirstTime({ oldPassword, newPassword, confirmPassword }).subscribe({
      next: (res) => {
        if (res?.token) {
          localStorage.setItem('jwt_token', res.token);
          this.success = 'Password changed successfully! Redirecting...';
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1200);
        } else {
          this.error = 'Unexpected response from server.';
        }
        this.loading = false;
      },
      error: (err) => {
        if (err?.error?.errors) {
          this.error = Object.values(err.error.errors).join(' ');
        } else if (err?.error?.message) {
          this.error = err.error.message;
        } else if (err?.status === 401) {
          this.error = 'Old password is incorrect.';
        } else {
          this.error = err?.error?.title || err?.error || 'Failed to change password.';
        }
        this.loading = false;
      }
    });
  }
}
