import { Component, OnInit } from '@angular/core';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarItemDTO, CreateSidebarItemDTO, UpdateSidebarItemDTO, PaginationFilter } from '../../../core/interface/sidebar.interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar-management.component.html',
  styleUrl: './sidebar-management.component.css'
})
export class SidebarManagementComponent implements OnInit {
  sidebarItems: SidebarItemDTO[] = [];
  loading = false;
  error: string | null = null;

  showCreateSidebarModal = false;
  showEditSidebarModal = false;

  createSidebarData: CreateSidebarItemDTO = {
    label: '',
    icon: '',
    route: '',
    order: 1,
    parentId: undefined
  };
  createHasSubItem = false;
  createSubItems: CreateSidebarItemDTO[] = [];

  editSidebarData: UpdateSidebarItemDTO = {
    id: 0,
    label: '',
    icon: '',
    route: '',
    order: 1,
    parentId: undefined
  };
  editHasSubItem = false;
  editSubItems: UpdateSidebarItemDTO[] = [];
  editSidebarIndex: number | null = null;

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

  constructor(private sidebarService: SidebarService) {}

  ngOnInit() {
    this.fetchSidebarItems();
  }

  fetchSidebarItems() {
    this.loading = true;
    this.error = null;
    const filter: PaginationFilter = {
      page: this.page,
      pageSize: this.pageSize,
      searchText: this.searchText,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };
    this.sidebarService.getAllPaginated(filter).subscribe({
      next: (res) => {
        if (res && res.code === 200 && res.status === 'Success') {
          this.sidebarItems = res.result.data;
          this.totalCount = res.result.totalCount;
          this.page = res.result.page;
          this.pageSize = res.result.pageSize;
          this.totalPages = res.result.totalPages;
        } else {
          this.sidebarItems = [];
          this.error = 'Failed to load sidebar items.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.result || err?.error?.message || 'Failed to load sidebar items.';
        this.loading = false;
      }
    });
  }

  openCreateSidebarModal() {
    this.createSidebarData = { label: '', icon: '', route: '', order: 1, parentId: undefined };
    this.createHasSubItem = false;
    this.createSubItems = [];
    this.showCreateSidebarModal = true;
  }

  closeCreateSidebarModal() {
    this.showCreateSidebarModal = false;
  }

  addSubItem() {
    this.createSubItems.push({ label: '', icon: '', route: '', order: 1, parentId: undefined });
  }

  removeSubItem(index: number) {
    this.createSubItems.splice(index, 1);
  }

  onCreateSidebar() {
    if (!this.createHasSubItem) {
      this.sidebarService.create(this.createSidebarData).subscribe({
        next: () => {
          this.fetchSidebarItems();
          this.closeCreateSidebarModal();
        },
        error: (err) => {
          this.error = err?.error?.result || err?.error?.message || 'Failed to create sidebar item.';
        }
      });
    } else {
      // Create parent first, then sub items
      this.sidebarService.create(this.createSidebarData).subscribe({
        next: (res) => {
          const parentId = res.result;
          const subCreates = this.createSubItems.map(sub => {
            return this.sidebarService.create({ ...sub, parentId });
          });
          if (subCreates.length) {
            // Wait for all sub items to be created
            Promise.all(subCreates.map(obs => obs.toPromise())).then(() => {
              this.fetchSidebarItems();
              this.closeCreateSidebarModal();
            });
          } else {
            this.fetchSidebarItems();
            this.closeCreateSidebarModal();
          }
        },
        error: (err) => {
          this.error = err?.error?.result || err?.error?.message || 'Failed to create sidebar item.';
        }
      });
    }
  }

  openEditSidebarModal(item: SidebarItemDTO, index: number) {
    this.editSidebarData = {
      id: item.id,
      label: item.label,
      icon: item.icon,
      route: item.route,
      order: item.order,
      parentId: item.parentId
    };
    this.editSidebarIndex = index;
    // If item has children, load them for editing
    if (item.children && item.children.length > 0) {
      this.editHasSubItem = true;
      this.editSubItems = item.children.map(child => ({
        id: child.id,
        label: child.label,
        icon: child.icon,
        route: child.route,
        order: child.order,
        parentId: child.parentId
      }));
    } else {
      this.editHasSubItem = false;
      this.editSubItems = [];
    }
    this.showEditSidebarModal = true;
  }

  closeEditSidebarModal() {
    this.showEditSidebarModal = false;
    this.editSidebarData = { id: 0, label: '', icon: '', route: '', order: 1, parentId: undefined };
    this.editSidebarIndex = null;
  }

  addEditSubItem() {
    this.editSubItems.push({ id: 0, label: '', icon: '', route: '', order: 1, parentId: this.editSidebarData.id });
  }

  removeEditSubItem(index: number) {
    const sub = this.editSubItems[index];
    if (sub.id && sub.id !== 0) {
      if (!confirm('Are you sure you want to delete this sub item?')) return;
      this.sidebarService.delete(sub.id).subscribe({
        next: () => {
          this.editSubItems.splice(index, 1);
        },
        error: (err) => {
          this.error = err?.error?.result || err?.error?.message || 'Failed to delete sub item.';
        }
      });
    } else {
      this.editSubItems.splice(index, 1);
    }
  }

  onEditSidebar() {
    // Update parent
    this.sidebarService.update(this.editSidebarData).subscribe({
      next: () => {
        if (this.editHasSubItem) {
          // Update or create sub items
          const subUpdates = this.editSubItems.map(sub => {
            if (sub.id && sub.id !== 0) {
              return this.sidebarService.update(sub);
            } else {
              return this.sidebarService.create({
                label: sub.label,
                icon: sub.icon,
                route: sub.route,
                order: sub.order,
                parentId: this.editSidebarData.id
              });
            }
          });
          if (subUpdates.length) {
            Promise.all(subUpdates.map(obs => obs.toPromise())).then(() => {
              this.fetchSidebarItems();
              this.closeEditSidebarModal();
            });
          } else {
            this.fetchSidebarItems();
            this.closeEditSidebarModal();
          }
        } else {
          this.fetchSidebarItems();
          this.closeEditSidebarModal();
        }
      },
      error: (err) => {
        this.error = err?.error?.result || err?.error?.message || 'Failed to update sidebar item.';
      }
    });
  }

  deleteSidebarItem(id: number) {
    if (!confirm('Are you sure you want to delete this sidebar item?')) return;
    this.sidebarService.delete(id).subscribe({
      next: () => {
        this.fetchSidebarItems();
      },
      error: (err) => {
        this.error = err?.error?.result || err?.error?.message || 'Failed to delete sidebar item.';
      }
    });
  }

  onSearchClick() {
    this.searchText = this.searchInput.trim();
    this.page = 1;
    this.fetchSidebarItems();
  }

  // Pagination logic
  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.fetchSidebarItems();
  }

  onPageChange(page: number) {
    this.page = page;
    this.fetchSidebarItems();
  }

  getPageArray(): (number | string)[] {
    const total = this.totalPages;
    const current = this.page;
    const delta = 2;
    const pages: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
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

  onSortToggle(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.page = 1;
    this.fetchSidebarItems();
  }
}
