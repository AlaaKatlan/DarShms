import { Book } from './book.model';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface Order {
    id: string;
    user_id?: string;
    guest_info?: any;
    total_amount: number;
    status: OrderStatus;
    shipping_address: any;
    payment_method?: string;
    notes?: string;
    guest_name?: string;
    guest_phone?: string;
    created_at?: string;
    updated_at?: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    book_id: string;
    quantity: number;
    price_at_purchase?: number;
    price_at_time?: number;
    book?: Book;
    created_at?: string;
}
