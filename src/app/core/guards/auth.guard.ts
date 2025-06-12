import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const token = this.authService.getToken();
    if (token && !this.authService.isTokenExpired()) {
      // RBAC: Check for allowed roles if specified in route data
      const allowedRoles = route.data && route.data['roles'] as string[];
      if (allowedRoles && allowedRoles.length > 0) {
        const userRoles = this.authService.getRoles();
        const hasRole = userRoles.some(role => allowedRoles.includes(role));
        if (!hasRole) {
          // Redirect unauthorized users to /unauthorized
          return this.router.createUrlTree(['/unauthorized']);
        }
      }
      return true;
    }
    this.authService.logout();
    return this.router.createUrlTree(['/auth/login']);
  }
}
