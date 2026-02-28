import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="admin-wrapper">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>دار شمس</h2>
          <span class="badge">لوحة التحكم</span>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <i>📊</i> الرئيسة
          </a>
          <a routerLink="/admin/orders" routerLinkActive="active">
            <i>📦</i> الطلبات
          </a>
          <a routerLink="/admin/books" routerLinkActive="active">
            <i>📚</i> الكتب
          </a>
          <a routerLink="/admin/authors" routerLinkActive="active">
            <i>✍️</i> المؤلفون
          </a>
          <a routerLink="/admin/customers" routerLinkActive="active">
            <i>👥</i> العملاء
          </a>
          <a routerLink="/admin/reports" routerLinkActive="active">
            <i>📈</i> التقارير
          </a>
          <a routerLink="/admin/settings" routerLinkActive="active">
            <i>⚙️</i> الإعدادات
          </a>
        </nav>
        
        <div class="sidebar-footer">
          <button (click)="logout()" class="btn-logout">
            <i>🚪</i> تسجيل الخروج
          </button>
        </div>
      </aside>
      
      <main class="admin-content">
        <header class="topbar">
          <div class="user-info">
            مرحباً، {{ (authService.currentUser$ | async)?.user_metadata?.['full_name'] || 'المدير' }}
          </div>
          <a routerLink="/" class="back-tostore">العودة للمتجر</a>
        </header>
        
        <div class="content-body">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
    styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
    constructor(
        public authService: AuthService,
        private router: Router
    ) { }

    async logout() {
        await this.authService.signOut();
        this.router.navigate(['/login']);
    }
}
