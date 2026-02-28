import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../../shared/models/cart.model';
import { Book } from '../../shared/models/book.model';

@Injectable({ providedIn: 'root' })
export class CartService {
    private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
    public cartItems$ = this.cartItemsSubject.asObservable();

    constructor() { this.loadCart(); }

    private loadCart() {
        try {
            const saved = localStorage.getItem('darshams_cart');
            if (saved) this.cartItemsSubject.next(JSON.parse(saved));
        } catch { this.cartItemsSubject.next([]); }
    }

    private saveCart(items: CartItem[]) {
        localStorage.setItem('darshams_cart', JSON.stringify(items));
        this.cartItemsSubject.next(items);
    }

    get items(): CartItem[] { return this.cartItemsSubject.value; }

    /** Get effective price (discount or regular) */
    getEffectivePrice(book: Book): number {
        return book.discount_price ?? book.price;
    }

    addToCart(book: Book, quantity = 1) {
        const current = [...this.items];
        const existing = current.find(i => i.book.id === book.id);
        if (existing) {
            existing.quantity = Math.min(existing.quantity + quantity, book.stock);
        } else {
            current.push({ book, quantity: Math.min(quantity, book.stock) });
        }
        this.saveCart(current);
    }

    removeFromCart(bookId: string) {
        this.saveCart(this.items.filter(i => i.book.id !== bookId));
    }

    updateQuantity(bookId: string, quantity: number) {
        if (quantity <= 0) { this.removeFromCart(bookId); return; }
        const current = [...this.items];
        const item = current.find(i => i.book.id === bookId);
        if (item) {
            item.quantity = Math.min(quantity, item.book.stock);
            this.saveCart(current);
        }
    }

    clearCart() { this.saveCart([]); }

    get totalItems(): number {
        return this.items.reduce((sum, i) => sum + i.quantity, 0);
    }

    get total(): number {
        return this.items.reduce((sum, i) => sum + this.getEffectivePrice(i.book) * i.quantity, 0);
    }
}
