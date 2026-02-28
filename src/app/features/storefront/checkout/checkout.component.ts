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
            <div class="form-group"><label>الاسم الكامل</label><input type="text" [(ngModel)]="shipping.full_name" placeholder="أدخل اسمك الكامل" required></div>
            <div class="form-group"><label>رقم الجوال</label><input type="tel" [(ngModel)]="shipping.phone" placeholder="05xxxxxxxx" required></div>
            <div class="form-group"><label>المدينة</label>
              <select [(ngModel)]="shipping.city" required>
                <option value="">اختر المدينة</option>
                <option value="الشارقة">الشارقة</option>
                <option value="دبي">دبي</option>
                <option value="أبوظبي">أبوظبي</option>
                <option value="عجمان">عجمان</option>
                <option value="رأس الخيمة">رأس الخيمة</option>
                <option value="أم القيوين">أم القيوين</option>
                <option value="الفجيرة">الفجيرة</option>
              </select>
            </div>
            <div class="form-group"><label>المنطقة</label><input type="text" [(ngModel)]="shipping.area" placeholder="اسم المنطقة"></div>
            <div class="form-group"><label>الشارع</label><input type="text" [(ngModel)]="shipping.street" placeholder="اسم الشارع" required></div>
            <div class="form-group"><label>رقم المبنى</label><input type="text" [(ngModel)]="shipping.building" placeholder="رقم المبنى"></div>
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
              <span>{{ (cartService.getEffectivePrice(item.book) * item.quantity) | currencyFormat }}</span>
            </div>
          </div>
          <div class="summary-row"><span>المجموع:</span><span>{{ cartTotal | currencyFormat }}</span></div>
          <div class="summary-row total-row"><span>الإجمالي:</span><span>{{ cartTotal | currencyFormat }}</span></div>
          <button class="btn btn-gold checkout-btn" (click)="placeOrder()" [disabled]="!isFormValid() || loading">تأكيد الطلب</button>
        </div>
      </div>
      <ng-template #emptyCart>
        <div class="empty-state"><h2>السلة فارغة</h2><p>لا يمكنك إتمام الطلب.</p><a routerLink="/books" class="btn btn-gold">العودة للتسوق</a></div>
      </ng-template>
    </div>
  `,
    styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
    loading = false;
    shipping = { full_name: '', phone: '', city: '', area: '', street: '', building: '' };
    paymentMethod = 'cod';

    constructor(
        public cartService: CartService,
        private authService: AuthService,
        private supabase: SupabaseService,
        private alertService: AlertService,
        private router: Router
    ) {}

    ngOnInit() {
        const profile = this.authService.profile;
        if (profile) {
            this.shipping.full_name = profile.full_name || '';
            this.shipping.phone = profile.phone || '';
        }
    }

    get cartItems() { return this.cartService.items; }
    get cartTotal() { return this.cartService.total; }
    isFormValid() { return this.shipping.full_name && this.shipping.phone && this.shipping.city && this.shipping.street; }

    async placeOrder() {
        if (!this.isFormValid()) return;
        this.loading = true;
        try {
            const user = this.authService.currentUser;
            const shippingAddress = {
                full_name: this.shipping.full_name,
                phone: this.shipping.phone,
                city: this.shipping.city,
                area: this.shipping.area,
                street: this.shipping.street,
                building: this.shipping.building
            };

            // Create order with correct JSONB fields
            const { data: orderData, error: orderError } = await this.supabase.client
                .from('orders')
                .insert({
                    user_id: user?.id || null,
                    guest_info: user ? null : { full_name: this.shipping.full_name, phone: this.shipping.phone },
                    total_amount: this.cartTotal,
                    status: 'pending',
                    shipping_address: shippingAddress,
                    payment_method: this.paymentMethod,
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Create order items with correct field name: price_at_purchase
            const orderItems = this.cartItems.map(item => ({
                order_id: orderData.id,
                book_id: item.book.id,
                quantity: item.quantity,
                price_at_purchase: this.cartService.getEffectivePrice(item.book)
            }));

            const { error: itemsError } = await this.supabase.client
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            this.cartService.clearCart();
            this.alertService.show('success', 'تم استلام طلبك بنجاح! رقم الطلب: ' + orderData.id.substring(0, 8));
            this.router.navigate(['/']);
        } catch (error: any) {
            console.error('Checkout error:', error);
            this.alertService.show('error', error.message || 'حدث خطأ أثناء معالجة الطلب');
        } finally { this.loading = false; }
    }
}
