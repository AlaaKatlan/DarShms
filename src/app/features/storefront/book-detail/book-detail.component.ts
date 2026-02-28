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
        <a routerLink="/books">الكتب</a> / <span>{{ book.title }}</span>
      </div>
      
      <div class="book-detail-wrapper">
        <div class="book-image">
          <img [src]="book.cover_image || 'assets/images/author-placeholder.svg'" [alt]="book.title">
        </div>
        
        <div class="book-info">
          <div class="badge" *ngIf="book.category">{{ book.category }}</div>
          <h1>{{ book.title }}</h1>
          <p class="author" *ngIf="book.author">تأليف: {{ book.author.name }}</p>
          
          <div class="price-section">
            <span class="price">{{ book.price | currencyFormat }}</span>
            <span class="stock-status" [class.in-stock]="book.stock > 0" [class.out-of-stock]="book.stock === 0">
              {{ book.stock > 0 ? 'متوفر (' + book.stock + ')' : 'نفذت الكمية' }}
            </span>
          </div>
          
          <div class="description">
            <h3>نبذة عن الكتاب</h3>
            <p>{{ book.description || 'لا يوجد وصف متاح.' }}</p>
          </div>
          
          <div class="actions">
            <div class="quantity-control" *ngIf="book.stock > 0">
              <button (click)="decreaseQuantity()">-</button>
              <input type="number" [(ngModel)]="quantity" min="1" [max]="book.stock" readonly>
              <button (click)="increaseQuantity()">+</button>
            </div>
            
            <button class="btn-primary add-to-cart-btn" (click)="addToCart()" [disabled]="book.stock === 0">
              إضافة إلى السلة
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./book-detail.component.scss']
})
export class BookDetailComponent implements OnInit {
  book: Book | null = null;
  loading = true;
  quantity = 1;

  constructor(
    private route: ActivatedRoute,
    private supabase: SupabaseService,
    private cartService: CartService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadBook(id);
      }
    });
  }

  async loadBook(id: string) {
    this.loading = true;
    try {
      const { data, error } = await this.supabase.client
        .from('books')
        .select('*, author:authors(id, name, biography)')
        .eq('id', id)
        .single();

      if (error) throw error;

      this.book = data as unknown as Book;
    } catch (error) {
      console.error('Error loading book details', error);
      this.alertService.show('error', 'تعذر تحميل تفاصيل الكتاب');
    } finally {
      this.loading = false;
    }
  }

  increaseQuantity() {
    if (this.book && this.quantity < this.book.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    if (this.book) {
      this.cartService.addToCart(this.book, this.quantity);
      this.alertService.show('success', `تم إضافة ${this.quantity} من "${this.book.title}" إلى السلة`);
      this.quantity = 1; // reset after adding
    }
  }
}
