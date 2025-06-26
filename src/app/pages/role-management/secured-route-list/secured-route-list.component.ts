import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecuredRouteService } from '../../../core/services/secured-route.service';
import { RoleManagementService } from '../../../core/services/role-management.service';
import { SecuredRouteDTO, PagedResult } from '../../../core/interface/secured-route.interfaces';
import { ApplicationRoleDTO } from '../../../core/interface/role-management.interfaces';
import { TranslateModule } from '@ngx-translate/core';
import { RoleManagementTranslator } from '../role-management-translator';


@Component({
  selector: 'app-secured-route-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './secured-route-list.component.html',
  styleUrl: './secured-route-list.component.css'
})
export class SecuredRouteListComponent implements OnInit {
  routes: SecuredRouteDTO[] = [];
  loading = false;
  error: string | null = null;

  // Pagination and table state
  page = 1;
  pageSize = 10;
  pageSizes = [10, 50, 100];
  totalCount = 0;
  totalPages = 1;

  // Server-side search and sort
  searchText = '';
  searchInput = '';
  sortBy: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Role selection for assign
  allRoles: ApplicationRoleDTO[] = [];

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showDetailsModal = false;
  selectedRoute: SecuredRouteDTO | null = null;
  // Create/Edit form state
  createRouteData = { basePath: '', description: '', assignedRoles: [] as string[] };
  editRouteData = { id: 0, basePath: '', description: '', assignedRoles: [] as string[] };
  createError: string | null = null;
  editError: string | null = null;
  creating = false;
  editing = false;

  constructor(
    private securedRouteService: SecuredRouteService,
    private roleService: RoleManagementService,
    private roleTranslator: RoleManagementTranslator
  ) {}

  async ngOnInit() {
    await this.roleTranslator.loadTranslations();
    this.fetchRoutes();
    this.fetchAllRoles();
  }

  fetchAllRoles() {
    this.roleService.getAllRolesPaginated(1, 1000).subscribe({
      next: (res) => {
        if (res && res.code === 200 && res.status === 'Success') {
          this.allRoles = res.result.data || [];
        }
      },
      error: () => { this.allRoles = []; }
    });
  }

