// src/app/app.routes.ts
import { Routes, CanActivate } from '@angular/router';
import { authRoutes } from './pages/auth/auth-routing';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { userManagementRoutes } from './pages/user-management/user-management-routing';
import { DashboardComponent } from './pages/dashboard/dashboard/dashboard.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: authRoutes,
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'users', children: userManagementRoutes, canActivate: [AuthGuard] },
      { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
      // لاحقًا تقدر تضيف: { path: 'roles', children: roleManagementRoutes }
    ]
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  { path: '**', redirectTo: 'dashboard' }
];

