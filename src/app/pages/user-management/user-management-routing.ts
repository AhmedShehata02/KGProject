// src/app/pages/user-management/user-management-routing.ts
import { Routes } from '@angular/router';
import { UsersListComponent } from './users-list/users-list.component';
import { UserEditComponent } from './user-edit/user-edit.component';

export const userManagementRoutes: Routes = [
  { path: '', component: UsersListComponent },
  { path: 'edit/:id', component: UserEditComponent },
];
