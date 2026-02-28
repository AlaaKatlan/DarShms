import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AlertService } from '../../../core/services/alert.service';
import { Author } from '../../../shared/models/book.model';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
    selector: 'app-authors-management',
    standalone: true,
    imports: [CommonModule, LoaderComponent],
    template: `
    <app-loader [show]="loading"></app-loader>
    
    <div class="admin-page">
      <div class="page-header flex-between">
        <div>
          <h1>إدارة المؤلفين</h1>
          <p>أضف أو عدل بيانات المؤلفين</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <i>+</i> إضافة مؤلف جديد
        </button>
      </div>
      
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>الرقم</th>
              <th>الاسم</th>
              <th>النبذة</th>
              <th>تاريخ الإضافة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let author of authors; let i = index">
              <td>{{ i + 1 }}</td>
              <td><strong>{{ author.name }}</strong></td>
              <td class="text-truncate" style="max-width: 300px;">{{ author.biography || 'لا توجد نبذة' }}</td>
              <td>{{ author.created_at | date:'dd/MM/yyyy' }}</td>
              <td class="actions-cell">
                <button (click)="openEditModal(author)" class="btn-icon edit" title="تعديل">✏️</button>
                <button (click)="deleteAuthor(author.id)" class="btn-icon delete" title="حذف">🗑️</button>
              </td>
            </tr>
            <tr *ngIf="authors.length === 0">
              <td colspan="5" class="text-center">لا يوجد مؤلفون مضافون بعد</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
    styleUrls: ['../books/books-management.component.scss']
})
export class AuthorsManagementComponent implements OnInit {
    authors: Author[] = [];
    loading = true;

    constructor(
        private supabase: SupabaseService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.loadAuthors();
    }

    async loadAuthors() {
        this.loading = true;
        try {
            const { data, error } = await this.supabase.client
                .from('authors')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.authors = data as unknown as Author[] || [];
        } catch (error) {
            this.alertService.show('error', 'حدث خطأ أثناء تحميل المؤلفين');
        } finally {
            this.loading = false;
        }
    }

    openAddModal() {
        this.alertService.show('info', 'سيتم فتح نافذة إضافة مؤلف هنا');
    }

    openEditModal(author: Author) {
        this.alertService.show('info', 'سيتم فتح نافذة تعديل المؤلف هنا');
    }

    async deleteAuthor(id: string) {
        if (!confirm('هل أنت متأكد من حذف هذا المؤلف؟')) return;

        this.loading = true;
        try {
            // Check if author has books before deleting (foreign key constraint)
            const { data: books, error: checkError } = await this.supabase.client
                .from('books')
                .select('id')
                .eq('author_id', id)
                .limit(1);

            if (books && books.length > 0) {
                this.alertService.show('warning', 'لا يمكن حذف المؤلف لوجود كتب مرتبطة به');
                this.loading = false;
                return;
            }

            const { error } = await this.supabase.client
                .from('authors')
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.alertService.show('success', 'تم حذف المؤلف بنجاح');
            this.authors = this.authors.filter(a => a.id !== id);
        } catch (error: any) {
            this.alertService.show('error', error.message || 'حدث خطأ أثناء الحذف');
        } finally {
            this.loading = false;
        }
    }
}
