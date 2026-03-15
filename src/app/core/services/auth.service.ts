import { Injectable, NgZone } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject } from 'rxjs';
import { User, Session } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { UserProfile } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    private profileSubject = new BehaviorSubject<UserProfile | null>(null);
    private readySubject = new BehaviorSubject<boolean>(false);

    public currentUser$ = this.currentUserSubject.asObservable();
    public profile$ = this.profileSubject.asObservable();
    public ready$ = this.readySubject.asObservable();

    constructor(
        private supabaseService: SupabaseService,
        private router: Router,
        private ngZone: NgZone // 💡 تم حقن NgZone هنا لحل مشكلة التعليق
    ) {
        this.initAuth();
    }

    private initAuth() {
        // 💡 تشغيل التحقق من الجلسة "خارج" Angular لمنع Zone.js من تجميد المتصفح
        this.ngZone.runOutsideAngular(() => {

            // 1. جلب الجلسة الحالية
            this.supabaseService.client.auth.getSession().then(({ data: { session }, error }) => {
                this.ngZone.run(async () => {
                    if (error) console.error('Session Error:', error);

                    if (session?.user) {
                        this.currentUserSubject.next(session.user);
                        await this.loadProfile(session.user.id);
                    }
                    this.readySubject.next(true);
                });
            }).catch(err => {
                this.ngZone.run(() => {
                    console.error('Auth init error:', err);
                    this.readySubject.next(true);
                });
            });

            // 2. مراقبة تغييرات حالة الدخول (أيضاً خارج Angular)
            this.supabaseService.client.auth.onAuthStateChange((_event: string, session: Session | null) => {
                this.ngZone.run(async () => {
                    this.currentUserSubject.next(session?.user ?? null);
                    if (session?.user) {
                        await this.loadProfile(session.user.id);
                    } else {
                        this.profileSubject.next(null);
                    }
                });
            });
        });
    }

    private async loadProfile(userId: string) {
        try {
            const { data, error } = await this.supabaseService.client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            this.profileSubject.next(data as UserProfile);
        } catch (err) {
            console.error('Error loading profile:', err);
            this.profileSubject.next(null);
        }
    }

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    get profile(): UserProfile | null {
        return this.profileSubject.value;
    }

    get isAdmin(): boolean {
        return this.profileSubject.value?.role === 'admin';
    }

    async signIn(email: string, password: string) {
        // تشغيل تسجيل الدخول خارج Angular أيضاً
        return this.ngZone.runOutsideAngular(async () => {
            const result = await this.supabaseService.client.auth.signInWithPassword({ email, password });
            this.ngZone.run(async () => {
                if (result.data?.user) {
                    await this.loadProfile(result.data.user.id);
                }
            });
            return result;
        });
    }

    async signUp(email: string, password: string, fullName: string) {
        return this.ngZone.runOutsideAngular(() => {
            return this.supabaseService.client.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } }
            });
        });
    }

    async signOut() {
        await this.ngZone.runOutsideAngular(() => this.supabaseService.client.auth.signOut());
        this.profileSubject.next(null);
        this.router.navigate(['/']);
    }
}
