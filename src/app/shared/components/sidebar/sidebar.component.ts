import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarItemDTO } from '../../../core/interface/sidebar.interfaces';
import { take } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

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
  currentLang: string;

  constructor(
    public auth: AuthService,
    private sidebarService: SidebarService,
    private languageService: LanguageService
  ) {
    this.currentLang = this.languageService.getSavedLanguage();
    this.auth.securedRoutes$.subscribe(() => {
      this.filterMenuItems();
    });
    this.languageService.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      // إعادة بناء العناصر عند تغيير اللغة
      this.allSidebarItems = this.allSidebarItems.map(item => this.switchSidebarItemLabel(item));
      this.setAllowedMenuItems(this.allSidebarItems);
    });
  }

  ngOnInit() {
    this.sidebarService.getAllPaginated({ page: 1, pageSize: 99999 }).pipe(take(1)).subscribe({
      next: (res) => {
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
    // مرر labelAr و labelEn مع العنصر لتسهيل التبديل لاحقًا
    const label = this.currentLang === 'ar' ? dto.labelAr : dto.labelEn;
    return {
      label,
      icon: dto.icon,
      route: dto.route,
      children: dto.children && dto.children.length > 0
        ? dto.children.map(this.mapSidebarItemFromDTO.bind(this))
        : [],
      // إضافة خصائص اللغة الأصلية
      labelAr: dto.labelAr,
      labelEn: dto.labelEn
    } as any;
  }

  switchSidebarItemLabel(item: SidebarItem): SidebarItem {
    // استخدم الخصائص الأصلية إذا كانت موجودة
    const label = (item as any).labelAr && this.currentLang === 'ar'
      ? (item as any).labelAr
      : (item as any).labelEn || item.label;
    return {
      ...item,
      label,
      children: item.children?.map(child => this.switchSidebarItemLabel(child)),
      labelAr: (item as any).labelAr,
      labelEn: (item as any).labelEn
    } as any;
  }

  setAllowedMenuItems(items: SidebarItem[]) {
    const securedRoutes = this.auth.getSecuredRoutes();
    const userRoles = this.auth.getRoles();
    const isSuperAdmin = userRoles.includes('Super Admin');
    const isAllowed = (route?: string, label?: string) => {
      const dashboardLabels = [
        'dashboard', 'لوحة القيادة', 'لوحه القياده', 'لوحة تحكم', 'لوحة التحكم', 'لوحه التحكم'
      ];
      const normalizedLabel = (label || '').replace(/\s/g, '').toLowerCase();
      if (dashboardLabels.map(l => l.replace(/\s/g, '').toLowerCase()).includes(normalizedLabel)) return true;
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
