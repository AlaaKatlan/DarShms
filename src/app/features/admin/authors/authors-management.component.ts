import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AlertService } from '../../../core/services/alert.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
    selector: 'app-authors-management',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent],
    template: `
    <app-loader [show]="loading"></app-loader>
    <div class="authors-page">

      <!-- HEADER -->
      <div class="authors-header">
        <div class="header-text">
          <div class="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
          </div>
          <div>
            <h1>كُتّابنا المبدعون</h1>
            <p>{{ authors.length }} كاتب وكاتبة يثرون عالم الأدب</p>
          </div>
        </div>
        <button class="add-btn" (click)="openForm()">
          <span class="add-icon">+</span>
          إضافة كاتب
        </button>
      </div>

      <!-- STATS ROW -->
      <div class="stats-row">
        <div class="mini-stat">
          <div class="mini-stat-icon gold">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div><strong>{{ authors.length }}</strong><span>مؤلف</span></div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon teal">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>
          </div>
          <div><strong>{{ totalBooks }}</strong><span>كتاب</span></div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div><strong>{{ activeCount }}</strong><span>نشط</span></div>
        </div>
      </div>

      <!-- AUTHORS GRID -->
      <div class="authors-grid">
        <div class="author-card" *ngFor="let author of authors; let i = index"
             [style.animation-delay]="(i * 60) + 'ms'">
          <!-- Decorative blob -->
          <div class="card-blob" [class]="'blob-' + (i % 4)"></div>

          <!-- Photo -->
          <div class="author-avatar" [class]="'ring-' + (i % 4)">
            <img [src]="author.photo_url || 'assets/images/author-placeholder.svg'" [alt]="author.name" loading="lazy">
            <div class="avatar-status" [class.active]="author.is_active"></div>
          </div>

          <!-- Info -->
          <h3 class="author-name">{{ author.name }}</h3>
          <p class="author-bio">{{ author.bio || 'كاتب/ة في دار شمس' }}</p>

          <!-- Books count badge -->
          <div class="books-badge" *ngIf="author.books_count > 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            {{ author.books_count }} كتاب
          </div>

          <!-- Actions -->
          <div class="card-actions">
            <button class="action-btn edit" (click)="openForm(author); $event.stopPropagation()" title="تعديل">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
            </button>
            <button class="action-btn delete" (click)="deleteAuthor(author); $event.stopPropagation()" title="حذف">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>

          <!-- Date -->
          <div class="card-date">{{ author.created_at | date:'MMM yyyy' }}</div>
        </div>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="authors.length === 0 && !loading">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3>لا يوجد مؤلفون بعد</h3>
          <p>ابدأ بإضافة أول كاتب</p>
          <button class="add-btn small" (click)="openForm()">
            <span class="add-icon">+</span> إضافة كاتب
          </button>
        </div>
      </div>

      <!-- ═══ MODAL ═══ -->
      <div class="modal-backdrop" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <!-- Modal header with color accent -->
          <div class="modal-top">
            <div class="modal-top-deco"></div>
            <button class="close-btn" (click)="closeForm()">&times;</button>

            <!-- Photo upload -->
            <div class="photo-ring" (click)="photoInput.click()">
              <img *ngIf="photoPreview || form.photo_url" [src]="photoPreview || form.photo_url" alt="">
              <div class="photo-empty" *ngIf="!photoPreview && !form.photo_url">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </div>
              <div class="photo-hover">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </div>
            </div>
            <input #photoInput type="file" accept="image/*" (change)="onPhotoSelected($event)" style="display:none">
            <h2>{{ editing ? 'تعديل ' + form.name : 'كاتب جديد' }}</h2>
          </div>

          <div class="modal-form">
            <div class="field-row">
              <div class="field">
                <label>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  اسم المؤلف *
                </label>
                <input type="text" [(ngModel)]="form.name" placeholder="أدخل اسم المؤلف" class="input-styled">
              </div>
              <div class="field" style="max-width:180px">
                <label>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Slug
                </label>
                <input type="text" [(ngModel)]="form.slug" placeholder="author-slug" dir="ltr" class="input-styled">
              </div>
            </div>

            <div class="field">
              <label>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                النبذة
              </label>
              <textarea [(ngModel)]="form.bio" placeholder="نبذة مختصرة عن المؤلف..." rows="4" class="input-styled"></textarea>
            </div>

            <label class="toggle-row">
              <div class="toggle-switch" [class.on]="form.is_active" (click)="form.is_active = !form.is_active">
                <div class="toggle-knob"></div>
              </div>
              <span>نشط ومرئي في المتجر</span>
            </label>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeForm()">إلغاء</button>
            <button class="btn-save" (click)="saveAuthor()" [disabled]="saving || !form.name">
              <svg *ngIf="!saving" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {{ saving ? 'جاري الحفظ...' : (editing ? 'حفظ التعديلات' : 'إضافة المؤلف') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['./authors-management.component.scss']
})
export class AuthorsManagementComponent implements OnInit {
    authors: any[] = [];
    loading = true;
    saving = false;
    showForm = false;
    editing: any = null;
    form: any = {};
    photoFile: File | null = null;
    photoPreview: string | null = null;

    constructor(private supabase: SupabaseService, private alert: AlertService) {}

    ngOnInit() { this.loadAuthors(); }

    get totalBooks(): number {
        return this.authors.reduce((sum, a) => sum + (a.books_count || 0), 0);
    }

    get activeCount(): number {
        return this.authors.filter(a => a.is_active).length;
    }

    async loadAuthors() {
        this.loading = true;
        try {
            const { data, error } = await this.supabase.client
                .from('authors').select('*, books:books(count)').order('created_at', { ascending: false });
            if (error) throw error;
            this.authors = (data || []).map((a: any) => ({
                ...a, books_count: a.books?.[0]?.count || 0
            }));
        } catch (e: any) {
            this.alert.show('error', e.message || 'خطأ');
        } finally { this.loading = false; }
    }

    openForm(author?: any) {
        this.editing = author || null;
        if (author) {
            this.form = { name: author.name, slug: author.slug, bio: author.bio || '', photo_url: author.photo_url || '', is_active: author.is_active };
        } else {
            this.form = { name: '', slug: '', bio: '', photo_url: '', is_active: true };
        }
        this.photoPreview = null; this.photoFile = null;
        this.showForm = true;
    }

    closeForm() { this.showForm = false; this.editing = null; }

    onPhotoSelected(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;
        this.photoFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => this.photoPreview = e.target.result;
        reader.readAsDataURL(file);
    }

    async saveAuthor() {
        if (!this.form.name) return;
        this.saving = true;
        try {
            let photoUrl = this.form.photo_url;
            if (this.photoFile) {
                const ext = this.photoFile.name.split('.').pop();
                const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
                const { url, error } = await this.supabase.uploadFile('author-photos', path, this.photoFile);
                if (error) throw new Error('فشل رفع الصورة: ' + (error.message || JSON.stringify(error)));
                photoUrl = url;
            }
            const slug = this.form.slug || this.form.name.trim().toLowerCase().replace(/[\s]+/g, '-').substring(0, 60);
            const data: any = { name: this.form.name, slug, bio: this.form.bio || null, photo_url: photoUrl || null, is_active: this.form.is_active !== false };

            if (this.editing) {
                const { error } = await this.supabase.client.from('authors').update(data).eq('id', this.editing.id);
                if (error) throw error;
                this.alert.show('success', 'تم تحديث المؤلف');
            } else {
                const { error } = await this.supabase.client.from('authors').insert(data);
                if (error) throw error;
                this.alert.show('success', 'تم إضافة المؤلف');
            }
            this.closeForm(); this.loadAuthors();
        } catch (e: any) { this.alert.show('error', e.message || 'خطأ'); }
        finally { this.saving = false; }
    }

    async deleteAuthor(author: any) {
        if (!confirm(`حذف "${author.name}"؟`)) return;
        this.loading = true;
        try {
            const { data: books } = await this.supabase.client.from('books').select('id').eq('author_id', author.id).limit(1);
            if (books && books.length > 0) { this.alert.show('warning', 'لا يمكن حذف المؤلف — هناك كتب مرتبطة به'); this.loading = false; return; }
            const { error } = await this.supabase.client.from('authors').delete().eq('id', author.id);
            if (error) throw error;
            this.alert.show('success', 'تم الحذف');
            this.authors = this.authors.filter(a => a.id !== author.id);
        } catch (e: any) { this.alert.show('error', e.message || 'خطأ'); }
        finally { this.loading = false; }
    }
}
