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
    <div class="admin-page">

      <div class="page-header-row">
        <div>
          <h1>إدارة المؤلفين</h1>
          <p class="page-sub">إضافة وتعديل بيانات المؤلفين وصورهم</p>
        </div>
        <button class="btn btn-gold" (click)="openForm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          إضافة مؤلف
        </button>
      </div>

      <!-- AUTHORS GRID -->
      <div class="authors-grid">
        <div class="author-card" *ngFor="let author of authors">
          <div class="author-photo">
            <img [src]="author.photo_url || 'assets/images/author-placeholder.svg'" [alt]="author.name">
          </div>
          <div class="author-info">
            <h3>{{ author.name }}</h3>
            <p class="author-bio">{{ author.bio || 'لا توجد نبذة' }}</p>
            <div class="author-meta">
              <span class="books-count" *ngIf="author.books_count !== undefined">{{ author.books_count }} كتاب</span>
              <span class="date-added">{{ author.created_at | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>
          <div class="author-actions">
            <button class="btn-sm btn-edit" (click)="openForm(author)" title="تعديل">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
            </button>
            <button class="btn-sm btn-delete" (click)="deleteAuthor(author)" title="حذف">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="empty-card" *ngIf="authors.length === 0 && !loading">لا يوجد مؤلفون</div>
      </div>

      <!-- MODAL -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editing ? 'تعديل المؤلف' : 'إضافة مؤلف جديد' }}</h2>
            <button class="modal-close" (click)="closeForm()">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Photo upload -->
            <div class="photo-upload" (click)="photoInput.click()">
              <img *ngIf="photoPreview || form.photo_url" [src]="photoPreview || form.photo_url" alt="صورة">
              <div class="photo-placeholder" *ngIf="!photoPreview && !form.photo_url">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>رفع صورة</span>
              </div>
            </div>
            <input #photoInput type="file" accept="image/*" (change)="onPhotoSelected($event)" style="display:none">

            <div class="form-row">
              <div class="form-group flex-1">
                <label>اسم المؤلف *</label>
                <input type="text" [(ngModel)]="form.name" placeholder="أدخل اسم المؤلف">
              </div>
              <div class="form-group" style="width:200px">
                <label>الرابط (slug)</label>
                <input type="text" [(ngModel)]="form.slug" placeholder="author-slug" dir="ltr">
              </div>
            </div>

            <div class="form-group">
              <label>النبذة</label>
              <textarea [(ngModel)]="form.bio" placeholder="نبذة مختصرة عن المؤلف" rows="4"></textarea>
            </div>

            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="form.is_active"> نشط
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeForm()">إلغاء</button>
            <button class="btn btn-gold" (click)="saveAuthor()" [disabled]="saving || !form.name">
              {{ saving ? 'جاري الحفظ...' : (editing ? 'حفظ التعديلات' : 'إضافة المؤلف') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['../books/books-management.component.scss', './authors-management.component.scss']
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
                const path = `${Date.now()}.${ext}`;
                const { url, error } = await this.supabase.uploadFile('author-photos', path, this.photoFile);
                if (error) throw new Error('فشل رفع الصورة');
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
