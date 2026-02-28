import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LoaderComponent],
    template: `
    <app-loader [show]="loading"></app-loader>
    <div class="auth-container">
      <div class="auth-box">
        <div class="auth-header">
          <h1>إنشاء حساب جديد</h1>
          <p>انضم إلى عائلة دار شمس</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label>الاسم الكامل</label>
            <input type="text" [(ngModel)]="fullName" name="fullName" required placeholder="أدخل اسمك الكامل">
          </div>
          
          <div class="form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="name@example.com">
          </div>
          
          <div class="form-group">
            <label>كلمة المرور</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" minlength="6">
          </div>
          
          <button type="submit" class="btn-primary w-100" [disabled]="!registerForm.form.valid || loading">
            تسجيل
          </button>
        </form>
        
        <div class="auth-footer">
          <p>لديك حساب بالفعل؟ <a routerLink="/login">تسجيل الدخول</a></p>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['../login/login.component.scss']
})
export class RegisterComponent {
    fullName = '';
    email = '';
    password = '';
    loading = false;

    constructor(
        private authService: AuthService,
        private alertService: AlertService,
        private router: Router
    ) { }

    async onSubmit() {
        this.loading = true;
        try {
            const { error } = await this.authService.signUp(this.email, this.password, this.fullName);
            if (error) throw error;

            this.alertService.show('success', 'تم إنشاء الحساب بنجاح. يرجى تسجيل الدخول.');
            this.router.navigate(['/login']);
        } catch (error: any) {
            console.error('Registration error', error);
            this.alertService.show('error', error.message || 'حدث خطأ أثناء إنشاء الحساب');
        } finally {
            this.loading = false;
        }
    }
}
