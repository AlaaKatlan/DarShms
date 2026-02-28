import { Injectable } from '@angular/core';
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

    constructor(private supabaseService: SupabaseService, private router: Router) {
        this.initAuth();
    }

    private async initAuth() {
        try {
            const { data: { session } } = await this.supabaseService.client.auth.getSession();
            if (session?.user) {
                this.currentUserSubject.next(session.user);
                await this.loadProfile(session.user.id);
            }
        } catch (err) {
            console.error('Auth init error:', err);
        } finally {
            this.readySubject.next(true);
        }

        this.supabaseService.client.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
            this.currentUserSubject.next(session?.user ?? null);
            if (session?.user) {
                await this.loadProfile(session.user.id);
            } else {
                this.profileSubject.next(null);
            }
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
        const result = await this.supabaseService.client.auth.signInWithPassword({ email, password });
        if (result.data?.user) {
            await this.loadProfile(result.data.user.id);
        }
        return result;
    }

    async signUp(email: string, password: string, fullName: string) {
        return this.supabaseService.client.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });
    }

    async signOut() {
        await this.supabaseService.client.auth.signOut();
        this.profileSubject.next(null);
        this.router.navigate(['/']);
    }
}
