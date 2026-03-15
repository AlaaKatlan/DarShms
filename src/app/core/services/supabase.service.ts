import { Injectable, NgZone } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private ngZone: NgZone) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          lockType: 'local' // وضعناه local لمنع أقفال المتصفح
        } as any
      }
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // ══════════════════════════════════════════
  // BOOKS
  // ══════════════════════════════════════════

  async getBooks(options?: { limit?: number; activeOnly?: boolean; featuredOnly?: boolean; ageGroup?: string; search?: string; }): Promise<{ data: any[]; error: any }> {
    // 💡 استخدمنا * لجلب كل الأعمدة بما فيها isbn و publication_year
    let query = this.supabase.from('books').select(`*, author:authors (id, name, slug, photo_url)`).order('created_at', { ascending: false });

    if (options?.activeOnly !== false) query = query.eq('is_active', true);
    if (options?.featuredOnly) query = query.eq('is_featured', true);
    if (options?.ageGroup) query = query.eq('age_group', options.ageGroup);
    if (options?.search) query = query.ilike('title', `%${options.search}%`);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) console.error('getBooks error:', error);
    return { data: data || [], error };
  }

  async getBookById(id: string): Promise<{ data: any; error: any }> {
    const { data, error } = await this.supabase.from('books').select(`*, author:authors (id, name, slug, bio, photo_url)`).eq('id', id).single();
    return { data, error };
  }

  async getBookBySlug(slug: string): Promise<{ data: any; error: any }> {
    const { data, error } = await this.supabase.from('books').select(`*, author:authors (id, name, slug, bio, photo_url)`).eq('slug', slug).single();
    return { data, error };
  }

  async updateBook(id: string, updates: any) {
    const { data, error } = await this.supabase.from('books').update({ ...updates, updated_at: new Date() }).eq('id', id).select().single();
    return { data, error };
  }

  // ══════════════════════════════════════════
  // AUTHORS, ORDERS & PROFILES
  // ══════════════════════════════════════════

  async getAuthors(options?: { limit?: number; activeOnly?: boolean; }): Promise<{ data: any[]; error: any }> {
    let query = this.supabase.from('authors').select('*').order('created_at', { ascending: false });
    if (options?.activeOnly !== false) query = query.eq('is_active', true);
    if (options?.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    return { data: data || [], error };
  }

  async createOrder(orderData: any, items: any[]): Promise<{ data: any; error: any }> {
    const { data: order, error: orderError } = await this.supabase.from('orders').insert({ ...orderData, status: 'pending', payment_method: orderData.payment_method || 'cod' }).select().single();
    if (orderError) return { data: null, error: orderError };
    const orderItems = items.map(item => ({ order_id: order.id, book_id: item.book_id, quantity: item.quantity, price_at_purchase: item.price_at_purchase }));
    const { error: itemsError } = await this.supabase.from('order_items').insert(orderItems);
    if (itemsError) return { data: order, error: itemsError };
    return { data: order, error: null };
  }

  async getOrders(status?: string): Promise<{ data: any[]; error: any }> {
    let query = this.supabase.from('orders').select(`*, items:order_items (*, book:books (id, title, cover_url, price))`).order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    return { data: data || [], error };
  }

  async getProfile(userId: string): Promise<{ data: any; error: any }> {
    const { data, error } = await this.supabase.from('profiles').select('*').eq('id', userId).single();
    return { data, error };
  }

  // ══════════════════════════════════════════
  // STORAGE - UPLOAD FILES (Deeper Bypass)
  // ══════════════════════════════════════════

  async uploadFile(bucket: string, path: string, file: File | Blob): Promise<{ url: string | null; error: any }> {
    return new Promise((resolve) => {
      // 1. استخراج التوكن (Token) يدوياً من المتصفح لمنع Supabase من تجميد الجلسة
      let token = environment.supabaseKey;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('auth-token')) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
            if (parsed.access_token) {
              token = parsed.access_token;
              break;
            }
          } catch(e) {}
        }
      }

      // 2. استخدام أداة رفع كلاسيكية ومستقرة لا تتعارض أبداً مع Angular
      const xhr = new XMLHttpRequest();
      const uploadUrl = `${environment.supabaseUrl}/storage/v1/object/${bucket}/${path}`;

      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', environment.supabaseKey);
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      // 3. مراقبة انتهاء الرفع وإرجاع النتيجة
      xhr.onload = () => {
        this.ngZone.run(() => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // الحصول على الرابط العام بعد نجاح الرفع
            const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
            resolve({ url: data.publicUrl, error: null });
          } else {
            console.error("Upload failed with status:", xhr.status, xhr.responseText);
            resolve({ url: null, error: xhr.responseText });
          }
        });
      };

      xhr.onerror = () => {
        this.ngZone.run(() => {
          console.error("Network Error during upload");
          resolve({ url: null, error: 'حدث خطأ في الشبكة أثناء الرفع' });
        });
      };

      // 4. تنفيذ الرفع!
      xhr.send(file);
    });
  }
}
