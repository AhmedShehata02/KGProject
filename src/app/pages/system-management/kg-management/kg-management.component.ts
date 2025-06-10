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

  constructor(private kgBranchService: KGBranchService) {}

  ngOnInit() {
    this.fetchKgBranches();
  }

  fetchKgBranches() {
    this.loading = true;
    this.kgBranchService.getAll().subscribe({
      next: (res) => {
        // If backend wraps result in ApiResponse, extract .result
        this.kgBranches = res.result || res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.result || 'Failed to load KG branches.';
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

  // Placeholder for future CRUD methods (add, edit, delete, etc.)
}
