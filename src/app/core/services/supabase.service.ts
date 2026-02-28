import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    get client(): SupabaseClient {
        return this.supabase;
    }

    // ══════════════════════════════════════════
    // BOOKS - matches public.books schema
    // ══════════════════════════════════════════

    /**
     * Get books with optional author join
     * Filters by is_active=true for storefront
     */
    async getBooks(options?: {
        limit?: number;
        activeOnly?: boolean;
        featuredOnly?: boolean;
        ageGroup?: string;
        search?: string;
    }): Promise<{ data: any[]; error: any }> {
        let query = this.supabase
            .from('books')
            .select(`
                id,
                title,
                slug,
                description,
                price,
                discount_price,
                cover_url,
                preview_pages,
                age_group,
                stock,
                is_featured,
                is_active,
                author_id,
                created_at,
                updated_at,
                author:authors (
                    id,
                    name,
                    slug,
                    photo_url
                )
            `)
            .order('created_at', { ascending: false });

        if (options?.activeOnly !== false) {
            query = query.eq('is_active', true);
        }
        if (options?.featuredOnly) {
            query = query.eq('is_featured', true);
        }
        if (options?.ageGroup) {
            query = query.eq('age_group', options.ageGroup);
        }
        if (options?.search) {
            query = query.ilike('title', `%${options.search}%`);
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('getBooks error:', error);
        }

        return { data: data || [], error };
    }

    /**
     * Get single book by ID with full author info
     */
    async getBookById(id: string): Promise<{ data: any; error: any }> {
        const { data, error } = await this.supabase
            .from('books')
            .select(`
                *,
                author:authors (
                    id,
                    name,
                    slug,
                    bio,
                    photo_url
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('getBookById error:', error);
        }

        return { data, error };
    }

    /**
     * Get single book by slug
     */
    async getBookBySlug(slug: string): Promise<{ data: any; error: any }> {
        const { data, error } = await this.supabase
            .from('books')
            .select(`
                *,
                author:authors (
                    id,
                    name,
                    slug,
                    bio,
                    photo_url
                )
            `)
            .eq('slug', slug)
            .single();

        return { data, error };
    }

    // ══════════════════════════════════════════
    // AUTHORS - matches public.authors schema
    // ══════════════════════════════════════════

    async getAuthors(options?: {
        limit?: number;
        activeOnly?: boolean;
    }): Promise<{ data: any[]; error: any }> {
        let query = this.supabase
            .from('authors')
            .select('*')
            .order('created_at', { ascending: false });

        if (options?.activeOnly !== false) {
            query = query.eq('is_active', true);
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('getAuthors error:', error);
        }

        return { data: data || [], error };
    }

    // ══════════════════════════════════════════
    // ORDERS - matches public.orders schema
    // ══════════════════════════════════════════

    async createOrder(orderData: {
        user_id?: string | null;
        guest_info?: any;
        total_amount: number;
        shipping_address: any;
        payment_method?: string;
        notes?: string;
    }, items: {
        book_id: string;
        quantity: number;
        price_at_purchase: number;
    }[]): Promise<{ data: any; error: any }> {

        // 1. Insert order
        const { data: order, error: orderError } = await this.supabase
            .from('orders')
            .insert({
                user_id: orderData.user_id || null,
                guest_info: orderData.guest_info || null,
                status: 'pending',
                total_amount: orderData.total_amount,
                shipping_address: orderData.shipping_address,
                payment_method: orderData.payment_method || 'cod',
                notes: orderData.notes || null,
            })
            .select()
            .single();

        if (orderError) {
            console.error('createOrder error:', orderError);
            return { data: null, error: orderError };
        }

        // 2. Insert order items
        const orderItems = items.map(item => ({
            order_id: order.id,
            book_id: item.book_id,
            quantity: item.quantity,
            price_at_purchase: item.price_at_purchase,
        }));

        const { error: itemsError } = await this.supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('createOrder items error:', itemsError);
            return { data: order, error: itemsError };
        }

        return { data: order, error: null };
    }

    async getOrders(status?: string): Promise<{ data: any[]; error: any }> {
        let query = this.supabase
            .from('orders')
            .select(`
                *,
                items:order_items (
                    *,
                    book:books (
                        id, title, cover_url, price
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        return { data: data || [], error };
    }

    // ══════════════════════════════════════════
    // PROFILES - matches public.profiles schema
    // ══════════════════════════════════════════

    async getProfile(userId: string): Promise<{ data: any; error: any }> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        return { data, error };
    }

    // ══════════════════════════════════════════
    // STORAGE
    // ══════════════════════════════════════════

    async uploadFile(bucket: string, path: string, file: File): Promise<{ url: string | null; error: any }> {
        const { error } = await this.supabase.storage
            .from(bucket)
            .upload(path, file, { upsert: true });

        if (error) return { url: null, error };

        const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
        return { url: data.publicUrl, error: null };
    }

    // ══════════════════════════════════════════
    // DEBUG HELPER - call this to test connection
    // ══════════════════════════════════════════

    async testConnection(): Promise<void> {
        console.log('=== SUPABASE CONNECTION TEST ===');
        console.log('URL:', environment.supabaseUrl);
        console.log('Key (first 20 chars):', environment.supabaseKey?.substring(0, 20) + '...');

        // Test 1: Simple books query
        const { data: books, error: booksErr } = await this.supabase
            .from('books')
            .select('id, title')
            .limit(3);
        console.log('Books test:', { count: books?.length, error: booksErr?.message, data: books });

        // Test 2: Simple authors query
        const { data: authors, error: authorsErr } = await this.supabase
            .from('authors')
            .select('id, name')
            .limit(3);
        console.log('Authors test:', { count: authors?.length, error: authorsErr?.message, data: authors });

        // Test 3: Books with author join
        const { data: booksJoin, error: joinErr } = await this.supabase
            .from('books')
            .select('id, title, author:authors(id, name)')
            .limit(3);
        console.log('Join test:', { count: booksJoin?.length, error: joinErr?.message, data: booksJoin });

        // Test 4: Auth session
        const { data: session } = await this.supabase.auth.getSession();
        console.log('Auth session:', session?.session ? 'Logged in' : 'Not logged in');

        console.log('=== END TEST ===');
    }
}
