import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { User, Session } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private supabaseService: SupabaseService, private router: Router) {
        this.initAuth();
    }

    private async initAuth() {
        const { data: { session } } = await this.supabaseService.client.auth.getSession();
        this.currentUserSubject.next(session?.user ?? null);

        this.supabaseService.client.auth.onAuthStateChange((_event: any, session: Session | null) => {
            this.currentUserSubject.next(session?.user ?? null);
        });
    }

    async signIn(email: string, password: string) {
        return this.supabaseService.client.auth.signInWithPassword({ email, password });
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
        this.router.navigate(['/']);
    }

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }
}
