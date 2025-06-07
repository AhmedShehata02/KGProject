import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
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
    const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm.value;
    this.authService.changePassword({ currentPassword, newPassword, confirmPassword }).subscribe({
      next: (res) => {
        this.success = res?.message || 'Password changed successfully.';
        this.loading = false;
        this.changePasswordForm.reset();
      },
      error: (err) => {
        // Try to show detailed backend validation errors if present
        console.error('Change password error:', err);
        if (err?.error?.errors) {
          this.error = Object.values(err.error.errors).join(' ');
        } else if (err?.error?.message) {
          this.error = err.error.message;
        } else if (err?.status === 401) {
          this.error = 'Current password is incorrect.';
        } else {
          this.error = err?.error?.title || err?.error || 'Failed to change password.';
        }
        this.loading = false;
      }
    });
  }
}