  fetchRoutes() {
    this.loading = true;
    this.error = null;
    this.securedRouteService.getAllRoutesPaginated(
      this.page,
      this.pageSize,
      this.searchText,
      this.sortBy,
      this.sortDirection
    ).subscribe({
      next: (res) => {
        if (res && res.code === 200 && res.status === 'Success') {
          this.routes = res.result.data || [];
          this.totalCount = res.result.totalCount;
          this.totalPages = res.result.totalPages;
        } else {
          if (typeof res.result === 'string') {
            this.error = res.result;
          } else if (Array.isArray(res.result)) {
            this.error = res.result.join(' ');
          } else {
            this.error = 'Failed to load secured routes.';
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.result ? (Array.isArray(err.error.result) ? err.error.result.join(' ') : err.error.result) : (err?.error?.message || 'Failed to load secured routes.');
        this.loading = false;
      }
    });
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.fetchRoutes();
  }

  onPageChange(page: number) {
    this.page = page;
    this.fetchRoutes();
  }

  onSearchClick() {
    this.searchText = this.searchInput.trim();
    this.page = 1;
    this.fetchRoutes();
  }

  onSortToggle(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.page = 1;
    this.fetchRoutes();
  }

  // Modal handlers
  openCreateModal() {
    this.createRouteData = { basePath: '', description: '', assignedRoles: [] };
    // Force reset the form if needed (optional)
    this.createError = null;
    this.showCreateModal = true;
  }
  closeCreateModal() {
    this.showCreateModal = false;
    this.createError = null;
  }
  openEditModal(route: SecuredRouteDTO) {
    // Map assignedRoles to IDs if they are names
    let assignedRoleIds: string[] = [];
    if (route.assignedRoles && route.assignedRoles.length > 0) {
      // If assignedRoles are names, map to IDs
      assignedRoleIds = route.assignedRoles.map(role => {
        // Try to find by name in allRoles
        const found = this.allRoles.find(r => r.name === role || r.id === role);
        return found ? found.id : role;
      });
    }
    this.editRouteData = {
      id: route.id,
      basePath: route.basePath,
      description: route.description || '',
      assignedRoles: assignedRoleIds
    };
    this.editError = null;
    this.showEditModal = true;
  }
  closeEditModal() {
    this.showEditModal = false;
    this.editError = null;
  }
  openDetailsModal(route: SecuredRouteDTO) {
    this.selectedRoute = route;
    this.showDetailsModal = true;
  }
  closeDetailsModal() {
    this.selectedRoute = null;
    this.showDetailsModal = false;
  }

  // CRUD actions
  onCreateRoute() {
    if (!this.createRouteData.basePath || this.createRouteData.basePath.length < 2) {
      this.createError = 'Base path is required.';
      return;
    }
    this.creating = true;
    this.createError = null;
    this.securedRouteService.createRoute({
      basePath: this.createRouteData.basePath,
      description: this.createRouteData.description,
      roleIds: this.createRouteData.assignedRoles
    }).subscribe({
      next: (res) => {
        console.log('Create Route Response:', res); // ✅ Log response
        if (res && (res.code === 200 || res.code === 201) && (res.status === 'Success' || res.status === 'Created')) {
          this.fetchRoutes();
          this.closeCreateModal();
          this.creating = false;
        } else {
          this.createError = typeof res?.result === 'string' ? res.result : 'Failed to create route.';
          this.creating = false;
        }
      },
      error: (err) => {
        console.log('Create Route Error:', err); // ✅ Log error
        this.createError = err?.error?.result || err?.error?.message || 'Failed to create route.';
        this.creating = false;
      }
    });
  }

  onEditRoute() {
    if (!this.editRouteData.basePath || this.editRouteData.basePath.length < 2) {
      this.editError = 'Base path is required.';
      return;
    }
    this.editing = true;
    this.editError = null;
    this.securedRouteService.updateRoute({
      id: this.editRouteData.id,
      basePath: this.editRouteData.basePath,
      description: this.editRouteData.description,
      roleIds: this.editRouteData.assignedRoles // ✅ أرسل الأدوار مباشرة
    }).subscribe({
      next: (res) => {
        if (res && res.code === 200 && res.status === 'Success') {
          this.fetchRoutes();
          this.closeEditModal();
          this.editing = false;
        } else {
          this.editError = 'Failed to update route.';
          this.editing = false;
        }
      },
      error: (err) => {
        this.editError = err?.error?.result || err?.error?.message || 'Failed to update route.';
        this.editing = false;
      }
    });
  }

  deleteRoute(route: SecuredRouteDTO) {
    if (!confirm('Are you sure you want to delete this secured route?')) return;
    this.loading = true;
    this.securedRouteService.deleteRoute(route.id).subscribe({
      next: () => { this.fetchRoutes(); },
      error: (err) => {
        this.error = err?.error?.result || err?.error?.message || 'Failed to delete route.';
        this.loading = false;
      }
    });
  }

  // Checkbox change handler for roles (create/edit)
  onRoleCheckboxChange(roleId: string, event: any, mode: 'create' | 'edit') {
    const checked = event.target.checked;
    const arr = mode === 'create' ? this.createRouteData.assignedRoles : this.editRouteData.assignedRoles;
    if (checked) {
      if (!arr.includes(roleId)) arr.push(roleId);
    } else {
      const idx = arr.indexOf(roleId);
      if (idx > -1) arr.splice(idx, 1);
    }
  }

  getPageArray(): (number | string)[] {
    const total = this.totalPages;
    const current = this.page;
    const delta = 2;
    const pages: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  }

  getRoleNameById(roleId: string): string {
    return this.allRoles.find(r => r.id === roleId)?.name || roleId;
  }
}
