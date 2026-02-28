export interface User {
    id: string;
    email: string;
    role: 'admin' | 'customer';
    full_name?: string;
    created_at?: string;
}
