export interface Order {
    id: string;
    user_id: string;
    total_amount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    shipping_address: string;
    guest_name?: string;
    guest_phone?: string;
    created_at?: string;
    items?: OrderItem[];
}

export interface OrderItem {
    id: string;
    order_id: string;
    book_id: string;
    quantity: number;
    price_at_time: number;
    book?: import('./book.model').Book;
}
