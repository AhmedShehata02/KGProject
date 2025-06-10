import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  usersOpen = false;
  settingsOpen = false;
  dashboardOpen = false;
  systemOpen = false;

  constructor(public auth: AuthService) {}

  hasRole(role: string): boolean {
    return this.auth.hasRole(role);
  }
}
