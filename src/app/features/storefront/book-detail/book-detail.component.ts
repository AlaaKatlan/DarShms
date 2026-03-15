import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Book } from '../../../shared/models/book.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CartService } from '../../../core/services/cart.service';
import { AlertService } from '../../../core/services/alert.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
    selector: 'app-book-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, CurrencyFormatPipe, LoaderComponent],
    template: `
    <app-loader [show]="loading"></app-loader>
    <div class="container" *ngIf="book">
      <div class="breadcrumb">
        <a routerLink="/">الكتب</a> / <span>{{ book.title }}</span>
      </div>
      <div class="book-detail-wrapper">
        <div class="book-image">
          <img [src]="book.cover_url || 'assets/images/book-placeholder.svg'" [alt]="book.title">
        </div>
        <div class="book-info">
          <div class="badge" *ngIf="book.age_group">{{ book.age_group }} سنوات</div>
          <h1>{{ book.title }}</h1>
          <p class="author" *ngIf="book.author">تأليف: {{ book.author.name }}</p>

          <div class="meta-info" *ngIf="book.isbn || book.publication_year" style="margin-bottom: 15px; color: var(--text-light); font-size: 0.95rem; line-height: 1.6;">
            <p *ngIf="book.isbn"><strong>الرقم المعياري (ISBN):</strong> {{ book.isbn }}</p>
            <p *ngIf="book.publication_year"><strong>سنة النشر:</strong> {{ book.publication_year }}</p>
          </div>

          <div class="price-section">
            <div>
              <span class="price">{{ (book.discount_price || book.price) | currencyFormat }}</span>
              <span class="old-price" *ngIf="book.discount_price">{{ book.price | currencyFormat }}</span>
            </div>
            <span class="stock-status" [class.in-stock]="book.stock > 0" [class.out-of-stock]="book.stock === 0">
              {{ book.stock > 0 ? 'متوفر (' + book.stock + ')' : 'نفذت الكمية' }}
            </span>
          </div>
          <div class="description" *ngIf="book.description">
            <h3>نبذة عن الكتاب</h3>
            <p>{{ book.description }}</p>
          </div>
          <div class="actions">
            <div class="quantity-control" *ngIf="book.stock > 0">
              <button (click)="decreaseQty()">-</button>
              <input type="number" [(ngModel)]="qty" min="1" [max]="book.stock" readonly>
              <button (click)="increaseQty()">+</button>
            </div>
            <button class="btn btn-gold add-to-cart-btn" (click)="addToCart()" [disabled]="book.stock === 0">
              إضافة إلى السلة
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="container" *ngIf="!book && !loading" style="text-align:center; padding:80px 20px;">
      <h2>الكتاب غير موجود</h2>
      <a routerLink="/" class="btn btn-gold" style="margin-top:20px;">العودة للرئيسية</a>
    </div>
  `,
    styleUrls: ['./book-detail.component.scss']
})
export class BookDetailComponent implements OnInit {
    book: Book | null = null;
    loading = true;
    qty = 1;

    constructor(
        private route: ActivatedRoute,
        private supabase: SupabaseService,
        private cartService: CartService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            // المسار يرسل slug وليس id، इसलिए نعامله كـ slug
            const slug = params.get('id');
            if (slug) this.loadBook(slug);
        });
    }

    async loadBook(slug: string) {
        this.loading = true;
        try {
            // 💡 استخدام getBookBySlug لحل خطأ الـ UUID
            const { data, error } = await this.supabase.getBookBySlug(slug);
            if (error) {
                console.error('Book detail error:', error);
                this.alertService.show('error', 'تعذر تحميل تفاصيل الكتاب');
                return;
            }
            this.book = data as Book;
            console.log('Book loaded:', this.book);
        } catch (err) {
            console.error('Book detail catch:', err);
        } finally {
            this.loading = false;
        }
    }

    increaseQty() { if (this.book && this.qty < this.book.stock) this.qty++; }
    decreaseQty() { if (this.qty > 1) this.qty--; }

    addToCart() {
        if (this.book) {
            this.cartService.addToCart(this.book, this.qty);
            this.alertService.show('success', `تم إضافة "${this.book.title}" إلى السلة`);
            this.qty = 1;
        }
    }
}
