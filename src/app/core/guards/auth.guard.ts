import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Use AuthService to check token, to avoid SSR/localStorage issues
    const token = typeof window !== 'undefined' ? this.authService.getToken() : null;
    if (token) {
      return true;
    }
    return this.router.createUrlTree(['/auth/login']);
  }
}
