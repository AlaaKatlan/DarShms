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
          <div class="stat-icon">📦</div>
          <div class="stat-details">
            <h3>الطلبات الجديدة</h3>
            <p class="stat-value">{{ stats.newOrders }}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-details">
            <h3>المبيعات (هذا الشهر)</h3>
            <p class="stat-value">{{ stats.monthlySales | currencyFormat }}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-details">
            <h3>إجمالي الكتب</h3>
            <p class="stat-value">{{ stats.totalBooks }}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">👥</div>
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
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of recentOrders">
                <td>#{{ order.id.substring(0,8) }}</td>
                <td>{{ order.guest_name || 'عميل مسجل' }}</td>
                <td>{{ order.created_at | date:'dd/MM/yyyy' }}</td>
                <td>{{ order.total_amount | currencyFormat }}</td>
                <td><span class="status-badge" [ngClass]="order.status">{{ order.status }}</span></td>
                <td>
                  <a [routerLink]="['/admin/orders', order.id]" class="btn-action view">عرض</a>
                </td>
              </tr>
              <tr *ngIf="recentOrders.length === 0">
                <td colspan="6" class="text-center">لا توجد طلبات حديثة</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats = {
    newOrders: 0,
    monthlySales: 0,
    totalBooks: 0,
    totalCustomers: 0
  };

  recentOrders: any[] = [];

  constructor(private supabase: SupabaseService) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      // Load recent orders
      const { data: orders } = await this.supabase.client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (orders) {
        this.recentOrders = orders;
        this.stats.newOrders = orders.filter((o: any) => o.status === 'pending').length;
        this.stats.monthlySales = orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0); // Simplified for demo
      }

      // Load books count
      const { count: booksCount } = await this.supabase.client
        .from('books')
        .select('*', { count: 'exact', head: true });
      this.stats.totalBooks = booksCount || 0;

    } catch (err) {
      console.error('Error loading dashboard data', err);
    }
  }
}
