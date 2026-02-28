export interface User {
    id: string;
    email: string;
    role: 'admin' | 'customer';
    full_name?: string;
    created_at?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: 'admin' | 'customer';
    created_at: string;
    updated_at: string;
}
