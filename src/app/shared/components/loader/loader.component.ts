import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="loader-overlay" *ngIf="show">
      <div class="spinner"></div>
    </div>
  `,
    styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
    @Input() show: boolean = false;
}
