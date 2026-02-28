import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AlertService } from '../../../core/services/alert.service';
import { Book } from '../../../shared/models/book.model';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-books-management',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyFormatPipe, LoaderComponent],
  template: `
    <app-loader [show]="loading"></app-loader>
    
    <div class="admin-page">
      <div class="page-header flex-between">
        <div>
          <h1>إدارة الكتب</h1>
          <p>إضافة، تعديل وحذف الكتب في المتجر</p>
        </div>
        <a routerLink="/admin/books/new" class="btn-primary">
          <i>+</i> إضافة كتاب جديد
        </a>
      </div>
      
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>صورة</th>
              <th>عنوان الكتاب</th>
              <th>المؤلف</th>
              <th>السعر</th>
              <th>المخزون</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let book of books">
              <td>
                <img [src]="book.cover_image || './assets/images/book-placeholder.svg'" alt="cover" class="table-img">
              </td>
              <td>{{ book.title }}</td>
              <td>{{ book.author?.name }}</td>
              <td>{{ book.price | currencyFormat }}</td>
              <td>
                <span class="stock-badge" [class.out]="book.stock === 0">{{ book.stock }}</span>
              </td>
              <td class="actions-cell">
                <a [routerLink]="['/admin/books', book.id, 'edit']" class="btn-icon edit" title="تعديل">✏️</a>
                <button (click)="deleteBook(book.id)" class="btn-icon delete" title="حذف">🗑️</button>
              </td>
            </tr>
            <tr *ngIf="books.length === 0">
              <td colspan="6" class="text-center">لا توجد كتب مضافة بعد</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styleUrls: ['./books-management.component.scss']
})
export class BooksManagementComponent implements OnInit {
  books: Book[] = [];
  loading = true;

  constructor(
    private supabase: SupabaseService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.loadBooks();
  }

  async loadBooks() {
    this.loading = true;
    try {
      const { data, error } = await this.supabase.client
        .from('books')
        .select('*, author:authors(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.books = data as unknown as Book[] || [];
    } catch (error) {
      this.alertService.show('error', 'حدث خطأ أثناء تحميل الكتب');
    } finally {
      this.loading = false;
    }
  }

  async deleteBook(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;

    this.loading = true;
    try {
      const { error } = await this.supabase.client
        .from('books')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.alertService.show('success', 'تم حذف الكتاب بنجاح');
      this.books = this.books.filter(b => b.id !== id);
    } catch (error) {
      this.alertService.show('error', 'حدث خطأ أثناء الحذف');
    } finally {
      this.loading = false;
    }
  }
}
