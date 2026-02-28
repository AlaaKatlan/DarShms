import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AlertService } from '../../../core/services/alert.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyFormatPipe, LoaderComponent],
  template: `
    <app-loader [show]="loading"></app-loader>
    
    <div class="container checkout-page">
      <h1>إتمام الطلب</h1>
      
      <div class="checkout-layout" *ngIf="cartTotal > 0; else emptyCart">
        <div class="checkout-form">
          <div class="section">
            <h2>معلومات التوصيل</h2>
            
            <div class="form-group">
              <label>الاسم الكامل</label>
              <input type="text" [(ngModel)]="shipping.fullName" placeholder="أدخل اسمك الكامل" required>
            </div>
            
            <div class="form-group">
              <label>رقم الجوال</label>
              <input type="tel" [(ngModel)]="shipping.phone" placeholder="05xxxxxxxx" required>
            </div>
            
            <div class="form-group">
              <label>المدينة</label>
              <select [(ngModel)]="shipping.city" required>
                <option value="">اختر المدينة</option>
                <option value="الرياض">الرياض</option>
                <option value="جدة">جدة</option>
                <option value="الدمام">الدمام</option>
                <option value="مكة المكرمة">مكة المكرمة</option>
                <option value="المدينة المنورة">المدينة المنورة</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>العنوان التفصيلي</label>
              <textarea [(ngModel)]="shipping.addressLines" rows="3" placeholder="اسم الحي، الشارع، رقم المبنى" required></textarea>
            </div>
          </div>
          
          <div class="section">
            <h2>طريقة الدفع</h2>
            <div class="payment-methods">
              <label class="payment-option">
                <input type="radio" name="payment" value="cod" [(ngModel)]="paymentMethod">
                <span>الدفع عند الاستلام</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="order-summary">
          <h2>ملخص الطلب</h2>
          
          <div class="summary-items">
            <div class="summary-item" *ngFor="let item of cartItems">
              <span>{{ item.book.title }} (x{{ item.quantity }})</span>
              <span>{{ (item.book.price * item.quantity) | currencyFormat }}</span>
            </div>
          </div>
          
          <div class="summary-row">
            <span>المجموع الفرعي:</span>
            <span>{{ cartTotal | currencyFormat }}</span>
          </div>
          <div class="summary-row">
            <span>الضريبة (15%):</span>
            <span>{{ taxAmount | currencyFormat }}</span>
          </div>
          <div class="summary-row">
            <span>رسوم التوصيل:</span>
            <span>{{ shippingCost | currencyFormat }}</span>
          </div>
          
          <div class="summary-row total-row">
            <span>الإجمالي:</span>
            <span>{{ finalTotal | currencyFormat }}</span>
          </div>
          
          <button class="btn-primary checkout-btn" (click)="placeOrder()" [disabled]="!isFormValid()">
            تأكيد الطلب
          </button>
        </div>
      </div>
      
      <ng-template #emptyCart>
        <div class="empty-state">
          <h2>الطلب غير متوفر</h2>
          <p>السلة فارغة، لا يمكنك إتمام الطلب.</p>
          <a routerLink="/books" class="btn-primary">العودة للتسوق</a>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  loading = false;

  shipping = {
    fullName: '',
    phone: '',
    city: '',
    addressLines: ''
  };

  paymentMethod = 'cod';
  shippingCost = 25; // Fixed for now

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private supabase: SupabaseService,
    private alertService: AlertService,
    private router: Router
  ) { }

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user) {
      this.shipping.fullName = user.user_metadata?.['full_name'] || '';
    }
  }

  get cartItems() {
    return this.cartService.items;
  }

  get cartTotal() {
    return this.cartService.total;
  }

  get taxAmount() {
    return this.cartTotal * 0.15;
  }

  get finalTotal() {
    return this.cartTotal + this.taxAmount + this.shippingCost;
  }

  isFormValid() {
    return this.shipping.fullName &&
      this.shipping.phone &&
      this.shipping.city &&
      this.shipping.addressLines;
  }

  async placeOrder() {
    if (!this.isFormValid()) return;

    this.loading = true;
    try {
      const user = this.authService.currentUser;
      const fullAddress = `${this.shipping.city} - ${this.shipping.addressLines} (${this.shipping.phone})`;

      // 1. Create order
      const { data: orderData, error: orderError } = await this.supabase.client
        .from('orders')
        .insert({
          user_id: user?.id || null, // Allow guest checkout if nullable, else require login
          total_amount: this.finalTotal,
          status: 'pending',
          shipping_address: fullAddress,
          guest_name: user ? null : this.shipping.fullName,
          guest_phone: user ? null : this.shipping.phone
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = this.cartItems.map(item => ({
        order_id: orderData.id,
        book_id: item.book.id,
        quantity: item.quantity,
        price_at_time: item.book.price
      }));

      const { error: itemsError } = await this.supabase.client
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Success
      this.cartService.clearCart();
      this.alertService.show('success', 'تم استلام طلبك بنجاح! رقم الطلب: ' + orderData.id.substring(0, 8));
      this.router.navigate(['/']); // Or to an order success page

    } catch (error) {
      console.error('Checkout error:', error);
      this.alertService.show('error', 'حدث خطأ أثناء معالجة الطلب، حاول مرة أخرى');
    } finally {
      this.loading = false;
    }
  }
}
