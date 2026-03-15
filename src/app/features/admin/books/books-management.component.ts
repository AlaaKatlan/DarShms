import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AlertService } from '../../../core/services/alert.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-books-management',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyFormatPipe, LoaderComponent],
  template: `
    <app-loader [show]="loading"></app-loader>
    <div class="admin-page">

      <div class="page-header-row">
        <div>
          <h1>إدارة الكتب</h1>
          <p class="page-sub">إضافة، تعديل وحذف الكتب ورفع الأغلفة</p>
        </div>
        <button class="btn btn-gold" (click)="openForm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          إضافة كتاب
        </button>
      </div>

      <div class="search-bar">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" placeholder="ابحث عن كتاب..." [(ngModel)]="searchTerm" (input)="filterBooks()">
      </div>

      <div class="table-card">
        <table class="admin-table">
          <thead>
            <tr>
              <th style="width:70px">الغلاف</th>
              <th>العنوان</th>
              <th>المؤلف</th>
              <th>السعر</th>
              <th>الخصم</th>
              <th>المخزون</th>
              <th>الفئة</th>
              <th>مميز</th>
              <th>نشط</th>
              <th style="width:120px">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let book of filteredBooks">
              <td>
                <img [src]="book.cover_url || 'assets/images/book-placeholder.svg'" class="table-cover" [alt]="book.title">
              </td>
              <td><strong>{{ book.title }}</strong><br><small class="text-muted">{{ book.slug }}</small></td>
              <td>{{ book.author?.name || '-' }}</td>
              <td>{{ book.price | currencyFormat }}</td>
              <td>{{ book.discount_price ? (book.discount_price | currencyFormat) : '-' }}</td>
              <td><span class="stock-pill" [class.out]="book.stock === 0" [class.low]="book.stock > 0 && book.stock <= 5">{{ book.stock }}</span></td>
              <td><span class="age-pill" *ngIf="book.age_group">{{ book.age_group }}</span></td>
              <td><span class="toggle-dot" [class.on]="book.is_featured" (click)="toggleFeatured(book)"></span></td>
              <td><span class="toggle-dot" [class.on]="book.is_active" (click)="toggleActive(book)"></span></td>
              <td>
                <div class="actions-row">
                  <button class="btn-sm btn-edit" (click)="openForm(book)" title="تعديل">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
                  </button>
                  <button class="btn-sm btn-delete" (click)="deleteBook(book)" title="حذف">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredBooks.length === 0">
              <td colspan="10" class="empty-row">لا توجد كتب</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingBook ? 'تعديل الكتاب' : 'إضافة كتاب جديد' }}</h2>
            <button class="modal-close" (click)="closeForm()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="cover-upload-section">
              <div class="cover-preview" (click)="coverInput.click()">
                <img *ngIf="coverPreview || form.cover_url" [src]="coverPreview || form.cover_url" alt="غلاف">
                <div class="cover-placeholder" *ngIf="!coverPreview && !form.cover_url">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  <span>اضغط لرفع الغلاف</span>
                </div>
                <div class="cover-overlay" *ngIf="coverPreview || form.cover_url">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  تغيير الغلاف
                </div>
              </div>
              <input #coverInput type="file" accept="image/*" (change)="onCoverSelected($event)" style="display:none">
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>عنوان الكتاب *</label>
                <input type="text" [(ngModel)]="form.title" placeholder="أدخل عنوان الكتاب" required>
              </div>
              <div class="form-group" style="width:200px">
                <label>الرابط (slug)</label>
                <input type="text" [(ngModel)]="form.slug" placeholder="book-slug" dir="ltr">
              </div>
            </div>
<div class="form-row">
              <div class="form-group flex-1">
                <label>ISBN (الرقم المعياري الدولي)</label>
                <input type="text" [(ngModel)]="form.isbn" placeholder="مثال: 978-3-16-148410-0" dir="ltr">
              </div>
              <div class="form-group" style="width:150px">
                <label>سنة النشر</label>
                <input type="number" [(ngModel)]="form.publication_year" placeholder="مثال: 2024" min="1900" max="2099">
              </div>
            </div>
            <div class="form-group">
              <label>الوصف</label>
              <textarea [(ngModel)]="form.description" placeholder="وصف مختصر للكتاب" rows="3"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>السعر (ر.س) *</label>
                <input type="number" [(ngModel)]="form.price" min="0" step="0.5">
              </div>
              <div class="form-group">
                <label>سعر الخصم</label>
                <input type="number" [(ngModel)]="form.discount_price" min="0" step="0.5" placeholder="اتركه فارغاً">
              </div>
              <div class="form-group">
                <label>المخزون *</label>
                <input type="number" [(ngModel)]="form.stock" min="0">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>المؤلف</label>
                <select [(ngModel)]="form.author_id">
                  <option value="">بدون مؤلف</option>
                  <option *ngFor="let a of authors" [value]="a.id">{{ a.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>الفئة العمرية</label>
                <select [(ngModel)]="form.age_group">
                  <option value="">غير محدد</option>
                  <option value="3-6">3-6 سنوات</option>
                  <option value="6-9">6-9 سنوات</option>
                  <option value="7-12">7-12 سنوات</option>
                  <option value="youth">يافعين</option>
                  <option value="adults">كبار</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="form.is_featured"> كتاب مميز
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="form.is_active"> نشط (مرئي بالمتجر)
              </label>
            </div>

            <div class="form-group">
              <label>ملف الكتاب (PDF) - اختياري</label>
              <div class="file-upload-row">
                <input #bookFileInput type="file" accept=".pdf" (change)="onBookFileSelected($event)" style="display:none">
                <button class="btn btn-outline btn-file" (click)="bookFileInput.click()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                  {{ bookFileName || 'اختر ملف PDF' }}
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeForm()">إلغاء</button>
            <button class="btn btn-gold" (click)="saveBook()" [disabled]="saving || !form.title || !form.price">
              {{ saving ? 'جاري الحفظ...' : (editingBook ? 'حفظ التعديلات' : 'إضافة الكتاب') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./books-management.component.scss']
})
export class BooksManagementComponent implements OnInit {
  @ViewChild('coverInput') coverInputRef!: ElementRef;
  @ViewChild('bookFileInput') bookFileInputRef!: ElementRef;

  books: any[] = [];
  filteredBooks: any[] = [];
  authors: any[] = [];
  loading = true;
  saving = false;
  searchTerm = '';

  showForm = false;
  editingBook: any = null;
  form: any = {};
  coverFile: File | null = null;
  coverPreview: string | null = null;
  bookFile: File | null = null;
  bookFileName = '';

  constructor(
    private supabase: SupabaseService,
    private alert: AlertService,
    private cdr: ChangeDetectorRef // 💡 تحديث الواجهة يدوياً
  ) {}

  ngOnInit() {
    this.loadBooks();
    this.loadAuthors();
  }

  async loadBooks() {
    this.loading = true;
    try {
      const { data, error } = await this.supabase.client
        .from('books')
        .select('*, author:authors(id, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      this.books = data || [];
      this.filterBooks();
    } catch (e: any) {
      this.alert.show('error', e.message || 'خطأ في تحميل الكتب');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadAuthors() {
    const { data } = await this.supabase.client.from('authors').select('id, name').order('name');
    this.authors = data || [];
    this.cdr.detectChanges();
  }

  filterBooks() {
    if (!this.searchTerm) { this.filteredBooks = this.books; return; }
    const q = this.searchTerm.toLowerCase();
    this.filteredBooks = this.books.filter(b =>
      b.title?.toLowerCase().includes(q) || b.author?.name?.toLowerCase().includes(q)
    );
  }

  resetForm() {
 this.form = {
      title: '', slug: '', description: '', price: 0, discount_price: null,
      stock: 0, age_group: '', author_id: '', is_featured: false, is_active: true, cover_url: '',
      isbn: '', publication_year: null // 💡 الحقول الجديدة
    };
    this.coverFile = null;
    this.coverPreview = null;
    this.bookFile = null;
    this.bookFileName = '';

    // 💡 تنظيف حقول إدخال الملفات لكي لا تعلق عند رفع ملف بنفس الاسم
    if (this.coverInputRef) this.coverInputRef.nativeElement.value = '';
    if (this.bookFileInputRef) this.bookFileInputRef.nativeElement.value = '';
  }

 openForm(book?: any) {
    this.editingBook = book || null;
    if (book) {
      this.form = {
        title: book.title, slug: book.slug, description: book.description || '',
        price: book.price, discount_price: book.discount_price,
        stock: book.stock, age_group: book.age_group || '',
        author_id: book.author_id || '', is_featured: book.is_featured,
        is_active: book.is_active, cover_url: book.cover_url || '',
        isbn: book.isbn || '', // 💡 جلب الـ ISBN
        publication_year: book.publication_year || null // 💡 جلب سنة النشر
      };
    } else {
      this.resetForm();
    }
    this.coverPreview = null;
    this.coverFile = null;
    this.showForm = true;
    this.cdr.detectChanges();
  }

  closeForm() {
    this.showForm = false;
    this.editingBook = null;
    this.resetForm();
    this.cdr.detectChanges();
  }

  onCoverSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.coverFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.coverPreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  onBookFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.bookFile = file;
    this.bookFileName = file.name;
    this.cdr.detectChanges();
  }

  generateSlug(title: string): string {
    return title.trim().toLowerCase()
      .replace(/[\s]+/g, '-').replace(/[^\u0600-\u06FFa-z0-9\-]/g, '')
      .substring(0, 60) || 'book-' + Date.now();
  }

  async saveBook() {
    if (!this.form.title || this.form.price === undefined) return;

    this.saving = true;
    this.cdr.detectChanges();

    try {
      let coverUrl = this.form.cover_url;

      // Upload cover
      if (this.coverFile) {
        const ext = this.coverFile.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { url, error: uploadErr } = await this.supabase.uploadFile('book-covers', path, this.coverFile);
        if (uploadErr) throw new Error('فشل رفع الغلاف');
        coverUrl = url;
      }

      // Upload book PDF
      let previewPages = this.editingBook?.preview_pages || null;
      if (this.bookFile) {
        const ext = this.bookFile.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { url, error: uploadErr } = await this.supabase.uploadFile('book-previews', path, this.bookFile);
        if (uploadErr) throw new Error('فشل رفع الملف');
        previewPages = [url];
      }

      const slug = this.form.slug || this.generateSlug(this.form.title);

      const bookData: any = {
        title: this.form.title,
        slug,
        description: this.form.description || null,
        price: Number(this.form.price),
        discount_price: this.form.discount_price ? Number(this.form.discount_price) : null,
        stock: Number(this.form.stock) || 0,
        age_group: this.form.age_group || null,
        author_id: this.form.author_id || null,
        is_featured: this.form.is_featured || false,
        is_active: this.form.is_active !== false,
        cover_url: coverUrl || null,
        preview_pages: previewPages,
        isbn: this.form.isbn || null, // 💡 حفظ الـ ISBN
        publication_year: this.form.publication_year ? Number(this.form.publication_year) : null // 💡 حفظ السنة كرقم
      };

      if (this.editingBook) {
        const { error } = await this.supabase.client.from('books').update(bookData).eq('id', this.editingBook.id);
        if (error) throw error;
        this.alert.show('success', 'تم تحديث الكتاب بنجاح');
      } else {
        const { error } = await this.supabase.client.from('books').insert(bookData);
        if (error) throw error;
        this.alert.show('success', 'تم إضافة الكتاب بنجاح');
      }

      this.closeForm();
      await this.loadBooks();

    } catch (e: any) {
      this.alert.show('error', e.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      this.saving = false;
      this.cdr.detectChanges(); // 💡 إجبار Angular على إخفاء اللودر فوراً وتحديث النافذة!
    }
  }

  async deleteBook(book: any) {
    if (!confirm(`هل أنت متأكد من حذف "${book.title}"؟`)) return;
    this.loading = true;
    try {
      const { error } = await this.supabase.client.from('books').delete().eq('id', book.id);
      if (error) throw error;
      this.alert.show('success', 'تم حذف الكتاب');
      this.books = this.books.filter(b => b.id !== book.id);
      this.filterBooks();
    } catch (e: any) {
      this.alert.show('error', e.message || 'خطأ في الحذف');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async toggleFeatured(book: any) {
    const newVal = !book.is_featured;
    const { error } = await this.supabase.client.from('books').update({ is_featured: newVal }).eq('id', book.id);
    if (!error) { book.is_featured = newVal; this.cdr.detectChanges(); }
  }

  async toggleActive(book: any) {
    const newVal = !book.is_active;
    const { error } = await this.supabase.client.from('books').update({ is_active: newVal }).eq('id', book.id);
    if (!error) { book.is_active = newVal; this.cdr.detectChanges(); }
  }
}
