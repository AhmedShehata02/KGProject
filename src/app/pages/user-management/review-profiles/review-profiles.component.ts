import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { environment } from '../../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-review-profiles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-profiles.component.html',
  styleUrl: './review-profiles.component.css'
})
export class ReviewProfilesComponent implements OnInit {
  profiles: any[] = [];
  loading = true;
  error: string = '';
  selectedProfile: any = null; // For modal view
  environment = environment;
  showRejectionModal = false;
  rejectionReasonInput = '';
  actionLoading = false;
  actionError = '';
  showProfileModal = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getAllUserProfiles().subscribe({
      next: (res) => {
        // Show all profiles (remove pendingApproval filter)
        this.profiles = res?.result || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load profiles.';
        this.loading = false;
      }
    });
  }

  openViewModal(profile: any) {
    this.selectedProfile = profile;
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  acceptProfile(profile: any) {
    this.actionLoading = true;
    this.actionError = '';
    this.userService.profileReviewByAdmin({
      UserId: profile.userId || profile.UserId || profile.id || profile.Id,
      IsApproved: true,
      RejectionReason: null
    }).subscribe({
      next: (res) => {
        this.actionLoading = false;
        // Remove the profile from the table after accepting
        const idx = this.profiles.findIndex(p => (p.userId || p.UserId || p.id || p.Id) === (profile.userId || profile.UserId || profile.id || profile.Id));
        if (idx > -1) {
          this.profiles.splice(idx, 1);
        }
        this.showProfileModal = false;
        this.actionError = '';
      },
      error: (err) => {
        this.actionLoading = false;
        // If the profile was actually accepted (removed from table), suppress the error
        const idx = this.profiles.findIndex(p => (p.userId || p.UserId || p.id || p.Id) === (profile.userId || profile.UserId || profile.id || profile.Id));
        if (idx === -1) {
          this.actionError = '';
        } else {
          this.actionError = err?.error?.result || 'Failed to approve profile.';
        }
      }
    });
  }

  openRejectModal() {
    this.rejectionReasonInput = '';
    this.showRejectionModal = true;
    this.actionError = '';
  }

  confirmRejectProfile() {
    if (!this.rejectionReasonInput.trim()) {
      this.actionError = 'Rejection reason is required.';
      return;
    }
    this.actionLoading = true;
    this.actionError = '';
    this.userService.profileReviewByAdmin({
      UserId: this.selectedProfile.userId || this.selectedProfile.UserId || this.selectedProfile.id || this.selectedProfile.Id,
      IsApproved: false,
      RejectionReason: this.rejectionReasonInput
    }).subscribe({
      next: (res) => {
        this.actionLoading = false;
        // Remove the profile from the table after rejection
        const idx = this.profiles.findIndex(p => (p.userId || p.UserId || p.id || p.Id) === (this.selectedProfile.userId || this.selectedProfile.UserId || this.selectedProfile.id || this.selectedProfile.Id));
        if (idx > -1) {
          this.profiles.splice(idx, 1);
        }
        this.showRejectionModal = false;
        this.actionError = '';
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err?.error?.result || 'Failed to reject profile.';
      }
    });
  }

  rejectProfile(profile: any) {
    this.showProfileModal = false;
    setTimeout(() => {
      this.openRejectModal();
    }, 300);
  }

  closeRejectionModal() {
    this.showRejectionModal = false;
    this.actionError = '';
  }
}
