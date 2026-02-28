import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AlertService } from '../../../core/services/alert.service';
import { Order } from '../../../shared/models/order.model';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CurrencyFormatPipe, LoaderComponent],
  template: `
    <app-loader [show]="loading"></app-loader>
    
    <div class="admin-page">
      <div class="page-header">
        <h1>إدارة الطلبات</h1>
        <p>متابعة وتحديث حالات طلبات العملاء</p>
      </div>
      
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>العميل</th>
              <th>التاريخ</th>
              <th>المبلغ</th>
              <th>العنوان</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders">
              <td><strong>#{{ order.id.substring(0,8) }}</strong></td>
              <td>{{ order.guest_name || 'عميل مسجل' }}<br><small class="text-secondary">{{ order.guest_phone || '' }}</small></td>
              <td>{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ order.total_amount | currencyFormat }}</td>
              <td class="text-truncate" style="max-width: 200px;" [title]="order.shipping_address">{{ order.shipping_address }}</td>
              <td>
                <select [ngModel]="order.status" (ngModelChange)="updateStatus(order.id, $event)" class="status-select" [ngClass]="order.status">
                  <option value="pending">قيد الانتظار</option>
                  <option value="processing">جاري التجهيز</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </td>
              <td class="actions-cell">
                <a [routerLink]="['/admin/orders', order.id]" class="btn-action view">تفاصيل</a>
              </td>
            </tr>
            <tr *ngIf="orders.length === 0">
              <td colspan="7" class="text-center">لا توجد طلبات حتى الآن</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styleUrls: ['../books/books-management.component.scss']
})
export class OrdersManagementComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  constructor(
    private supabase: SupabaseService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    this.loading = true;
    try {
      const { data, error } = await this.supabase.client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.orders = data as unknown as Order[] || [];
    } catch (error) {
      this.alertService.show('error', 'حدث خطأ أثناء تحميل الطلبات');
    } finally {
      this.loading = false;
    }
  }

  async updateStatus(id: string, newStatus: string) {
    this.loading = true;
    try {
      const { error } = await this.supabase.client
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      this.alertService.show('success', 'تم تحديث حالة الطلب');
      const order = this.orders.find(o => o.id === id);
      if (order) order.status = newStatus as any;

    } catch (error) {
      this.alertService.show('error', 'تعذر تحديث الحالة');
    } finally {
      this.loading = false;
    }
  }
}
