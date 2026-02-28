import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, CurrencyFormatPipe],
    template: `
    <div class="dashboard">
      <div class="page-header">
        <h1>لوحة القيادة</h1>
        <p>نظرة عامة على أداء المتجر</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--orange-light,#FDF0E0);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F2994A" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          </div>
          <div class="stat-details">
            <h3>الطلبات الجديدة</h3>
            <p class="stat-value">{{ stats.newOrders }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--teal-light,#E0F7F4);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2DBDAD" stroke-width="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="stat-details">
            <h3>المبيعات (هذا الشهر)</h3>
            <p class="stat-value">{{ stats.monthlySales | currencyFormat }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--gold-light,#FFF8DC);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5C518" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>
          </div>
          <div class="stat-details">
            <h3>إجمالي الكتب</h3>
            <p class="stat-value">{{ stats.totalBooks }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--purple-light,#F3EAFC);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9B51E0" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-details">
            <h3>العملاء</h3>
            <p class="stat-value">{{ stats.totalCustomers }}</p>
          </div>
        </div>
      </div>

      <div class="recent-activity">
        <h2>أحدث الطلبات</h2>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr><th>رقم الطلب</th><th>العميل</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of recentOrders">
                <td>#{{ order.id.substring(0,8) }}</td>
                <td>{{ getCustomerName(order) }}</td>
                <td>{{ order.created_at | date:'dd/MM/yyyy' }}</td>
                <td>{{ order.total_amount | currencyFormat }}</td>
                <td><span class="status-badge" [ngClass]="order.status">{{ getStatusLabel(order.status) }}</span></td>
                <td><a [routerLink]="['/admin/orders', order.id]" class="btn-action view">عرض</a></td>
              </tr>
              <tr *ngIf="recentOrders.length === 0"><td colspan="6" class="text-center">لا توجد طلبات حديثة</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    stats = { newOrders: 0, monthlySales: 0, totalBooks: 0, totalCustomers: 0 };
    recentOrders: any[] = [];

    statusLabels: Record<string, string> = {
        pending: 'قيد الانتظار',
        processing: 'قيد المعالجة',
        shipped: 'تم الشحن',
        delivered: 'تم التوصيل',
        cancelled: 'ملغي',
        returned: 'مرتجع',
    };

    constructor(private supabase: SupabaseService) {}

    ngOnInit() { this.loadDashboardData(); }

    getStatusLabel(status: string): string {
        return this.statusLabels[status] || status;
    }

    getCustomerName(order: any): string {
        // guest_info is JSONB: { full_name, phone, email? }
        if (order.guest_info?.full_name) return order.guest_info.full_name;
        return 'عميل مسجل';
    }

    async loadDashboardData() {
        try {
            // Recent orders
            const { data: orders } = await this.supabase.client
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (orders) {
                this.recentOrders = orders;
                this.stats.newOrders = orders.filter((o: any) => o.status === 'pending').length;
                this.stats.monthlySales = orders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
            }

            // Books count
            const { count: booksCount } = await this.supabase.client
                .from('books')
                .select('*', { count: 'exact', head: true });
            this.stats.totalBooks = booksCount || 0;

            // Customers count
            const { count: customersCount } = await this.supabase.client
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'customer');
            this.stats.totalCustomers = customersCount || 0;

        } catch (err) {
            console.error('Dashboard error:', err);
        }
    }
}
