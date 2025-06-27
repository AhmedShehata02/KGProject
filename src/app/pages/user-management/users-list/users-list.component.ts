import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { RoleManagementService } from '../../../core/services/role-management.service';
import { UserManagementTranslator } from '../user-management-translator';
import { LanguageService } from '../../../shared/services/language.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
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
  totalCount = 0;
  editUserRoles: string[] = [];
  editUserClaims: string[] = [];
  editUserRolesLoading = false;
  editUserClaimsLoading = false;
  allRoles: string[] = [];
  allClaims: string[] = [];
  selectedUserRoles: string[] = [];
  selectedUserClaims: string[] = [];
  @ViewChild('editUserModal') editUserModal!: ElementRef;
  @ViewChild('createUserNgForm') createUserNgForm!: NgForm;
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
  searchInput: string = '';
  pageSizes = [10, 50, 100];
  sortBy: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    public userService: UserService,
    private roleService: RoleManagementService,
    private userManagementTranslator: UserManagementTranslator,
    private languageService: LanguageService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.userManagementTranslator.loadTranslations();
    this.languageService.translate.onLangChange.subscribe(() => {
      this.userManagementTranslator.loadTranslations();
    });
    this.fetchUsers();
    // Fetch all roles for create/edit user modals from RoleManagementService
    this.roleService.getAllRolesPaginated(1, 1000).subscribe({
      next: (res) => {
        if (res && res.code === 200 && res.status === 'Success') {
          this.createUserAllRoles = res.result.data.map((r: any) => r.name || r.Name || r.roleName || r.RoleName);
          this.allRoles = this.createUserAllRoles;
        } else {
          this.createUserAllRoles = [];
          this.allRoles = [];
        }
      },
      error: () => {
        this.createUserAllRoles = [];
        this.allRoles = [];
      }
    });
  }

  fetchUsers() {
    this.loading = true;
    this.userService.getAllUsersPaginated({
      page: this.currentPage,
      pageSize: this.pageSize,
      searchText: this.searchInput?.trim() || '',
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    }).subscribe({
      next: (res) => {
        if (res && res.code === 200 && res.status === 'Success') {
          this.users = res.result.data;
          this.totalCount = res.result.totalCount;
          this.totalPages = res.result.totalPages;
          this.currentPage = res.result.page;
          this.pagedUsers = this.users; // Already paged from backend
        } else {
          this.users = [];
          this.pagedUsers = [];
          this.totalCount = 0;
          this.totalPages = 1;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = this.userManagementTranslator.instant('USER_LIST.FAILED_LOAD');
        this.loading = false;
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.fetchUsers();
  }

  // Update page size
  onPageSizeChange(size?: number) {
    this.pageSize = size || this.pageSize;
    this.currentPage = 1;
    this.fetchUsers();
  }

  // Generate page array for pagination (with ellipsis if needed)
  getPageArray(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
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

  openEditUser(user: any) {
    this.selectedUser = { ...user };
    this.editUserRolesLoading = true;
    this.editUserClaimsLoading = true;
    this.selectedUserRoles = [];
    this.selectedUserClaims = [];
    // Use allRoles already fetched from RoleManagementService
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
    const payload = {
      Id: this.selectedUser.id,
      UserName: this.selectedUser.userName,
      Email: this.selectedUser.email
    };
    console.log('saveUser payload:', payload, 'id:', this.selectedUser.id);
    this.userService.updateUser(this.selectedUser.id, payload).subscribe({
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
    if (confirm(this.userManagementTranslator.instant('USER_LIST.CONFIRM_DELETE'))) {
      this.loading = true;
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.fetchUsers();
          this.loading = false;
        },
        error: (err) => {
          this.error = this.userManagementTranslator.instant('USER_LIST.FAILED_DELETE');
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
      this.createUserError = this.userManagementTranslator.instant('USER_LIST.CREATE_USER_VALIDATION');
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
          this.createUserSuccess = res.result?.Message || res.result?.message || this.userManagementTranslator.instant('USER_LIST.CREATED_SUCCESS');
          // Reset the create user form model after successful creation
          this.createUserForm = {
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            roles: [],
            redirectUrlAfterResetPassword: window.location.origin + '/reset-temporary-password'
          };
          this.createUserFormTouched = false;
          // Reset validation state of the form
          setTimeout(() => {
            if (this.createUserNgForm) {
              this.createUserNgForm.resetForm({
                firstName: '',
                lastName: '',
                email: '',
                phoneNumber: '',
                roles: [],
                redirectUrlAfterResetPassword: window.location.origin + '/reset-temporary-password'
              });
            }
          });
        } else if (res && res.result) {
          // Display error(s) from backend
          if (Array.isArray(res.result)) {
            this.createUserError = res.result;
          } else if (typeof res.result === 'string') {
            this.createUserError = res.result;
          } else if (res.result.Message || res.result.message) {
            this.createUserError = res.result.Message || res.result.message;
          } else {
            this.createUserError = this.userManagementTranslator.instant('USER_LIST.FAILED_CREATE');
          }
        } else {
          this.createUserError = this.userManagementTranslator.instant('USER_LIST.FAILED_CREATE');
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
            this.createUserError = this.userManagementTranslator.instant('USER_LIST.FAILED_CREATE');
          }
        } else if (err?.error?.Message || err?.error?.message) {
          this.createUserError = err.error.Message || err.error.message;
        } else {
          this.createUserError = this.userManagementTranslator.instant('USER_LIST.FAILED_CREATE');
        }
        this.createUserLoading = false;
      }
    });
  }

  onSearchClick() {
    this.currentPage = 1;
    this.fetchUsers();
  }

  onSortToggle(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.fetchUsers();
  }

  get createUserErrorList(): string[] {
    if (Array.isArray(this.createUserError)) return this.createUserError;
    if (typeof this.createUserError === 'string' && this.createUserError) return [this.createUserError];
    return [];
  }
}
