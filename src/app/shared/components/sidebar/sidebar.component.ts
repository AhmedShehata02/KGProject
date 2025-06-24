import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  usersOpen = false;
  settingsOpen = false;
  dashboardOpen = false;
  systemOpen = false;
  rolesOpen = false;

  allMenuItems: SidebarItem[] = [
    {
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      route: '/dashboard',
    },
    {
      label: 'User Management',
      icon: 'bi-people',
      route: '/users',
      children: [
        { label: 'Users List', icon: 'bi-list', route: '/users' },
        { label: 'Profiles Review', icon: 'bi-person-check', route: '/users/review-Profiles'}
      ]
    },
    {
      label: 'Role Management',
      icon: 'bi-shield-lock',
      route: '/roles',
      children: [
        { label: 'Roles List', icon: 'bi-person-badge', route: '/roles' },
        { label: 'Secured Routes', icon: 'bi-shield-check', route: '/roles/secured-routes' }
      ]
    },
    {
      label: 'System Management',
      icon: 'bi-sliders',
      route: '/systemManagement/kg-management',
      children: [
        { label: 'KG Management', icon: 'bi-building', route: '/systemManagement/kg-management' }
      ]
    }
  ];

  allowedMenuItems: SidebarItem[] = [];

  constructor(public auth: AuthService) {
    this.auth.securedRoutes$.subscribe(() => {
      this.filterMenuItems();
    });
    this.filterMenuItems();
  }

  filterMenuItems() {
  const securedRoutes = this.auth.getSecuredRoutes();
  const userRoles = this.auth.getRoles();
  const isSuperAdmin = userRoles.includes('Super Admin');

  const isAllowed = (route?: string, label?: string) => {
    if (label === 'Dashboard') return true;
    if (isSuperAdmin) return true;
    if (!route) return true;
    return securedRoutes.some(allowed =>
      route === allowed || route.startsWith(allowed + '/') || allowed === '/'
    );
  };

  this.allowedMenuItems = this.allMenuItems
    .map(item => {
      const children = item.children?.filter(child => isAllowed(child.route, child.label));

      if (children && children.length > 0) {
        return { ...item, children };
      } else if (!item.children && isAllowed(item.route, item.label)) {
        return item;
      } else if (children?.length === 0 && isAllowed(item.route, item.label)) {
        return { ...item, children: [] };
      }

      return null;
    })
    .filter(Boolean) as SidebarItem[];
}

}
