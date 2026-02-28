import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Book } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
    public cartItems$ = this.cartItemsSubject.asObservable();

    constructor() {
        this.loadCart();
    }

    private loadCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.cartItemsSubject.next(JSON.parse(savedCart));
        }
    }

    private saveCart(items: CartItem[]) {
        localStorage.setItem('cart', JSON.stringify(items));
        this.cartItemsSubject.next(items);
    }

    get items(): CartItem[] {
        return this.cartItemsSubject.value;
    }

    addToCart(book: Book, quantity: number = 1) {
        const currentItems = [...this.items];
        const existingItem = currentItems.find(item => item.book.id === book.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            currentItems.push({ book, quantity });
        }

        this.saveCart(currentItems);
    }

    removeFromCart(bookId: string) {
        const currentItems = this.items.filter(item => item.book.id !== bookId);
        this.saveCart(currentItems);
    }

    updateQuantity(bookId: string, quantity: number) {
        const currentItems = [...this.items];
        const item = currentItems.find(i => i.book.id === bookId);
        if (item) {
            item.quantity = quantity;
            this.saveCart(currentItems);
        }
    }

    clearCart() {
        this.saveCart([]);
    }

    get total(): number {
        return this.items.reduce((sum, item) => sum + (item.book.price * item.quantity), 0);
    }
}
