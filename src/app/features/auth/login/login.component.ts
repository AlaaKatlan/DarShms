import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LoaderComponent],
    template: `
    <app-loader [show]="loading"></app-loader>
    <div class="auth-container">
      <div class="auth-box">
        <div class="auth-header">
          <h1>تسجيل الدخول</h1>
          <p>مرحباً بك مجدداً في دار شمس</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="name@example.com">
          </div>
          
          <div class="form-group">
            <label>كلمة المرور</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••">
          </div>
          
          <button type="submit" class="btn-primary w-100" [disabled]="!loginForm.form.valid || loading">
            دخول
          </button>
        </form>
        
        <div class="auth-footer">
          <p>ليس لديك حساب؟ <a routerLink="/register">سجل الآن</a></p>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
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
            const { error } = await this.authService.signIn(this.email, this.password);
            if (error) throw error;

            this.alertService.show('success', 'تم تسجيل الدخول بنجاح');
            this.router.navigate(['/']); // Or redirect to intended URL
        } catch (error: any) {
            console.error('Login error', error);
            this.alertService.show('error', error.message || 'بيانات الدخول غير صحيحة');
        } finally {
            this.loading = false;
        }
    }
}
