import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../shared/models/cart.model';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyFormatPipe, FormsModule],
  template: `
    <div class="container cart-page">
      <h1>سلة التسوق</h1>

      <div class="cart-content" *ngIf="cartItems.length > 0; else emptyCart">
        <div class="cart-items">
          <div class="cart-item" *ngFor="let item of cartItems">
            <img [src]="item.book.cover_url || 'assets/images/book-placeholder.svg'" [alt]="item.book.title" class="item-img">

            <div class="item-details">
              <h3><a [routerLink]="['/books', item.book.id]">{{ item.book.title }}</a></h3>
              <p class="price-single">{{ item.book.price | currencyFormat }}</p>
            </div>

            <div class="item-actions">
              <div class="quantity-control">
                <button (click)="updateQuantity(item, item.quantity - 1)">-</button>
                <input type="number" [ngModel]="item.quantity" (ngModelChange)="updateQuantity(item, $event)" min="1" [max]="item.book.stock">
                <button (click)="updateQuantity(item, item.quantity + 1)">+</button>
              </div>
              <button class="remove-btn" (click)="removeItem(item.book.id)">
                حذف
              </button>
            </div>

            <div class="item-total">
              {{ (item.book.price * item.quantity) | currencyFormat }}
            </div>
          </div>
        </div>

        <div class="cart-summary">
          <h3>ملخص الطلب</h3>
          <div class="summary-row">
            <span>المجموع الفرعي:</span>
            <span>{{ total | currencyFormat }}</span>
          </div>
          <div class="summary-row">
            <span>الضريبة (15%):</span>
            <span>{{ (total * 0.15) | currencyFormat }}</span>
          </div>
          <div class="summary-row total-row">
            <span>الإجمالي:</span>
            <span>{{ (total * 1.15) | currencyFormat }}</span>
          </div>

          <button class="btn-primary checkout-btn" (click)="proceedToCheckout()">
            إتمام الطلب
          </button>
        </div>
      </div>

      <ng-template #emptyCart>
        <div class="empty-state">
          <div class="icon-empty">🛒</div>
          <h2>سلة التسوق فارغة</h2>
          <p>لم تقم بإضافة أي كتب إلى سلة التسوق بعد.</p>
          <a routerLink="/books" class="btn-primary mt-3">تصفح الكتب</a>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });
  }

  get total(): number {
    return this.cartService.total;
  }

  updateQuantity(item: CartItem, quantity: number) {
    if (quantity > 0 && quantity <= item.book.stock) {
      this.cartService.updateQuantity(item.book.id, quantity);
    }
  }

  removeItem(bookId: string) {
    this.cartService.removeFromCart(bookId);
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
