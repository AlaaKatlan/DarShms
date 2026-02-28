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
      <div class="book-cover">
        <a [routerLink]="['/books', book.slug]">
          <img [src]="book.cover_url || 'assets/images/book-placeholder.svg'" [alt]="book.title" loading="lazy">
          <div class="overlay-gradient"></div>
        </a>

        <div class="badges">
          @if (book.is_featured) {
            <span class="badge badge-featured">مميز</span>
          }
          @if (book.discount_price) {
            <span class="badge badge-sale">خصم</span>
          }
          @if (book.stock === 0) {
            <span class="badge badge-out">نفد</span>
          }
        </div>
      </div>

      <div class="book-info">
        <a [routerLink]="['/books', book.slug]" class="book-title" [title]="book.title">{{ book.title }}</a>

        <div class="book-meta">
          @if (book.author) {
            <span class="author-name">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
              {{ book.author.name }}
            </span>
          }
        </div>

        <div class="book-action">
          <div class="book-price-container">
            <span class="book-price">{{ (book.discount_price || book.price) | currencyFormat }}</span>
            @if (book.discount_price) {
              <span class="old-price">{{ book.price | currencyFormat }}</span>
            }
          </div>

          <button class="btn-add"
                  (click)="onAddToCart.emit(book)"
                  [disabled]="book.stock === 0"
                  [attr.aria-label]="book.stock === 0 ? 'نفد من المخزون' : 'أضف للسلة'">
            @if (book.stock === 0) {
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            }
          </button>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['./book-card.component.scss']
})
export class BookCardComponent {
    @Input({ required: true }) book!: Book;
    @Output() onAddToCart = new EventEmitter<Book>();
}
