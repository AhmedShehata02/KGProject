import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit {
  users: any[] = [];
  pagedUsers: any[] = [];
  loading = false;
  error = '';
  selectedUser: any = {};
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  editUserRoles: string[] = [];
  editUserClaims: string[] = [];
  editUserRolesLoading = false;
  editUserClaimsLoading = false;
  allRoles: string[] = [];
  allClaims: string[] = [];
  selectedUserRoles: string[] = [];
  selectedUserClaims: string[] = [];
  @ViewChild('editUserModal') editUserModal!: ElementRef;

  constructor(public userService: UserService) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.setPagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users.';
        this.loading = false;
      }
    });
  }

  setPagination() {
    this.totalPages = Math.ceil(this.users.length / this.pageSize) || 1;
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedUsers = this.users.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.setPagination();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.setPagination();
  }

  openEditUser(user: any) {
    this.selectedUser = { ...user };
    this.editUserRolesLoading = true;
    this.editUserClaimsLoading = true;
    this.selectedUserRoles = [];
    this.selectedUserClaims = [];
    // Fetch all roles from backend
    this.userService.getAllRoles().subscribe({
      next: (roles) => {
        this.allRoles = roles || [];
        // Fetch user's roles after allRoles loaded
        this.userService.getUserRoles(user.id).subscribe({
          next: (userRoles) => {
            this.selectedUserRoles = userRoles || [];
            this.editUserRolesLoading = false;
          },
          error: () => {
            this.selectedUserRoles = [];
            this.editUserRolesLoading = false;
          }
        });
      },
      error: () => {
        this.allRoles = [];
        this.editUserRolesLoading = false;
      }
    });
    // Fetch all claims from backend
    this.userService.getAllClaims().subscribe({
      next: (claims) => {
        this.allClaims = claims || [];
        // Fetch user's claims after allClaims loaded
        this.userService.getUserClaims(user.id).subscribe({
          next: (userClaims) => {
            this.selectedUserClaims = userClaims || [];
            this.editUserClaimsLoading = false;
          },
          error: () => {
            this.selectedUserClaims = [];
            this.editUserClaimsLoading = false;
          }
        });
      },
      error: () => {
        this.allClaims = [];
        this.editUserClaimsLoading = false;
      }
    });
    // Show Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(this.editUserModal.nativeElement);
    modal.show();
  }

  onRoleCheckboxChange(role: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedUserRoles.includes(role)) {
        this.selectedUserRoles.push(role);
      }
    } else {
      this.selectedUserRoles = this.selectedUserRoles.filter(r => r !== role);
    }
  }

  onClaimCheckboxChange(claim: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedUserClaims.includes(claim)) {
        this.selectedUserClaims.push(claim);
      }
    } else {
      this.selectedUserClaims = this.selectedUserClaims.filter(c => c !== claim);
    }
  }

  saveUser() {
    // Save user name and email (email is disabled but must be sent to backend)
    this.userService.updateUser(this.selectedUser.id, {
      id: this.selectedUser.id,
      userName: this.selectedUser.userName,
      email: this.selectedUser.email
    }).subscribe({
      next: () => {
        // Save roles
        this.userService.updateUserRoles(this.selectedUser.id, this.selectedUserRoles).subscribe({
          next: () => {
            // Save claims
            this.userService.updateUserClaims(this.selectedUser.id, this.selectedUserClaims).subscribe({
              next: () => {
                // Close modal after all updates succeed
                (window as any).bootstrap.Modal.getOrCreateInstance(this.editUserModal.nativeElement).hide();
                this.fetchUsers();
              },
              error: () => {
                this.fetchUsers();
              }
            });
          },
          error: () => {
            this.fetchUsers();
          }
        });
      },
      error: () => {
        this.fetchUsers();
      }
    });
  }
}
