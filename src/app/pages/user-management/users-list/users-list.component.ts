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
  createUserForm: any = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    roles: [],
    redirectUrlAfterResetPassword: ''
  };
  createUserLoading = false;
  createUserError: string | string[] = '';
  createUserSuccess = '';
  createUserAllRoles: string[] = [];
  createUserFormTouched = false;

  constructor(public userService: UserService) {}

  ngOnInit() {
    this.fetchUsers();
    // Fetch all roles for create user modal
    this.userService.getAllRoles().subscribe({
      next: (roles) => {
        this.createUserAllRoles = roles || [];
      },
      error: () => {
        this.createUserAllRoles = [];
      }
    });
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

  deleteUser(user: any) {
    if (confirm(`Are you sure you want to delete user '${user.userName || user.email}'?`)) {
      this.loading = true;
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.fetchUsers();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to delete user.';
          this.loading = false;
        }
      });
    }
  }

  openCreateUserModal() {
    this.createUserForm = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      roles: [],
      redirectUrlAfterResetPassword: window.location.origin + '/reset-temporary-password'
    };
    this.createUserError = '';
    this.createUserSuccess = '';
    this.createUserLoading = false;
  }

  onCreateUserRoleChange(role: string, event: any) {
    if (event.target.checked) {
      if (!this.createUserForm.roles.includes(role)) {
        this.createUserForm.roles.push(role);
      }
    } else {
      this.createUserForm.roles = this.createUserForm.roles.filter((r: string) => r !== role);
    }
  }

  submitCreateUser() {
    this.createUserFormTouched = true;
    // Prevent submit if invalid (frontend validation)
    if (!this.createUserForm.firstName || this.createUserForm.firstName.length < 2 || this.createUserForm.firstName.length > 50 ||
        !this.createUserForm.lastName || this.createUserForm.lastName.length < 2 || this.createUserForm.lastName.length > 50 ||
        !this.createUserForm.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.createUserForm.email) ||
        (this.createUserForm.phoneNumber && !/^\+?[0-9]{7,15}$/.test(this.createUserForm.phoneNumber)) ||
        !this.createUserForm.roles || !this.createUserForm.roles.length ||
        !this.createUserForm.redirectUrlAfterResetPassword) {
      this.createUserError = 'Please fill all required fields correctly.';
      this.createUserLoading = false;
      return;
    }
    this.createUserLoading = true;
    this.createUserError = '';
    this.createUserSuccess = '';
    console.log('Payload sent to backend:', this.createUserForm); // Debug: log payload
    this.userService.createUserByAdmin(this.createUserForm).subscribe({
      next: (res) => {
        if (res && res.code === 200) {
          // Prefer both Message and message (backend may use either)
          this.createUserSuccess = res.result?.Message || res.result?.message || 'User created successfully.';
        } else if (res && res.result) {
          // Display error(s) from backend
          if (Array.isArray(res.result)) {
            this.createUserError = res.result;
          } else if (typeof res.result === 'string') {
            this.createUserError = res.result;
          } else if (res.result.Message || res.result.message) {
            this.createUserError = res.result.Message || res.result.message;
          } else {
            this.createUserError = 'Failed to create user.';
          }
        } else {
          this.createUserError = 'Failed to create user.';
        }
        this.createUserLoading = false;
        // Only close modal and refresh if success
        if (this.createUserSuccess) {
          setTimeout(() => {
            (window as any).bootstrap.Modal.getOrCreateInstance(document.getElementById('createUserModal')).hide();
            this.fetchUsers();
          }, 1200);
        }
      },
      error: (err) => {
        // Try to extract error message(s) from backend
        if (err?.error?.result) {
          if (Array.isArray(err.error.result)) {
            this.createUserError = err.error.result;
          } else if (typeof err.error.result === 'string') {
            this.createUserError = err.error.result;
          } else if (err.error.result.Message || err.error.result.message) {
            this.createUserError = err.error.result.Message || err.error.result.message;
          } else {
            this.createUserError = 'Failed to create user.';
          }
        } else if (err?.error?.Message || err?.error?.message) {
          this.createUserError = err.error.Message || err.error.message;
        } else {
          this.createUserError = 'Failed to create user.';
        }
        this.createUserLoading = false;
      }
    });
  }

  get createUserErrorList(): string[] {
    if (Array.isArray(this.createUserError)) return this.createUserError;
    if (typeof this.createUserError === 'string' && this.createUserError) return [this.createUserError];
    return [];
  }
}
