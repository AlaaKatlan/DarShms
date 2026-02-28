import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>إعدادات المتجر</h1>
        <p>قريباً: تكوين المتجر وخيارات العرض</p>
      </div>
      <div class="placeholder-content">هذه الصفحة قيد التطوير</div>
    </div>
  `,
    styles: ['.placeholder-content { padding: 50px; text-align: center; background: white; border-radius: 12px; }']
})
export class SettingsComponent { }
