import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AlertService } from '../../../core/services/alert.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
    selector: 'app-gallery-management',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent],
    template: `
    <app-loader [show]="loading"></app-loader>
    <div class="admin-page">

      <div class="page-header-row">
        <div>
          <h1>معرض الصور</h1>
          <p class="page-sub">إدارة صور ونشاطات دار شمس</p>
        </div>
        <button class="btn btn-gold" (click)="openForm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          إضافة صورة
        </button>
      </div>

      <!-- GALLERY GRID -->
      <div class="gallery-grid">
        <div class="gallery-card" *ngFor="let item of gallery; let i = index"
             [class.inactive]="!item.is_active"
             draggable="true" (dragstart)="dragStart(i)" (dragover)="dragOver($event, i)" (drop)="drop(i)">
          <div class="gallery-img">
            <img [src]="item.image_url" [alt]="item.title_ar || 'صورة'" loading="lazy">
            <div class="gallery-overlay">
              <button class="btn-sm btn-edit" (click)="openForm(item)" title="تعديل">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
              </button>
              <button class="btn-sm btn-delete" (click)="deleteItem(item)" title="حذف">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
            <span class="order-badge">{{ item.display_order }}</span>
          </div>
          <div class="gallery-caption">
            <strong>{{ item.title_ar || 'بدون عنوان' }}</strong>
            <small *ngIf="item.description_ar">{{ item.description_ar }}</small>
          </div>
        </div>

        <!-- Upload card -->
        <div class="gallery-card upload-card" (click)="multiInput.click()">
          <div class="upload-area">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span>رفع صور سريع</span>
            <small>اسحب أو اضغط لرفع عدة صور</small>
          </div>
          <input #multiInput type="file" accept="image/*" multiple (change)="quickUpload($event)" style="display:none">
        </div>
      </div>

      <!-- MODAL -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editing ? 'تعديل الصورة' : 'إضافة صورة جديدة' }}</h2>
            <button class="modal-close" (click)="closeForm()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="img-upload-area" (click)="imgInput.click()">
              <img *ngIf="imgPreview || form.image_url" [src]="imgPreview || form.image_url" alt="">
              <div class="img-placeholder" *ngIf="!imgPreview && !form.image_url">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <span>اضغط لاختيار صورة</span>
              </div>
            </div>
            <input #imgInput type="file" accept="image/*" (change)="onImageSelected($event)" style="display:none">

            <div class="form-row">
              <div class="form-group">
                <label>العنوان (عربي)</label>
                <input type="text" [(ngModel)]="form.title_ar" placeholder="عنوان الصورة">
              </div>
              <div class="form-group">
                <label>العنوان (إنجليزي)</label>
                <input type="text" [(ngModel)]="form.title_en" placeholder="Image title" dir="ltr">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>الوصف (عربي)</label>
                <textarea [(ngModel)]="form.description_ar" placeholder="وصف مختصر" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label>الوصف (إنجليزي)</label>
                <textarea [(ngModel)]="form.description_en" placeholder="Short description" rows="2" dir="ltr"></textarea>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="width:120px">
                <label>ترتيب العرض</label>
                <input type="number" [(ngModel)]="form.display_order" min="0">
              </div>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="form.is_active"> نشطة
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeForm()">إلغاء</button>
            <button class="btn btn-gold" (click)="saveItem()" [disabled]="saving">
              {{ saving ? 'جاري الحفظ...' : (editing ? 'حفظ التعديلات' : 'إضافة') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['../books/books-management.component.scss', './gallery-management.component.scss']
})
export class GalleryManagementComponent implements OnInit {
    gallery: any[] = [];
    loading = true;
    saving = false;
    showForm = false;
    editing: any = null;
    form: any = {};
    imgFile: File | null = null;
    imgPreview: string | null = null;
    dragIndex = -1;

    constructor(private supabase: SupabaseService, private alert: AlertService) {}

    ngOnInit() { this.loadGallery(); }

    async loadGallery() {
        this.loading = true;
        try {
            const { data, error } = await this.supabase.client
                .from('gallery').select('*').order('display_order', { ascending: true });
            if (error) throw error;
            this.gallery = data || [];
        } catch (e: any) { this.alert.show('error', e.message || 'خطأ'); }
        finally { this.loading = false; }
    }

    openForm(item?: any) {
        this.editing = item || null;
        if (item) {
            this.form = { title_ar: item.title_ar || '', title_en: item.title_en || '', description_ar: item.description_ar || '', description_en: item.description_en || '', display_order: item.display_order || 0, is_active: item.is_active, image_url: item.image_url };
        } else {
            this.form = { title_ar: '', title_en: '', description_ar: '', description_en: '', display_order: this.gallery.length, is_active: true, image_url: '' };
        }
        this.imgPreview = null; this.imgFile = null;
        this.showForm = true;
    }

    closeForm() { this.showForm = false; this.editing = null; }

    onImageSelected(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;
        this.imgFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => this.imgPreview = e.target.result;
        reader.readAsDataURL(file);
    }

    async uploadImage(file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { url, error } = await this.supabase.uploadFile('gallery-images', path, file);
        if (error || !url) throw new Error('فشل رفع الصورة');
        return url;
    }

    async saveItem() {
        this.saving = true;
        try {
            let imageUrl = this.form.image_url;
            if (this.imgFile) {
                imageUrl = await this.uploadImage(this.imgFile);
            }
            if (!imageUrl && !this.editing) { this.alert.show('warning', 'يرجى اختيار صورة'); this.saving = false; return; }

            const data: any = {
                title_ar: this.form.title_ar || null, title_en: this.form.title_en || null,
                description_ar: this.form.description_ar || null, description_en: this.form.description_en || null,
                display_order: Number(this.form.display_order) || 0, is_active: this.form.is_active !== false,
                image_url: imageUrl
            };

            if (this.editing) {
                const { error } = await this.supabase.client.from('gallery').update(data).eq('id', this.editing.id);
                if (error) throw error;
                this.alert.show('success', 'تم التحديث');
            } else {
                const { error } = await this.supabase.client.from('gallery').insert(data);
                if (error) throw error;
                this.alert.show('success', 'تمت الإضافة');
            }
            this.closeForm(); this.loadGallery();
        } catch (e: any) { this.alert.show('error', e.message || 'خطأ'); }
        finally { this.saving = false; }
    }

    async quickUpload(event: any) {
        const files: FileList = event.target.files;
        if (!files?.length) return;
        this.loading = true;
        let count = 0;
        for (let i = 0; i < files.length; i++) {
            try {
                const url = await this.uploadImage(files[i]);
                await this.supabase.client.from('gallery').insert({
                    image_url: url, display_order: this.gallery.length + i, is_active: true,
                    title_ar: files[i].name.replace(/\.[^/.]+$/, '')
                });
                count++;
            } catch (e) { console.error('Upload failed for', files[i].name, e); }
        }
        this.alert.show('success', `تم رفع ${count} صورة`);
        this.loadGallery();
        event.target.value = '';
    }

    async deleteItem(item: any) {
        if (!confirm('حذف هذه الصورة؟')) return;
        this.loading = true;
        try {
            const { error } = await this.supabase.client.from('gallery').delete().eq('id', item.id);
            if (error) throw error;
            this.gallery = this.gallery.filter(g => g.id !== item.id);
            this.alert.show('success', 'تم الحذف');
        } catch (e: any) { this.alert.show('error', e.message || 'خطأ'); }
        finally { this.loading = false; }
    }

    // Drag & drop reorder
    dragStart(index: number) { this.dragIndex = index; }
    dragOver(event: DragEvent, index: number) { event.preventDefault(); }
    async drop(index: number) {
        if (this.dragIndex === index) return;
        const moved = this.gallery.splice(this.dragIndex, 1)[0];
        this.gallery.splice(index, 0, moved);
        // Update display_order for all
        for (let i = 0; i < this.gallery.length; i++) {
            this.gallery[i].display_order = i;
            await this.supabase.client.from('gallery').update({ display_order: i }).eq('id', this.gallery[i].id);
        }
    }
}
