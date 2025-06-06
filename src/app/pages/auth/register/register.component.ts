import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const password = form.get('password')?.value;
  const confirmPassword = form.get('confirmPassword')?.value;
  if (password !== confirmPassword) {
    form.get('confirmPassword')?.setErrors({ ...form.get('confirmPassword')?.errors, mismatch: true });
    return { mismatch: true };
  } else {
    if (form.get('confirmPassword')?.hasError('mismatch')) {
      const errors = { ...form.get('confirmPassword')?.errors };
      delete errors['mismatch'];
      if (Object.keys(errors).length === 0) {
        form.get('confirmPassword')?.setErrors(null);
      } else {
        form.get('confirmPassword')?.setErrors(errors);
      }
    }
    return null;
  }
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(1)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(1)]]
    }, { validators: passwordMatchValidator });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = null;
      this.authService.register(this.registerForm.value).subscribe({
        next: (res: any) => {
          this.loading = false;
          this.router.navigate(['/auth/login']);
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err?.error?.message || 'Registration failed';
        }
      });
    }
  }
}
