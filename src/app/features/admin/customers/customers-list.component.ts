import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-customers-list',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>إدارة العملاء</h1>
        <p>قريباً: سجلات العملاء ونشاطاتهم</p>
      </div>
      <div class="placeholder-content">هذه الصفحة قيد التطوير</div>
    </div>
  `,
    styles: ['.placeholder-content { padding: 50px; text-align: center; background: white; border-radius: 12px; }']
})
export class CustomersListComponent { }
