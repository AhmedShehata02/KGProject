import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleManagementService } from '../../../core/services/role-management.service';
import { ApplicationRoleDTO, PagedResult } from '../../../core/interface/role-management.interfaces';

@Component({
  selector: 'app-role-management-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-management-list.component.html',
  styleUrl: './role-management-list.component.css'
})
export class RoleManagementListComponent implements OnInit {
  roles: ApplicationRoleDTO[] = [];
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

  // Modal states
  showCreateRoleModal = false;
  showEditRoleModal = false;
  showDetailsRoleModal = false;
  selectedRole: ApplicationRoleDTO | null = null;
  editRoleIndex: number | null = null;

  // Create role state
  createRoleData = { name: '' };
  createRoleError: string | null = null;
  creatingRole = false;

  // Edit role state
  editRoleError: string | null = null;
  editingRole = false;

  constructor(private roleService: RoleManagementService) {}

  ngOnInit() {
    this.fetchRoles();
  }

  fetchRoles() {
    this.loading = true;
    this.error = null;
    this.roleService.getAllRolesPaginated(
      this.page,
      this.pageSize,
      this.searchText,
      this.sortBy,
      this.sortDirection
    ).subscribe({
      next: (res) => {
        console.log('Roles API response:', res); // Debug log
        if (res && res.code === 200 && res.status === 'Success') {
          this.roles = res.result.data || [];
          this.totalCount = res.result.totalCount;
          this.totalPages = res.result.totalPages;
        } else {
          if (typeof res.result === 'string') {
            this.error = res.result;
          } else if (Array.isArray(res.result)) {
            this.error = res.result.join(' ');
          } else {
            this.error = 'Failed to load roles.';
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.log('Roles API error:', err); // Debug log
        this.error = err?.error?.result ? (Array.isArray(err.error.result) ? err.error.result.join(' ') : err.error.result) : (err?.error?.message || 'Failed to load roles.');
        this.loading = false;
      }
    });
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.fetchRoles();
  }

  onPageChange(page: number) {
    this.page = page;
    this.fetchRoles();
  }

  onSearchClick() {
    this.searchText = this.searchInput.trim();
    this.page = 1;
    this.fetchRoles();
  }

  onSortToggle(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.page = 1;
    this.fetchRoles();
  }

  openCreateRoleModal() {
    this.showCreateRoleModal = true;
  }
  closeCreateRoleModal() {
    this.showCreateRoleModal = false;
    this.createRoleError = null;
    this.createRoleData = { name: '' };
  }

  openEditRoleModal(role: ApplicationRoleDTO, index: number) {
    this.selectedRole = { ...role };
    this.editRoleIndex = index;
    this.showEditRoleModal = true;
  }
  closeEditRoleModal() {
    this.showEditRoleModal = false;
    this.editRoleError = null;
    this.selectedRole = null;
    this.editRoleIndex = null;
  }

  openDetailsRoleModal(role: ApplicationRoleDTO) {
    this.selectedRole = { ...role };
    this.showDetailsRoleModal = true;
  }
  closeDetailsRoleModal() {
    this.showDetailsRoleModal = false;
    this.selectedRole = null;
  }

  deleteRole(role: ApplicationRoleDTO, index: number) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.loading = true;
      this.roleService.deleteRole(role.id).subscribe({
        next: () => {
          this.fetchRoles();
        },
        error: (err) => {
          this.error = err?.error?.result || err?.error?.message || 'Failed to delete role.';
          this.loading = false;
        }
      });
    }
  }

  onCreateRole() {
    if (!this.createRoleData.name || this.createRoleData.name.length < 3) {
      this.createRoleError = 'Role name is required and must be at least 3 characters.';
      return;
    }
    this.creatingRole = true;
    this.createRoleError = null;
    this.roleService.createRole({
      name: this.createRoleData.name
    }).subscribe({
      next: (res) => {
        // Always treat as success if no error thrown
        this.closeCreateRoleModal();
        this.createRoleData = { name: '' };
        this.fetchRoles();
        this.creatingRole = false;
      },
      error: (err) => {
        this.createRoleError = err?.error?.result || err?.error?.message || 'Failed to create role.';
        this.creatingRole = false;
      }
    });
  }

  onEditRole() {
    if (!this.selectedRole || !this.selectedRole.name || this.selectedRole.name.length < 3) {
      this.editRoleError = 'Role name is required and must be at least 3 characters.';
      return;
    }
    this.editingRole = true;
    this.editRoleError = null;
    this.roleService.updateRole({
      id: this.selectedRole.id,
      name: this.selectedRole.name,
      isActive: this.selectedRole.isActive
    }).subscribe({
      next: (res) => {
        this.closeEditRoleModal();
        this.fetchRoles();
        this.editingRole = false;
      },
      error: (err) => {
        this.editRoleError = err?.error?.result || err?.error?.message || 'Failed to update role.';
        this.editingRole = false;
      }
    });
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
}
