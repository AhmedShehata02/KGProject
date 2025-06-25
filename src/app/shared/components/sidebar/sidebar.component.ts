import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarItemDTO } from '../../../core/interface/sidebar.interfaces';
import { take } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  usersOpen = false;
  settingsOpen = false;
  dashboardOpen = false;
  systemOpen = false;
  systemManagementOpen = false;
  rolesOpen = false;

  allowedMenuItems: SidebarItem[] = [];
  toggleState: { [label: string]: boolean } = {};
  private allSidebarItems: SidebarItem[] = [];

  constructor(public auth: AuthService, private sidebarService: SidebarService) {
    this.auth.securedRoutes$.subscribe(() => {
      this.filterMenuItems();
    });
  }

  ngOnInit() {
    this.sidebarService.getAllPaginated({ page: 1, pageSize: 99999 }).pipe(take(1)).subscribe({
      next: (res) => {
        console.log('[Sidebar] Backend response:', res);
        if (res && res.code === 200 && res.status === 'Success') {
          const items = res.result.data.map(this.mapSidebarItemFromDTO.bind(this));
          this.allSidebarItems = items;
          this.setAllowedMenuItems(items);
        } else {
          this.allowedMenuItems = [];
        }
      },
      error: () => {
        this.allowedMenuItems = [];
      }
    });
  }

  mapSidebarItemFromDTO(dto: SidebarItemDTO): SidebarItem {
    return {
      label: dto.label,
      icon: dto.icon,
      route: dto.route,
      children: dto.children && dto.children.length > 0
        ? dto.children.map(this.mapSidebarItemFromDTO.bind(this))
        : []
    };
  }

  setAllowedMenuItems(items: SidebarItem[]) {
    const securedRoutes = this.auth.getSecuredRoutes();
    const userRoles = this.auth.getRoles();
    const isSuperAdmin = userRoles.includes('Super Admin');
    const isAllowed = (route?: string, label?: string) => {
      if (label === 'Dashboard') return true;
      if (isSuperAdmin) return true;
      if (!route) return true;
      if (!securedRoutes || securedRoutes.length === 0) return true; // fallback: show all if no securedRoutes
      return securedRoutes.some(allowed =>
        route === allowed || route.startsWith(allowed + '/') || allowed === '/'
      );
    };
    this.allowedMenuItems = items
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

  filterMenuItems() {
    // Always filter from the full list, not the already filtered one
    this.setAllowedMenuItems(this.allSidebarItems);
  }

  toggle(label: string): void {
    this.toggleState[label] = !this.toggleState[label];
  }

  isOpen(label: string): boolean {
    return !!this.toggleState[label];
  }
}
