import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KGBranchService, KGBranchDTO } from '../../../core/services/kg-branch.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-kg-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kg-management.component.html',
  styleUrl: './kg-management.component.css'
})
export class KgManagementComponent implements OnInit {
  kgBranches: KGBranchDTO[] = [];
  loading = false;
  error: string | null = null;

  showCreateKgModal = false;
  showEditKgModal = false;
  showDetailsKgModal = false;

  createKgData = {
    kg: {
      nameAr: '',
      nameEn: '',
      address: ''
    },
    branches: [] as any[]
  };

  editKgData: any = null;
  editKgIndex: number | null = null;

  detailsKgData: any = null;

  // Pagination state
  page = 1;
  pageSize = 10;
  pageSizes = [10, 50, 100];
  totalCount = 0;
  totalPages = 1;
  validationErrors: string[] = [];

  constructor(private kgBranchService: KGBranchService) {}

  ngOnInit() {
    this.fetchKgBranches();
  }

  fetchKgBranches() {
    this.loading = true;
    this.error = null;
    this.kgBranchService.getAllPaginated(this.page, this.pageSize).subscribe({
      next: (res) => {
        if (res && res.code === 200 && res.status === 'Success') {
          // Map KindergartenDTO[] to KGBranchDTO[]
          this.kgBranches = (res.result.data || []).map((kg: any) => ({
            kg: {
              id: kg.id,
              nameAr: kg.nameAr,
              nameEn: kg.nameEn,
              kgCode: kg.kgCode,
              address: kg.address
            },
            branches: kg.branches || []
          }));
          this.totalCount = res.result.totalCount;
          this.totalPages = res.result.totalPages;
        } else {
          if (typeof res.result === 'string') {
            this.error = res.result;
          } else if (Array.isArray(res.result)) {
            this.error = res.result.join(' ');
          } else {
            this.error = 'Failed to load KG branches.';
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.result ? (Array.isArray(err.error.result) ? err.error.result.join(' ') : err.error.result) : (err?.error?.message || 'Failed to load KG branches.');
        this.loading = false;
      }
    });
  }

  openCreateKgModal() {
    this.showCreateKgModal = true;
  }

  closeCreateKgModal() {
    this.showCreateKgModal = false;
  }

  addBranch() {
    this.createKgData.branches.push({
      nameAr: '',
      nameEn: '',
      address: '',
      phone: '',
      email: '',
      kindergartenId: null
    });
  }

  removeBranch(index: number) {
    this.createKgData.branches.splice(index, 1);
  }

  // Helper to check if all branch fields are valid according to the DTO validation
  allBranchesValid(): boolean {
    if (!this.createKgData.branches.length) return false;
    return this.createKgData.branches.every(branch =>
      branch.nameAr && branch.nameAr.length >= 3 && branch.nameAr.length <= 50 &&
      branch.nameEn && branch.nameEn.length >= 3 && branch.nameEn.length <= 50 &&
      branch.address && branch.address.length >= 10 && branch.address.length <= 100 &&
      branch.phone && branch.phone.length >= 1 &&
      branch.email && branch.email.length >= 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(branch.email)
    );
  }

  // Placeholder for create action
  onCreateKg() {
    // Prepare DTO to match backend expectations (no id, no branchCode, but kindergartenId is required)
    const dto = {
      kg: {
        nameAr: this.createKgData.kg.nameAr,
        nameEn: this.createKgData.kg.nameEn,
        address: this.createKgData.kg.address
      },
      branches: this.createKgData.branches.map(b => ({
        nameAr: b.nameAr,
        nameEn: b.nameEn,
        address: b.address,
        phone: b.phone,
        email: b.email,
        kindergartenId: 0
      }))
    };
    this.kgBranchService.create(dto).subscribe({
      next: (res) => {
        this.fetchKgBranches();
        this.closeCreateKgModal();
      },
      error: (err) => {
        this.error = err?.error?.result || err?.error?.message || 'Failed to create KG.';
      }
    });
  }

  openEditKgModal(kgBranch: KGBranchDTO, index: number) {
    this.editKgData = {
      kg: { ...kgBranch.kg },
      branches: kgBranch.branches.map(b => ({ ...b }))
    };
    this.editKgIndex = index;
    this.showEditKgModal = true;
  }

  closeEditKgModal() {
    this.showEditKgModal = false;
    this.editKgData = null;
    this.editKgIndex = null;
  }

  allEditBranchesValid(): boolean {
    if (!this.editKgData?.branches?.length) return false;
    return (this.editKgData.branches as any[]).every((branch: any) =>
      branch.nameAr && branch.nameAr.length >= 3 && branch.nameAr.length <= 50 &&
      branch.nameEn && branch.nameEn.length >= 3 && branch.nameEn.length <= 50 &&
      branch.address && branch.address.length >= 10 && branch.address.length <= 100 &&
      branch.phone && branch.phone.length >= 1 &&
      branch.email && branch.email.length >= 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(branch.email)
    );
  }

  addEditBranch() {
    this.editKgData.branches.push({
      nameAr: '',
      nameEn: '',
      address: '',
      phone: '',
      email: '',
      kindergartenId: this.editKgData.kg.id
    });
  }

  removeEditBranch(index: number) {
    if (this.editKgData.branches.length > 1) {
      this.editKgData.branches.splice(index, 1);
    }
  }

  onEditKg() {
    const dto = {
      kg: this.editKgData.kg,
      branches: (this.editKgData.branches as any[]).map((b: any) => ({
        ...b,
        kindergartenId: this.editKgData.kg.id
      }))
    };
    this.kgBranchService.update(dto).subscribe({
      next: () => {
        this.fetchKgBranches();
        this.closeEditKgModal();
      },
      error: (err) => {
        this.error = err?.error?.result || err?.error?.message || 'Failed to update KG.';
      }
    });
  }

  deleteKgBranch(kgId: number) {
    if (!confirm('Are you sure you want to delete this KG and all its branches?')) return;
    this.kgBranchService.softDelete(kgId).subscribe({
      next: () => {
        this.fetchKgBranches();
      },
      error: (err) => {
        this.error = err?.error?.result || err?.error?.message || 'Failed to delete KG.';
      }
    });
  }

  openDetailsKgModal(kgBranch: KGBranchDTO) {
    this.detailsKgData = {
      kg: { ...kgBranch.kg },
      branches: kgBranch.branches.map(b => ({ ...b }))
    };
    this.showDetailsKgModal = true;
  }
  
  closeDetailsKgModal() {
    this.showDetailsKgModal = false;
    this.detailsKgData = null;
  }

  // Pagination logic
  get pagedKgBranches() {
    const start = (this.page - 1) * this.pageSize;
    return this.kgBranches.slice(start, start + this.pageSize);
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.fetchKgBranches();
  }

  onPageChange(page: number) {
    this.page = page;
    this.fetchKgBranches();
  }

  getPageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Placeholder for future CRUD methods (add, edit, delete, etc.)
}
