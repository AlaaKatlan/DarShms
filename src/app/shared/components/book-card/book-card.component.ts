import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Book } from '../../models/book.model';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';

@Component({
    selector: 'app-book-card',
    standalone: true,
    imports: [CommonModule, CurrencyFormatPipe, RouterModule],
    template: `
    <div class="book-card">
      <div class="badges">
        <span *ngIf="book.is_featured" class="badge badge-featured">مميز</span>
        <span *ngIf="book.stock === 0" class="badge badge-out">نفد</span>
        <span *ngIf="book.discount_price" class="badge badge-sale">خصم</span>
      </div>

      <a [routerLink]="['/books', book.id]" class="book-cover">
        <img [src]="book.cover_url || 'assets/images/book-placeholder.svg'" [alt]="book.title" loading="lazy">
      </a>

      <div class="book-info">
        <a [routerLink]="['/books', book.id]" class="book-title">{{ book.title }}</a>
        <div class="book-meta" *ngIf="book.author">{{ book.author.name }}</div>
        <div class="book-action">
          <div class="book-price-container">
            <span class="book-price">{{ (book.discount_price || book.price) | currencyFormat }}</span>
            <span class="old-price" *ngIf="book.discount_price">{{ book.price | currencyFormat }}</span>
          </div>
          <button class="btn-add" (click)="onAddToCart.emit(book)" [disabled]="book.stock === 0" aria-label="أضف للسلة">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
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
