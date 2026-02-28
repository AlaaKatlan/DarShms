import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AlertService } from '../../../core/services/alert.service';
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
        <div><h1>إدارة الكتب</h1><p>إضافة، تعديل وحذف الكتب</p></div>
      </div>
      <div class="table-container">
        <table class="admin-table">
          <thead><tr><th>صورة</th><th>العنوان</th><th>المؤلف</th><th>السعر</th><th>المخزون</th><th>إجراءات</th></tr></thead>
          <tbody>
            <tr *ngFor="let book of books">
              <td><img [src]="book.cover_url || 'assets/images/book-placeholder.svg'" alt="cover" class="table-img"></td>
              <td>{{ book.title }}</td>
              <td>{{ book.author?.name || '-' }}</td>
              <td>{{ book.price | currencyFormat }}</td>
              <td><span class="stock-badge" [class.out]="book.stock === 0">{{ book.stock }}</span></td>
              <td class="actions-cell">
                <button (click)="deleteBook(book.id)" class="btn-icon delete" title="حذف">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </td>
            </tr>
            <tr *ngIf="books.length === 0"><td colspan="6" class="text-center">لا توجد كتب</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
    styleUrls: ['./books-management.component.scss']
})
export class BooksManagementComponent implements OnInit {
    books: any[] = [];
    loading = true;

    constructor(private supabase: SupabaseService, private alertService: AlertService) {}

    ngOnInit() { this.loadBooks(); }

    async loadBooks() {
        this.loading = true;
        try {
            const { data, error } = await this.supabase.client
                .from('books')
                .select('*, author:authors(name)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            this.books = data || [];
        } catch (error: any) {
            this.alertService.show('error', error.message || 'خطأ في تحميل الكتب');
        } finally { this.loading = false; }
    }

    async deleteBook(id: string) {
        if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;
        this.loading = true;
        try {
            const { error } = await this.supabase.client.from('books').delete().eq('id', id);
            if (error) throw error;
            this.alertService.show('success', 'تم حذف الكتاب');
            this.books = this.books.filter(b => b.id !== id);
        } catch (error: any) {
            this.alertService.show('error', error.message || 'خطأ في الحذف');
        } finally { this.loading = false; }
    }
}
