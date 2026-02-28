import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Book } from '../../models/book.model';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe, RouterModule],
  template: `
    <div class="book-card">
    <div class="badges">
      <span *ngIf="book.stock === 0" class="badge badge-out-of-stock">نفد</span>
    </div>
    
    <a [routerLink]="['/books', book.id]" class="book-cover">
      <img [src]="book.cover_image || 'assets/images/book-placeholder.svg'" [alt]="book.title" (error)="$event.target && ($any($event.target).src = 'assets/images/book-placeholder.svg')">
    </a>
    
    <div class="book-info">
      <a [routerLink]="['/books', book.id]" class="book-title">{{ book.title }}</a>
      <div class="book-meta">تأليف: {{ book.author?.name || 'مجهول' }}</div>
      
      <div class="book-action">
        <div class="book-price-container">
          <span class="book-price">{{ book.price | currencyFormat }}</span>
        </div>
        <button class="btn-add" (click)="onAddToCart.emit(book)" [disabled]="book.stock === 0" aria-label="أضف للسلة" title="أضف للسلة">
          🛒
        </button>
      </div>
    </div>
  </div>
  `,
  styleUrls: ['./book-card.component.scss']
})
export class BookCardComponent {
  @Input() book!: Book;
  @Output() onAddToCart = new EventEmitter<Book>();
}
